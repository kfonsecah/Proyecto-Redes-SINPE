/**
 * Formatea un monto de dinero según la moneda especificada
 * @param amount - El monto a formatear
 * @param currency - La moneda (CRC, USD, EUR, etc.)
 * @returns String formateado como ₡2,693.00
 */
export const formatCurrency = (amount: number | string, currency: string = 'CRC'): string => {
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

    // Si el número no es válido, retornar formato por defecto
    if (isNaN(numericAmount)) {
        return getCurrencySymbol(currency) + '0.00';
    }

    switch (currency.toUpperCase()) {
        case 'USD':
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(numericAmount);

        case 'EUR':
            return new Intl.NumberFormat('de-DE', {
                style: 'currency',
                currency: 'EUR',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(numericAmount);

        case 'GBP':
            return new Intl.NumberFormat('en-GB', {
                style: 'currency',
                currency: 'GBP',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(numericAmount);

        case 'CRC':
        default:
            // Para colones costarricenses, usamos formato personalizado
            return '₡' + new Intl.NumberFormat('es-CR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(numericAmount);
    }
};

/**
 * Obtiene el símbolo de la moneda
 */
export const getCurrencySymbol = (currency: string): string => {
    switch (currency.toUpperCase()) {
        case 'USD': return '$';
        case 'EUR': return '€';
        case 'GBP': return '£';
        case 'CRC':
        default: return '₡';
    }
};

/**
 * Formatea un monto para mostrar en campos de entrada
 * @param amount - El monto
 * @returns String sin símbolo de moneda, formato: 2,693.00
 */
export const formatAmountForInput = (amount: number | string): string => {
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

    if (isNaN(numericAmount)) {
        return '0.00';
    }

    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(numericAmount);
};