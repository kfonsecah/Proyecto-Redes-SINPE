import crypto from "crypto";
import { prisma } from "../utils/prisma";
import { Decimal } from "@prisma/client/runtime/library";
import fetch from "node-fetch";
import https from "https";
import rawBanks from "../config/bank.json";
import {
  generateHmacForAccountTransfer,
  generateHmacForPhoneTransfer,
} from "../utils/generateHmac";

const LOCAL_BANK_CODE = "152";

// Configuración para aceptar certificados autofirmados en desarrollo
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

interface Sender {
  account_number?: string;
  phone?: string;
  bank_code: string;
  name: string;
}

interface Receiver {
  account_number: string;
  bank_code: string;
  name: string;
}

interface Amount {
  value: number;
  currency: string;
}

export interface TransferPayload {
  version: string;
  timestamp: string;
  transaction_id: string;
  sender: Sender;
  receiver: Receiver;
  amount: Amount;
  description: string;
  hmac_md5?: string;
}

const banks: Record<string, string> = rawBanks;

// Extrae el código de banco de un IBAN (posición 6 a 9)
const getBankCode = (accountNumber: string): string =>
  accountNumber.substring(5, 8);

const isExternalBank = (bankCode: string): boolean =>
  bankCode !== LOCAL_BANK_CODE;

const isSenderLocal = (senderBankCode: string): boolean =>
  senderBankCode === LOCAL_BANK_CODE;

export const verifyHmac = (data: TransferPayload, receivedHmac: string): boolean => {
  let expected: string;

  if (data.sender.phone) {
    expected = generateHmacForPhoneTransfer(
      data.sender.phone,
      data.timestamp,
      data.transaction_id,
      data.amount.value
    );
  } else if (data.sender.account_number) {
    expected = generateHmacForAccountTransfer(
      data.sender.account_number,
      data.timestamp,
      data.transaction_id,
      data.amount.value
    );
  } else {
    throw new Error("Sender no tiene un identificador válido para HMAC.");
  }

  const valid = expected === receivedHmac;
  console.log(`🧾 HMAC válido: ${valid}`);
  return valid;
};

export const logTransaction = (transaction: object): void => {
  console.log("📦 Transacción recibida:");
  console.log(JSON.stringify(transaction, null, 2));
};

const ensureCurrencyExists = async (currency: string) => {
  await prisma.currencies.upsert({
    where: { code: currency },
    update: {},
    create: {
      code: currency,
      name:
        currency === "CRC"
          ? "Costa Rican Colón"
          : currency === "USD"
            ? "US Dollar"
            : currency === "EUR"
              ? "Euro"
              : currency,
    },
  });
};

const getOrCreateSystemAccount = async (
  accountNumber: string,
  currency: string,
  initialBalance: number = 999999999
) => {
  let systemAccount = await prisma.accounts.findUnique({
    where: { number: accountNumber },
  });

  if (!systemAccount) {
    console.log(`📝 Creando cuenta del sistema: ${accountNumber}`);

    await ensureCurrencyExists(currency);

    systemAccount = await prisma.accounts.create({
      data: {
        number: accountNumber,
        currency: currency,
        balance: new Decimal(initialBalance),
      },
    });
    console.log(`✅ Cuenta del sistema ${accountNumber} creada con ID: ${systemAccount.id}`);
  }

  return systemAccount;
};

