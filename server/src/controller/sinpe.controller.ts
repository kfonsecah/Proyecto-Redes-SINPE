import { Request, Response } from "express";
import {
  sendSinpeTransfer,
  findPhoneSubscription,
  findPhoneLinkForUser,
  processSinpeMovilIncoming,
} from "../service/sinpe.service";
import { verifyHmac } from "../service/transaction.service";

export const checkUserSinpeLink = async (req: Request, res: Response) => {
  const { username } = req.params;

  try {
    const result = await findPhoneLinkForUser(username);

    if (!result) {
      return res.json({ linked: false });
    }

    return res.json({
      linked: true,
      phone: result.phone,
      account: result.account,
    });
  } catch (err) {
    console.error("❌ Error en verificación SINPE:", err);
    return res.status(500).json({ error: "Error del servidor" });
  }
};

export const handleSinpeTransfer = async (req: Request, res: Response) => {
  try {
    const {
      version,
      timestamp,
      transaction_id,
      sender,
      receiver,
      amount,
      description,
      hmac_md5,
    } = req.body;

    // Debug: Ver qué tipos de datos estamos recibiendo
    console.log(`🔍 DEBUG Controller - amount object:`, amount);
    console.log(`🔍 DEBUG Controller - amount.value:`, amount?.value);
    console.log(`🔍 DEBUG Controller - amount.value type:`, typeof amount?.value);

    // Validar campos obligatorios
    if (!sender?.phone || !receiver?.phone || !amount?.value || !hmac_md5) {
      return res.status(400).json({ error: "Faltan datos en la solicitud." });
    }

    // Convertir amount.value a número si viene como string
    const amountValue = typeof amount.value === 'string' ? parseFloat(amount.value) : amount.value;
    console.log(`🔍 DEBUG Controller - amount convertido:`, amountValue);
    console.log(`🔍 DEBUG Controller - amount convertido type:`, typeof amountValue);

    if (isNaN(amountValue) || amountValue <= 0) {
      return res.status(400).json({ error: "El monto debe ser un número válido mayor a 0." });
    }

    // Validar HMAC
    const isValid = verifyHmac(
      {
        version,
        timestamp,
        transaction_id,
        sender,
        receiver,
        amount: { ...amount, value: amountValue }, // Usar el monto convertido
        description,
      },
      hmac_md5
    );

    if (!isValid) {
      return res.status(403).json({ error: "HMAC inválido." });
    }

    const transfer = await sendSinpeTransfer(
      sender.phone,
      receiver.phone,
      amountValue, // Usar el monto convertido
      amount.currency,
      description
    );

    // Devolver formato ACK para consistencia
    res.status(200).json({
      transaction_id,
      status: "ACK",
      message: "transferencia procesada"
    });
  } catch (error: any) {
    res
      .status(500)
      .json({ error: error.message || "Error al procesar transferencia." });
  }
};

export const receiveSinpeMovilTransfer = async (req: Request, res: Response) => {
  try {
    const {
      version,
      timestamp,
      transaction_id,
      sender,
      receiver,
      amount,
      description,
      hmac_md5,
    } = req.body;

    console.log("📱 Recibiendo transferencia SINPE Móvil externa:", req.body);

    // Validar campos obligatorios para SINPE Móvil
    if (!sender?.phone_number || !receiver?.phone_number || !amount?.value || !hmac_md5) {
      return res.status(400).json({ error: "Faltan datos en la solicitud SINPE Móvil." });
    }

    // Crear payload para validación HMAC usando phone_number del sender
    const hmacPayload = {
      version,
      timestamp,
      transaction_id,
      sender: {
        phone: sender.phone_number,
        bank_code: sender.bank_code || "external",
        name: sender.name || "Usuario externo"
      },
      receiver: {
        phone: receiver.phone_number,
        account_number: "temp", // Placeholder para cumplir el tipo
        bank_code: "152",
        name: receiver.name || "Usuario local"
      },
      amount,
      description
    };

    // Validar HMAC para transferencias SINPE Móvil
    const { generateHmacForPhoneTransfer } = await import("../utils/generateHmac");
    const expectedHmac = generateHmacForPhoneTransfer(
      sender.phone_number,
      timestamp,
      transaction_id,
      amount.value
    );

    if (expectedHmac !== hmac_md5) {
      console.log("❌ HMAC inválido para transferencia SINPE Móvil entrante");
      console.log("Expected:", expectedHmac);
      console.log("Received:", hmac_md5);
      return res.status(403).json({ error: "HMAC inválido." });
    }

    console.log("✅ HMAC válido para transferencia SINPE Móvil");

    // Procesar la transferencia entrante
    const result = await processSinpeMovilIncoming(
      sender.phone_number,
      receiver.phone_number,
      amount.value,
      amount.currency || "CRC",
      description
    );

    console.log("✅ Transferencia SINPE Móvil entrante procesada exitosamente");

    // Devolver el formato específico que requiere el amigo
    res.status(200).json({
      transaction_id,
      status: "ACK",
      message: "transferencia procesada"
    });

  } catch (error: any) {
    console.error("❌ Error procesando transferencia SINPE Móvil entrante:", error.message);
    res.status(500).json({
      error: error.message || "Error al procesar transferencia SINPE Móvil."
    });
  }
};

export const validatePhone = async (req: Request, res: Response) => {
  const { phone } = req.params;

  try {
    const sub = await findPhoneSubscription(phone);

    if (!sub) {
      return res.status(404).json({ error: "No registrado" });
    }

    return res.json({
      name: sub.sinpe_client_name,
      bank_code: sub.sinpe_bank_code,
    });
  } catch {
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};

export const handleSinpeTransferWithAccount = async (req: Request, res: Response) => {
  try {
    const { senderPhone, receiverPhone, amount, currency, comment, fromAccount } = req.body;

    console.log(`🎯 SINPE con cuenta específica - Datos recibidos:`);
    console.log(`   - Teléfono remitente: ${senderPhone}`);
    console.log(`   - Teléfono receptor: ${receiverPhone}`);
    console.log(`   - Cuenta origen seleccionada: ${fromAccount}`);
    console.log(`   - Monto: ${amount} ${currency}`);

    // Validar campos obligatorios
    if (!senderPhone || !receiverPhone || !amount || !fromAccount) {
      return res.status(400).json({
        error: "Faltan datos: senderPhone, receiverPhone, amount, fromAccount son requeridos"
      });
    }

    const amountValue = typeof amount === 'string' ? parseFloat(amount) : amount;

    if (isNaN(amountValue) || amountValue <= 0) {
      return res.status(400).json({ error: "El monto debe ser un número válido mayor a 0." });
    }

    // 🚨 Usar la nueva función con cuenta específica
    const transfer = await sendSinpeTransfer(
      senderPhone,
      receiverPhone,
      amountValue,
      currency || "CRC",
      comment,
      fromAccount // 🎯 Pasar la cuenta específica seleccionada
    );

    console.log(`✅ Transferencia SINPE completada desde cuenta ${fromAccount}`);

    res.status(200).json({
      success: true,
      message: "Transferencia SINPE procesada exitosamente",
      transfer_id: (transfer as any)?.id || (transfer as any)?.transaction_id || "completed",
      from_account: fromAccount,
      amount: amountValue,
      currency: currency || "CRC"
    });

  } catch (error: any) {
    console.error("❌ Error en transferencia SINPE con cuenta específica:", error.message);
    res.status(500).json({
      error: error.message || "Error al procesar transferencia SINPE."
    });
  }
};
