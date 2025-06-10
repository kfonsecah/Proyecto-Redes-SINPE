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

interface PullFundsRequest {
    account_number: string;
    cedula: string;
    monto: number;
    bancoDestino: {
        codigo: string;
        ip: string;
        puerto: string;
    };
    localAccountNumber: string;
}

export const sendPullFundsRequest = async (req: Request, res: Response) => {
    const { account_number, cedula, monto, bancoDestino, localAccountNumber }: PullFundsRequest = req.body;

    if (!account_number || !cedula || !monto || !bancoDestino || !localAccountNumber) {
        return res.status(400).json({ error: 'Faltan datos requeridos' });
    }

    const url = `https://${bancoDestino.ip}:${bancoDestino.puerto}/api/pull-funds`;
    console.log(`🌐 Enviando solicitud pull funds a ${bancoDestino.ip} en puerto ${bancoDestino.puerto}`);
    console.log(`📋 Datos:`, { account_number, cedula, monto });

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                account_number,
                cedula,
                monto
            }),
            agent: httpsAgent
        });

        const data = await response.json();

        if (response.ok) {
            console.log(`✅ Pull funds exitoso desde ${bancoDestino.codigo}`);

            // Buscar la cuenta local para acreditar los fondos
            const localAccount = await prisma.accounts.findUnique({
                where: { number: localAccountNumber }
            });

            if (!localAccount) {
                return res.status(404).json({ error: 'Cuenta local no encontrada' });
            }

            // Acreditar los fondos a la cuenta local
            await prisma.accounts.update({
                where: { number: localAccountNumber },
                data: {
                    balance: { increment: new Decimal(monto) }
                }
            });

            // Registrar la transacción como crédito entrante
            await prisma.transfers.create({
                data: {
                    from_account_id: 0, // Cuenta externa
                    to_account_id: localAccount.id,
                    amount: new Decimal(monto),
                    currency: localAccount.currency,
                    status: "completed",
                    description: `Pull from ${bancoDestino.codigo}`.substring(0, 20),
                },
            });

            console.log(`💰 Fondos acreditados: ₡${monto} a cuenta ${localAccountNumber}`);

            return res.status(200).json({
                success: true,
                message: `Fondos transferidos exitosamente desde ${bancoDestino.codigo}`,
                amount: monto,
                newBalance: Number(localAccount.balance) + monto,
                externalResponse: data
            });
        } else {
            console.log(`❌ Error en pull funds desde ${bancoDestino.codigo}:`, data);
            return res.status(400).json({
                error: 'Error en la solicitud pull funds',
                details: data
            });
        }
    } catch (error: any) {
        console.error(`❌ Error enviando pull funds a ${bancoDestino.codigo}:`, error.message);
        return res.status(500).json({
            error: 'Error al enviar la solicitud pull funds',
            details: error.message
        });
    }
};

export const handlePullFundsRequest = async (req: Request, res: Response) => {
    const { account_number, cedula, monto } = req.body;

    console.log(`📥 Recibiendo solicitud pull funds:`, { account_number, cedula, monto });

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

        // Verificar que la cédula coincida con algún usuario asociado a la cuenta
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

        // Registrar la transacción como débito saliente
        await prisma.transfers.create({
            data: {
                from_account_id: account.id,
                to_account_id: 0, // Cuenta externa
                amount: new Decimal(monto),
                currency: account.currency,
                status: "completed",
                description: `Pull to external`.substring(0, 20),
            },
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