export const processInternalTransfer = async (transaction: TransferPayload) => {
  const { sender, receiver, amount } = transaction;

  console.log("🏠 Procesando transferencia interna");
  console.log(`💰 DEBUG - Datos de transferencia:`, {
    fromAccount: sender.account_number,
    toAccount: receiver.account_number,
    amount: amount.value,
    currency: amount.currency
  });

  const from = await prisma.accounts.findUnique({
    where: { number: sender.account_number! },
  });

  const to = await prisma.accounts.findUnique({
    where: { number: receiver.account_number },
  });

  if (!from || !to) {
    throw new Error("Cuenta origen o destino no existe.");
  }

  if (from.currency !== amount.currency || to.currency !== amount.currency) {
    throw new Error("Moneda no coincide con las cuentas.");
  }

  // MEJORAR VALIDACIÓN DE FONDOS CON MANEJO CORRECTO DE DECIMALES
  let currentBalance: number;

  // Manejar diferentes tipos de balance (Decimal o number)
  if (from.balance instanceof Decimal) {
    currentBalance = from.balance.toNumber();
  } else if (typeof from.balance === 'string') {
    currentBalance = parseFloat(from.balance);
  } else {
    currentBalance = Number(from.balance);
  }

  const transferAmount = typeof amount.value === 'string' ? parseFloat(amount.value) : Number(amount.value);

  console.log(`💰 VALIDACIÓN DE FONDOS TRANSFERENCIA NORMAL:`);
  console.log(`   - Cuenta origen: ${from.number}`);
  console.log(`   - Balance actual: ${currentBalance} ${amount.currency}`);
  console.log(`   - Monto a transferir: ${transferAmount} ${amount.currency}`);
  console.log(`   - Balance tipo: ${typeof currentBalance}`);
  console.log(`   - Amount tipo: ${typeof transferAmount}`);
  console.log(`   - Fondos suficientes: ${currentBalance >= transferAmount}`);

  // Validación más robusta de fondos
  if (isNaN(currentBalance) || isNaN(transferAmount)) {
    throw new Error("Error en la conversión de montos. Contacte al administrador.");
  }

  if (currentBalance < transferAmount) {
    throw new Error(`Fondos insuficientes. Balance: ₡${currentBalance.toLocaleString()} | Requerido: ₡${transferAmount.toLocaleString()}`);
  }

  console.log(`✅ Fondos suficientes validados correctamente para transferencia normal`);

  await ensureCurrencyExists(amount.currency);

  await prisma.$transaction([
    prisma.transfers.create({
      data: {
        from_account_id: from.id,
        to_account_id: to.id,
        amount: new Decimal(amount.value),
        currency: amount.currency,
        status: "completed",
        description: transaction.description?.substring(0, 20) || "Internal transfer",
      },
    }),
    prisma.accounts.update({
      where: { id: from.id },
      data: {
        balance: { decrement: new Decimal(amount.value) },
      },
    }),
    prisma.accounts.update({
      where: { id: to.id },
      data: {
        balance: { increment: new Decimal(amount.value) },
      },
    }),
  ]);

  console.log("✅ Transferencia interna completada");
};

export const processOutgoingDebit = async (transaction: TransferPayload) => {
  const { sender, receiver, amount } = transaction;

  console.log("💸 Validando fondos para débito saliente:", sender.account_number);

  const from = await prisma.accounts.findUnique({
    where: { number: sender.account_number! },
  });

  if (!from) {
    throw new Error("Cuenta origen no existe en este banco.");
  }

  if (from.currency !== amount.currency) {
    throw new Error("Moneda no coincide con la cuenta origen.");
  }

  // APLICAR EL MISMO FIX DE VALIDACIÓN DE FONDOS
  let currentBalance: number;

  // Manejar diferentes tipos de balance (Decimal o number)
  if (from.balance instanceof Decimal) {
    currentBalance = from.balance.toNumber();
  } else if (typeof from.balance === 'string') {
    currentBalance = parseFloat(from.balance);
  } else {
    currentBalance = Number(from.balance);
  }

  const transferAmount = typeof amount.value === 'string' ? parseFloat(amount.value) : Number(amount.value);

  console.log(`💰 VALIDACIÓN DE FONDOS TRANSFERENCIA EXTERNA:`);
  console.log(`   - Cuenta origen: ${from.number}`);
  console.log(`   - Balance actual: ${currentBalance} ${amount.currency}`);
  console.log(`   - Monto a transferir: ${transferAmount} ${amount.currency}`);
  console.log(`   - Fondos suficientes: ${currentBalance >= transferAmount}`);

  // Validación más robusta de fondos
  if (isNaN(currentBalance) || isNaN(transferAmount)) {
    throw new Error("Error en la conversión de montos. Contacte al administrador.");
  }

  if (currentBalance < transferAmount) {
    throw new Error(`Fondos insuficientes. Balance: ₡${currentBalance.toLocaleString()} | Requerido: ₡${transferAmount.toLocaleString()}`);
  }

  await ensureCurrencyExists(amount.currency);

  // Buscar o crear cuenta del sistema fija para transferencias externas
  let systemAccount = await prisma.accounts.findFirst({
    where: { number: "SYS-EXTERNAL" },
  });

  if (!systemAccount) {
    systemAccount = await prisma.accounts.create({
      data: {
        number: "SYS-EXTERNAL",
        currency: amount.currency,
        balance: new Decimal(999999999),
      },
    });
    console.log(`📝 Cuenta del sistema creada: SYS-EXTERNAL con ID: ${systemAccount.id}`);
  }

  // Registrar la transferencia externa saliente como pendiente
  const transferRecord = await prisma.transfers.create({
    data: {
      from_account_id: from.id,
      to_account_id: systemAccount.id,
      amount: new Decimal(amount.value),
      currency: amount.currency,
      status: "pending",
      description: `To ${getBankCode(receiver.account_number)}`,
    },
  });

  console.log(`📝 Transferencia externa saliente registrada con ID: ${transferRecord.id}`);
  console.log("✅ Fondos suficientes validados - pendiente de confirmación externa");

  return { from, transferRecord };
};

