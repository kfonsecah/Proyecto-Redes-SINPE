import { sinpe as prismaSinpe } from "../prisma/sinpeClient";
import { bccr as prismaBccr } from "../prisma/bccrClient";
import { Decimal } from "@prisma/client/runtime/library";
import https from "https";
import fetch from "node-fetch";

// Configuración para aceptar certificados autofirmados en desarrollo
const httpsAgent = new https.Agent({
  rejectUnauthorized: false // Solo para desarrollo - acepta certificados autofirmados
});

export const findPhoneLinkForUser = async (username: string) => {
  // Buscar al usuario por nombre
  const user = await prismaSinpe.users.findUnique({
    where: { name: username },
    select: {
      id: true,
      user_accounts: {
        select: {
          accounts: {
            select: { number: true },
          },
        },
      },
    },
  });

  if (!user) {
    throw new Error("Usuario no encontrado");
  }

  // Buscar si alguna cuenta tiene vínculo en phone_links
  for (const ua of user.user_accounts) {
    const accountNumber = ua.accounts.number;

    const phoneLink = await prismaSinpe.phone_links.findUnique({
      where: { account_number: accountNumber },
    });

    if (phoneLink) {
      return {
        phone: phoneLink.phone,
        account: accountNumber,
      };
    }
  }

  return null;
};

export const findPhoneSubscription = async (phone: string) => {
  return await prismaBccr.sinpe_subscriptions.findUnique({
    where: { sinpe_number: phone },
    select: {
      sinpe_number: true,
      sinpe_bank_code: true,
      sinpe_client_name: true,
    },
  });
};

