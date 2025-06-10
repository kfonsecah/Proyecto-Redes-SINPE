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
        return res.status(400).json({ error: 'Faltan datos' });
    }

    // Obtener URL del banco desde bank.json
    const bankUrl = banks[bancoDestino.codigo];
    if (!bankUrl) {
        return res.status(400).json({ error: `Banco ${bancoDestino.codigo} no registrado` });
    }

    const url = `${bankUrl}/api/pull-funds`;
    console.log(`Enviando solicitud pull funds a ${bankUrl}`);
    console.log(`Datos: ${JSON.stringify({ account_number, cedula, monto })}`);

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

        const data = await respuesta.json();

        if (respuesta.ok) {
            // Si la respuesta fue exitosa, sumar el saldo a la cuenta local correspondiente
            const cuentaLocal = await prisma.accounts.findUnique({
                where: { number: localAccountNumber }
            });

            if (cuentaLocal) {
                const nuevoSaldo = Number(cuentaLocal.balance) + parseFloat(monto);
                await prisma.accounts.update({
                    where: { number: localAccountNumber },
                    data: { balance: new Decimal(nuevoSaldo) }
                });
                console.log(`💰 Saldo actualizado: ${localAccountNumber} - Nuevo saldo: ${nuevoSaldo}`);
            }
        }

        return res.status(respuesta.ok ? 200 : 400).json(data);
    } catch (err: any) {
        return res.status(500).json({
            error: 'Error al enviar la solicitud pull funds',
            detalle: err.message
        });
    }
};

export const handlePullFundsRequest = async (req: Request, res: Response) => {
    const { account_number, cedula, monto } = req.body;

    if (!account_number || !cedula || !monto) {
        return res.status(400).json({ error: 'Faltan datos requeridos' });
    }

    try {
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
            return res.status(404).json({ error: 'Cuenta no encontrada' });
        }

        // Verificar que la cédula coincida (simple verificación)
        const userWithCedula = account.user_accounts.find(ua =>
            ua.users.phone === cedula || ua.users.email.includes(cedula)
        );

        if (!userWithCedula) {
            return res.status(403).json({ error: 'Cédula no autorizada para esta cuenta' });
        }

        // Verificar fondos suficientes
        const currentBalance = Number(account.balance);
        const requestedAmount = Number(monto);

        if (currentBalance < requestedAmount) {
            return res.status(400).json({
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

        console.log(`💸 Pull funds procesado: ₡${monto} desde cuenta ${account_number}`);

        return res.status(200).json({
            success: true,
            message: 'Fondos transferidos exitosamente',
            amount: monto,
            newBalance: currentBalance - requestedAmount,
            currency: account.currency
        });

    } catch (error: any) {
        console.error(`❌ Error procesando pull funds:`, error.message);
        return res.status(500).json({
            error: 'Error interno del servidor',
            details: error.message
        });
    }
};