export const processIncomingCredit = async (transaction: TransferPayload) => {
  const { sender, receiver, amount } = transaction;

  console.log("💰 Procesando crédito entrante:", receiver.account_number);

  const to = await prisma.accounts.findUnique({
    where: { number: receiver.account_number },
  });

  if (!to) {
    throw new Error("Cuenta destino no existe.");
  }

  await ensureCurrencyExists(amount.currency);

  // Buscar o crear cuenta del sistema fija para transferencias externas
  let systemAccount = await prisma.accounts.findFirst({
    where: { number: "SYS-EXTERNAL" },
  });

  if (!systemAccount) {
    systemAccount = await prisma.accounts.create({
      data: {
        number: "SYS-EXTERNAL",
        currency: amount.currency,
        balance: new Decimal(999999999),
      },
    });
    console.log(`📝 Cuenta del sistema creada: SYS-EXTERNAL con ID: ${systemAccount.id}`);
  }

  // Registrar la transferencia externa entrante como completada
  const transferRecord = await prisma.transfers.create({
    data: {
      from_account_id: systemAccount.id,
      to_account_id: to.id,
      amount: new Decimal(amount.value),
      currency: amount.currency,
      status: "completed",
      description: `From ${sender.bank_code}`,
    },
  });

  await prisma.accounts.update({
    where: { id: to.id },
    data: {
      balance: { increment: new Decimal(amount.value) },
    },
  });

  console.log(`📝 Transferencia externa entrante registrada con ID: ${transferRecord.id}`);
  console.log("✅ Crédito entrante procesado");
};

const sendToExternalBank = async (
  transaction: TransferPayload,
  bankCode: string
) => {
  const url = banks[bankCode];
  if (!url) {
    throw new Error(`Banco ${bankCode} no registrado.`);
  }

  console.log(`🌐 Enviando transferencia a banco ${bankCode}: ${url}`);

  const response = await fetch(`${url}/api/sinpe-transfer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(transaction),
    agent: httpsAgent,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error del banco ${bankCode}: ${response.status} - ${errorText}`);
  }

  const result = await response.json();

  // Solo validar que el status sea ACK, sin importar el resto de la estructura
  const resultData = result as { status: string; message?: string };
  if (resultData.status === "ACK") {
    console.log(`✅ ACK recibido del banco ${bankCode}:`, result);
    return result;
  } else if (resultData.status === "NACK") {
    console.log(`❌ NACK recibido del banco ${bankCode}:`, result);
    throw new Error(`Transferencia rechazada por el banco ${bankCode}: ${resultData.message || 'Sin mensaje de error'}`);
  } else {
    console.log(`⚠️ Respuesta inesperada del banco ${bankCode}:`, result);
    throw new Error(`Respuesta inválida del banco ${bankCode}. Esperaba ACK/NACK pero recibí status: ${resultData.status}`);
  }
};

export const routeTransfer = async (transaction: TransferPayload) => {
  const senderBankCode = getBankCode(transaction.sender.account_number!);
  const receiverBankCode = getBankCode(transaction.receiver.account_number);

  console.log(
    `🏦 Enrutando transferencia: ${senderBankCode} → ${receiverBankCode} (Local: ${LOCAL_BANK_CODE})`
  );

  if (!isExternalBank(senderBankCode) && !isExternalBank(receiverBankCode)) {
    console.log("📍 Caso: Transferencia interna");
    await processInternalTransfer(transaction);
    return { message: "Transferencia interna procesada correctamente." };
  }

  if (isSenderLocal(senderBankCode) && isExternalBank(receiverBankCode)) {
    console.log("📍 Caso: Transferencia saliente");

    // Solo validar fondos, NO descontar aún
    const { from, transferRecord } = await processOutgoingDebit(transaction);

    try {
      // Enviar al banco externo y esperar ACK
      const result = await sendToExternalBank(transaction, receiverBankCode);

      // Solo AHORA descontar los fondos después de confirmar ACK
      await prisma.accounts.update({
        where: { id: from.id },
        data: {
          balance: { decrement: new Decimal(transaction.amount.value) },
        },
      });

      // Actualizar el estado de la transferencia a completada
      await prisma.transfers.update({
        where: { id: transferRecord.id },
        data: { status: "completed" },
      });

      console.log(`💸 Fondos descontados después de ACK confirmado: ${transaction.amount.value} ${transaction.amount.currency}`);

      return {
        message: "Transferencia saliente procesada correctamente.",
        external_result: result,
      };
    } catch (error) {
      console.error("❌ Error en transferencia externa - fondos NO descontados:", error);
      throw error; // Los fondos nunca se descontaron
    }
  }

  if (isExternalBank(senderBankCode) && !isExternalBank(receiverBankCode)) {
    console.log("📍 Caso: Transferencia entrante");
    await processIncomingCredit(transaction);
    return { message: "Transferencia entrante procesada correctamente." };
  }

  throw new Error("Transferencia de tránsito no permitida en este banco.");
};

// Compatibilidad
export const processTransfer = processInternalTransfer;
export const createExternalCredit = processIncomingCredit;
