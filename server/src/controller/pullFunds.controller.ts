import { Request, Response } from "express";
import { prisma } from "../utils/prisma";
import { Decimal } from "@prisma/client/runtime/library";
import fetch from "node-fetch";
import https from "https";
import rawBanks from "../config/bank.json";

const banks: Record<string, string> = rawBanks;

// Configuración para aceptar certificados autofirmados en desarrollo
const httpsAgent = new https.Agent({
    rejectUnauthorized: false
});

export const sendPullFundsRequest = async (req: Request, res: Response) => {
    const { account_number, cedula, monto, bancoDestino, localAccountNumber } = req.body;

    if (!account_number || !cedula || !monto || !bancoDestino) {
        return res.status(400).json({
            status: "NACK",
            error: 'Faltan datos'
        });
    }

    // Obtener URL del banco desde bank.json
    const bankUrl = banks[bancoDestino.codigo];
    if (!bankUrl) {
        return res.status(400).json({
            status: "NACK",
            error: `Banco ${bancoDestino.codigo} no registrado`
        });
    }

    const url = `${bankUrl}/api/pull-funds`;
    console.log(`🌐 Enviando solicitud pull funds a ${bankUrl}`);
    console.log(`📋 Datos: ${JSON.stringify({ account_number, cedula, monto })}`);

    try {
        const respuesta = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                account_number,
                cedula,
                monto
            }),
            agent: httpsAgent
        });

        const data = await respuesta.json() as { status: string; error?: string; message?: string;[key: string]: any };
        console.log(`📥 Respuesta del banco ${bancoDestino.codigo}:`, data);

        // Verificar si la respuesta del banco fue exitosa (ACK)
        if (respuesta.ok && data.status === "ACK") {
            console.log(`✅ ACK recibido del banco ${bancoDestino.codigo}`);

            // Acreditar fondos a la cuenta local
            const cuentaLocal = await prisma.accounts.findUnique({
                where: { number: localAccountNumber }
            });

            if (cuentaLocal) {
                const nuevoSaldo = Number(cuentaLocal.balance) + parseFloat(monto);
                await prisma.accounts.update({
                    where: { number: localAccountNumber },
                    data: { balance: new Decimal(nuevoSaldo) }
                });
                console.log(`💰 Saldo actualizado: ${localAccountNumber} - Nuevo saldo: ₡${nuevoSaldo.toLocaleString()}`);
            }

            return res.status(200).json({
                status: "ACK",
                message: 'Pull funds procesado exitosamente',
                amount: monto,
                currency: cuentaLocal?.currency || 'CRC',
                source_bank: bancoDestino.codigo,
                newBalance: cuentaLocal ? Number(cuentaLocal.balance) + parseFloat(monto) : null
            });

        } else {
            // El banco respondió con NACK o error
            console.log(`❌ NACK o error del banco ${bancoDestino.codigo}:`, data);
            return res.status(400).json({
                status: "NACK",
                error: data.error || 'Error en el banco destino',
                details: data
            });
        }

    } catch (err: any) {
        console.error(`❌ Error de conexión con banco ${bancoDestino.codigo}:`, err.message);
        return res.status(500).json({
            status: "NACK",
            error: 'Error de conexión con el banco destino',
            details: err.message
        });
    }
};

export const handlePullFundsRequest = async (req: Request, res: Response) => {
    const { account_number, cedula, monto } = req.body;

    if (!account_number || !cedula || !monto) {
        return res.status(400).json({
            status: "NACK",
            error: 'Faltan datos requeridos'
        });
    }

    try {
        console.log(`🔍 Pull funds request recibido:`);
        console.log(`   - Cuenta: ${account_number}`);
        console.log(`   - Cédula: ${cedula}`);
        console.log(`   - Monto: ${monto}`);

        // Buscar cuenta por número
        const account = await prisma.accounts.findUnique({
            where: { number: account_number },
            include: {
                user_accounts: {
                    include: {
                        users: true
                    }
                }
            }
        });

        if (!account) {
            console.log(`❌ Cuenta ${account_number} no encontrada`);
            return res.status(404).json({
                status: "NACK",
                error: 'Cuenta no encontrada'
            });
        }

        console.log(`✅ Cuenta encontrada: ${account.number}`);
        console.log(`📋 Usuarios vinculados a la cuenta:`, account.user_accounts.map(ua => ({
            name: ua.users.name,
            national_id: ua.users.national_id,
            email: ua.users.email
        })));

        // Verificar que la cédula coincida con el national_id del usuario
        const userWithCedula = account.user_accounts.find(ua =>
            ua.users.national_id === cedula
        );

        if (!userWithCedula) {
            console.log(`❌ Cédula ${cedula} no autorizada para la cuenta ${account_number}`);
            console.log(`📝 Cédulas válidas para esta cuenta:`, account.user_accounts.map(ua => ua.users.national_id));
            return res.status(403).json({
                status: "NACK",
                error: 'Cédula no autorizada para esta cuenta',
                account_number: account_number,
                provided_cedula: cedula
            });
        }

        console.log(`✅ Cédula ${cedula} autorizada para usuario: ${userWithCedula.users.name}`);

        // Verificar fondos suficientes
        const currentBalance = Number(account.balance);
        const requestedAmount = Number(monto);

        console.log(`💰 Verificación de fondos:`);
        console.log(`   - Saldo actual: ₡${currentBalance.toLocaleString()}`);
        console.log(`   - Monto solicitado: ₡${requestedAmount.toLocaleString()}`);

        if (currentBalance < requestedAmount) {
            console.log(`❌ Fondos insuficientes`);
            return res.status(400).json({
                status: "NACK",
                error: 'Fondos insuficientes',
                available: currentBalance,
                requested: requestedAmount
            });
        }

        // Descontar fondos de la cuenta
        await prisma.accounts.update({
            where: { number: account_number },
            data: {
                balance: { decrement: new Decimal(monto) }
            }
        });

        console.log(`💸 Pull funds procesado exitosamente: ₡${requestedAmount.toLocaleString()} desde cuenta ${account_number}`);
        console.log(`📊 Nuevo saldo: ₡${(currentBalance - requestedAmount).toLocaleString()}`);

        return res.status(200).json({
            status: "ACK",
            message: 'Fondos transferidos exitosamente',
            amount: monto,
            newBalance: currentBalance - requestedAmount,
            currency: account.currency,
            authorized_user: userWithCedula.users.name
        });

    } catch (error: any) {
        console.error(`❌ Error procesando pull funds:`, error.message);
        return res.status(500).json({
            status: "NACK",
            error: 'Error interno del servidor',
            details: error.message
        });
    }
};