export const sendSinpeTransfer = async (
  senderPhone: string,
  receiverPhone: string,
  amount: number,
  currency: string,
  comment?: string,
  specificAccountNumber?: string // 🚨 NUEVO PARÁMETRO para cuenta específica
) => {
  // 1. Validar que el número receptor esté registrado en BCCR
  const subscription = await prismaBccr.sinpe_subscriptions.findUnique({
    where: { sinpe_number: receiverPhone },
  });

  if (!subscription) {
    throw new Error("El número de destino no está registrado en SINPE Móvil.");
  }

  console.log(`📱 Receptor encontrado en BCCR: ${subscription.sinpe_client_name} (Banco: ${subscription.sinpe_bank_code})`);

  // 2. Verificar si es transferencia interna o externa
  const receiverBankCode = subscription.sinpe_bank_code;
  const LOCAL_BANK_CODE = "152";
  const isInternalTransfer = receiverBankCode === LOCAL_BANK_CODE;

  console.log(`🏦 Tipo de transferencia: ${isInternalTransfer ? 'Interna' : 'Externa'} (${LOCAL_BANK_CODE} → ${receiverBankCode})`);

  // 3. 🚨 BUSCAR CUENTA ESPECÍFICA O USAR LA VINCULADA AL TELÉFONO
  let fromAccount: any = null;

  if (specificAccountNumber) {
    // Usar la cuenta específica seleccionada por el usuario
    console.log(`🎯 Usando cuenta específica seleccionada: ${specificAccountNumber}`);

    fromAccount = await prismaSinpe.accounts.findUnique({
      where: { number: specificAccountNumber },
    });

    if (!fromAccount) {
      throw new Error(`La cuenta seleccionada ${specificAccountNumber} no existe.`);
    }

    // Verificar que el usuario tiene acceso a esta cuenta
    const senderLink = await prismaSinpe.phone_links.findUnique({
      where: { phone: senderPhone },
    });

    if (!senderLink) {
      throw new Error("Su número no está vinculado a SINPE Móvil.");
    }

    console.log(`✅ Cuenta específica encontrada: ${fromAccount.number} (Balance: ${fromAccount.balance} ${fromAccount.currency})`);
  } else {
    // Usar la cuenta vinculada al teléfono (comportamiento anterior)
    console.log(`📞 Usando cuenta vinculada al teléfono: ${senderPhone}`);

    const senderLink = await prismaSinpe.phone_links.findUnique({
      where: { phone: senderPhone },
    });

    if (!senderLink) {
      throw new Error("Su número no está vinculado a ninguna cuenta. Configure SINPE Móvil primero.");
    }

    fromAccount = await prismaSinpe.accounts.findUnique({
      where: { number: senderLink.account_number },
    });

    if (!fromAccount) {
      throw new Error("La cuenta origen vinculada al número remitente no existe.");
    }
  }

  // 4. VALIDAR FONDOS EN LA CUENTA CORRECTA
  let currentBalance: number;

  if (fromAccount.balance instanceof Decimal) {
    currentBalance = fromAccount.balance.toNumber();
  } else if (typeof fromAccount.balance === 'string') {
    currentBalance = parseFloat(fromAccount.balance);
  } else {
    currentBalance = Number(fromAccount.balance);
  }

  const transferAmount = typeof amount === 'string' ? parseFloat(amount) : Number(amount);

  console.log(`💰 VALIDACIÓN DE FONDOS EN CUENTA SELECCIONADA:`);
  console.log(`   - Cuenta origen: ${fromAccount.number}`);
  console.log(`   - Balance actual: ${currentBalance} ${currency}`);
  console.log(`   - Monto a enviar: ${transferAmount} ${currency}`);
  console.log(`   - Fondos suficientes: ${currentBalance >= transferAmount}`);

  if (isNaN(currentBalance) || isNaN(transferAmount)) {
    throw new Error("Error en la conversión de montos. Contacte al administrador.");
  }

  if (currentBalance < transferAmount) {
    throw new Error(`Fondos insuficientes en cuenta ${fromAccount.number}. Balance: ₡${currentBalance.toLocaleString()} | Requerido: ₡${transferAmount.toLocaleString()}`);
  }

  console.log(`✅ Fondos suficientes validados en cuenta ${fromAccount.number}`);

  // 5. Procesar según tipo de transferencia
  if (isInternalTransfer) {
    console.log("🏠 Procesando transferencia SINPE interna - acreditando al receptor");

    // Buscar cuenta destino en nuestro banco
    const receiverLink = await prismaSinpe.phone_links.findUnique({
      where: { phone: receiverPhone },
    });

    if (!receiverLink) {
      throw new Error("No existe una cuenta vinculada al número receptor en este banco.");
    }

    const toAccount = await prismaSinpe.accounts.findUnique({
      where: { number: receiverLink.account_number },
    });

    if (!toAccount) {
      throw new Error("La cuenta destino no existe.");
    }

    // 🚨 DESCONTAR FONDOS DE LA CUENTA ESPECÍFICA SELECCIONADA
    const transferAmountDecimal = new Decimal(amount);

    await prismaSinpe.accounts.update({
      where: { id: fromAccount.id }, // 🎯 Usar fromAccount que ya es la cuenta específica
      data: { balance: { decrement: transferAmountDecimal } },
    });
    console.log(`💸 Fondos descontados de la cuenta ESPECÍFICA ${fromAccount.number}: ${amount} ${currency}`);

    // Acreditar fondos al receptor
    await prismaSinpe.accounts.update({
      where: { id: toAccount.id },
      data: { balance: { increment: transferAmountDecimal } },
    });

    console.log(`💰 Fondos acreditados a la cuenta ${toAccount.number}: ${amount} ${currency}`);

    // Registrar transferencia interna
    const transfer = await prismaSinpe.transfers.create({
      data: {
        from_account_id: fromAccount.id, // 🎯 Usar la cuenta específica
        to_account_id: toAccount.id,
        amount: transferAmountDecimal,
        currency,
        description: comment ?? "Transferencia SINPE Móvil",
        status: "completed",
      },
    });

    console.log(`✅ Transferencia SINPE interna completada desde cuenta específica ${fromAccount.number}`);
    return transfer;

  } else {
    console.log("🌐 Procesando transferencia SINPE externa - enviando a otro banco");

    // Construir payload firmado en el formato específico para SINPE Móvil
    const payload_firmado = {
      version: "1.0",
      timestamp: new Date().toISOString(),
      transaction_id: `sinpe-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      sender: {
        phone_number: senderPhone
      },
      receiver: {
        phone_number: receiverPhone
      },
      amount: {
        value: amount,
        currency: currency || "CRC"
      },
      description: comment || "Transferencia SINPE Móvil"
    };

    console.log("📦 Payload construido para banco externo:", payload_firmado);

    // Generar HMAC para SINPE Móvil
    const { generateHmacForPhoneTransfer } = await import("../utils/generateHmac");
    const hmac_md5 = generateHmacForPhoneTransfer(
      senderPhone,
      payload_firmado.timestamp,
      payload_firmado.transaction_id,
      amount
    );

    const finalPayload = {
      ...payload_firmado,
      hmac_md5
    };

    console.log("🔐 HMAC generado para transferencia SINPE Móvil");

    // Enviar al banco externo
    try {
      const bankUrl = await import("../config/bank.json");
      const banks: Record<string, string> = bankUrl.default;
      const externalBankUrl = banks[receiverBankCode];

      if (!externalBankUrl) {
        throw new Error(`Banco ${receiverBankCode} no registrado en la configuración.`);
      }

      console.log(`🌐 Enviando transferencia SINPE a banco ${receiverBankCode}: ${externalBankUrl}`);

      const response = await fetch(`${externalBankUrl}/api/sinpe-movil-transfer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalPayload),
        agent: httpsAgent,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error del banco ${receiverBankCode}: ${response.status} - ${errorText}`);
      }

      const result = await response.json();

      const resultData = result as { status: string; message?: string };
      if (resultData.status === "ACK") {
        console.log(`✅ ACK SINPE Móvil recibido del banco ${receiverBankCode}:`, result);

        // Buscar o crear cuenta del sistema fija para transferencias SINPE externas
        let systemAccount = await prismaSinpe.accounts.findFirst({
          where: { number: "SYS-EXTERNAL" },
        });

        if (!systemAccount) {
          systemAccount = await prismaSinpe.accounts.create({
            data: {
              number: "SYS-EXTERNAL",
              currency: currency,
              balance: new Decimal(999999999),
            },
          });
          console.log(`📝 Cuenta del sistema creada: SYS-EXTERNAL con ID: ${systemAccount.id}`);
        }

        // Registrar la transferencia SINPE saliente usando la cuenta específica
        const transferRecord = await prismaSinpe.transfers.create({
          data: {
            from_account_id: fromAccount.id, // 🎯 Usar la cuenta específica seleccionada
            to_account_id: systemAccount.id,
            amount: new Decimal(amount),
            currency: currency,
            status: "completed",
            description: `SINPE to ${receiverBankCode}`.substring(0, 20),
          },
        });

        // 🚨 DESCONTAR FONDOS DE LA CUENTA ESPECÍFICA (después de confirmar ACK)
        const transferAmountDecimal = new Decimal(amount);
        await prismaSinpe.accounts.update({
          where: { id: fromAccount.id }, // 🎯 Usar fromAccount que es la cuenta específica
          data: { balance: { decrement: transferAmountDecimal } },
        });
        console.log(`💸 Fondos descontados de la cuenta ESPECÍFICA ${fromAccount.number}: ${amount} ${currency}`);
        console.log(`📝 Transferencia SINPE externa registrada con ID: ${transferRecord.id}`);

        return {
          id: transferRecord.id,
          from_account_id: fromAccount.id,
          to_account_id: systemAccount.id,
          amount: new Decimal(amount),
          currency,
          description: comment ?? `Transferencia SINPE a ${receiverPhone} (${subscription?.sinpe_client_name})`,
          status: "completed",
          external_transfer: true,
          receiver_bank: receiverBankCode,
          receiver_phone: receiverPhone,
          receiver_name: subscription?.sinpe_client_name,
          external_result: result,
          ack_received: true
        };

      } else if (resultData.status === "NACK") {
        console.log(`❌ NACK SINPE Móvil recibido del banco ${receiverBankCode}:`, result);
        throw new Error(`Transferencia SINPE rechazada por el banco ${receiverBankCode}: ${resultData.message || 'Sin mensaje de error'}`);
      } else {
        console.log(`⚠️ Respuesta SINPE inesperada del banco ${receiverBankCode}:`, result);
        throw new Error(`Respuesta inválida del banco ${receiverBankCode}. Esperaba ACK/NACK pero recibí status: ${resultData.status}`);
      }

    } catch (error) {
      console.error("❌ Error enviando transferencia SINPE externa:", error);
      throw error;
    }
  }
};

export const processSinpeMovilIncoming = async (
  senderPhone: string,
  receiverPhone: string,
  amount: number,
  currency: string,
  description?: string
) => {
  console.log(`💰 Procesando transferencia SINPE Móvil entrante: ${senderPhone} → ${receiverPhone} (${amount} ${currency})`);

  // Buscar si el receptor tiene cuenta vinculada en nuestro banco
  const receiverLink = await prismaSinpe.phone_links.findUnique({
    where: { phone: receiverPhone },
  });

  if (!receiverLink) {
    throw new Error("El número receptor no está vinculado a ninguna cuenta en este banco.");
  }

  // Obtener la cuenta destino
  const toAccount = await prismaSinpe.accounts.findUnique({
    where: { number: receiverLink.account_number },
  });

  if (!toAccount) {
    throw new Error("La cuenta destino no existe.");
  }

  // Validar que la moneda coincida
  if (toAccount.currency !== currency) {
    throw new Error(`La cuenta destino es en ${toAccount.currency}, pero la transferencia es en ${currency}.`);
  }

  // Buscar o crear cuenta del sistema fija para transferencias SINPE entrantes
  let systemAccount = await prismaSinpe.accounts.findFirst({
    where: { number: "SYS-EXTERNAL" },
  });

  if (!systemAccount) {
    systemAccount = await prismaSinpe.accounts.create({
      data: {
        number: "SYS-EXTERNAL",
        currency: currency,
        balance: new Decimal(999999999),
      },
    });
    console.log(`📝 Cuenta del sistema creada: SYS-EXTERNAL con ID: ${systemAccount.id}`);
  }

  // Registrar la transferencia SINPE entrante usando la cuenta del sistema
  const transferRecord = await prismaSinpe.transfers.create({
    data: {
      from_account_id: systemAccount.id,
      to_account_id: toAccount.id,
      amount: new Decimal(amount),
      currency: currency,
      status: "completed",
      description: `SINPE from ${senderPhone}`.substring(0, 20),
    },
  });

  // Acreditar fondos al receptor
  await prismaSinpe.accounts.update({
    where: { id: toAccount.id },
    data: { balance: { increment: new Decimal(amount) } },
  });

  console.log(`💰 Fondos acreditados a la cuenta ${toAccount.number}: ${amount} ${currency}`);
  console.log(`📝 Transferencia SINPE entrante registrada con ID: ${transferRecord.id}`);
  console.log(`✅ Transferencia SINPE Móvil entrante completada para ${toAccount.number}`);

  return {
    recipient_account: toAccount.number,
    amount_credited: amount,
    currency,
    status: "completed",
    transfer_id: transferRecord.id,
    message: `Transferencia SINPE desde ${senderPhone} procesada exitosamente`
  };
};
