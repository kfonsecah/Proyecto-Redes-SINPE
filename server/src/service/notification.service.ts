export interface NotificationData {
    type: 'transfer_received' | 'transfer_sent' | 'pull_funds' | 'sinpe_received' | 'sinpe_sent';
    amount: number;
    currency: string;
    from?: string;
    to?: string;
    timestamp: string;
    message: string;
}

export const createNotification = (
    type: NotificationData['type'],
    amount: number,
    currency: string,
    fromOrTo?: string
): NotificationData => {
    const timestamp = new Date().toISOString();

    let message: string;

    switch (type) {
        case 'transfer_received':
            message = `Transferencia recibida de ${fromOrTo || 'banco externo'}: ${formatAmount(amount, currency)}`;
            break;
        case 'transfer_sent':
            message = `Transferencia enviada a ${fromOrTo || 'banco externo'}: ${formatAmount(amount, currency)}`;
            break;
        case 'pull_funds':
            message = `Pull Funds procesado desde tu cuenta: ${formatAmount(amount, currency)}`;
            break;
        case 'sinpe_received':
            message = `SINPE Móvil recibido de ${fromOrTo}: ${formatAmount(amount, currency)}`;
            break;
        case 'sinpe_sent':
            message = `SINPE Móvil enviado a ${fromOrTo}: ${formatAmount(amount, currency)}`;
            break;
        default:
            message = `Movimiento en tu cuenta: ${formatAmount(amount, currency)}`;
    }

    return {
        type,
        amount,
        currency,
        from: type.includes('received') ? fromOrTo : undefined,
        to: type.includes('sent') ? fromOrTo : undefined,
        timestamp,
        message
    };
};

const formatAmount = (amount: number, currency: string): string => {
    const formatter = new Intl.NumberFormat('es-CR', {
        style: 'currency',
        currency: currency === 'CRC' ? 'CRC' : 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    });

    if (currency === 'CRC') {
        return `₡${amount.toLocaleString('es-CR')}`;
    }

    return formatter.format(amount);
};