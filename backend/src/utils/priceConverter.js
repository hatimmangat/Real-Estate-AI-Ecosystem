


export const convertPriceToNumber = (price) => {
    if (typeof price === 'number') {
        if (isNaN(price)) return null;
        return Math.max(0, price);
    }

    if (typeof price !== 'string' || price.trim() === '') {
        return null;
    }

    const trimmed = price.trim().replace(/,/g, '').toLowerCase();

    const directNumber = parseFloat(trimmed);
    if (!isNaN(directNumber) && trimmed === directNumber.toString()) {
        return Math.max(0, directNumber);
    }

    const abbreviations = [
        { pattern: /(\d+(?:\.\d+)?)\s*(crore|cr)s?/i, multiplier: 10000000 },
        { pattern: /(\d+(?:\.\d+)?)\s*(lakh|lacs?|l)s?/i, multiplier: 100000 },
        { pattern: /(\d+(?:\.\d+)?)\s*(million|m)s?/i, multiplier: 1000000 },
        { pattern: /(\d+(?:\.\d+)?)\s*(thousand|k)s?/i, multiplier: 1000 },
        { pattern: /(\d+(?:\.\d+)?)\s*(billion|b)s?/i, multiplier: 1000000000 },
    ];

    for (const { pattern, multiplier } of abbreviations) {
        const match = trimmed.match(pattern);
        if (match) {
            const value = parseFloat(match[1]);
            if (!isNaN(value)) {
                return Math.max(0, value * multiplier);
            }
        }
    }

    const extracted = trimmed.match(/(\d+(?:\.\d+)?)/);
    if (extracted) {
        return Math.max(0, parseFloat(extracted[1]));
    }

    return null;
};


export const normalizePriceToString = (price) => {
    if (typeof price === 'number') {
        return price.toLocaleString('en-US', { maximumFractionDigits: 0 });
    }

    if (typeof price === 'string') {
        const trimmed = price.trim();

        if (trimmed.toLowerCase() === 'to be discussed') {
            return trimmed;
        }

        const numValue = convertPriceToNumber(trimmed);
        if (numValue !== null) {
            return numValue.toLocaleString('en-US', { maximumFractionDigits: 0 });
        }

        return trimmed;
    }

    return String(price);
};


export const isValidPrice = (price) => {
    if (!price) return false;
    return convertPriceToNumber(price) !== null ||
        (typeof price === 'string' && price.toLowerCase() === 'to be discussed');
};


export const getPriceValidationMessage = (price) => {
    if (!price) {
        return 'Price is required';
    }

    if (!isValidPrice(price)) {
        return 'Invalid price format. Please use numbers or supported formats (e.g., "14 crore", "5 lakh", "1000000")';
    }

    return null;
};


export const formatPriceForDisplay = (price) => {
    if (price === null || price === undefined) return 'N/A';

    const numPrice = convertPriceToNumber(price);
    if (numPrice === null) return String(price);

    if (numPrice >= 10000000) {
        return `${(numPrice / 10000000).toFixed(2)} Cr`;
    } else if (numPrice >= 100000) {
        return `${(numPrice / 100000).toFixed(2)} Lac`;
    } else if (numPrice >= 1000000) {
        return `${(numPrice / 1000000).toFixed(2)} M`;
    } else if (numPrice >= 1000) {
        return `${(numPrice / 1000).toFixed(2)} K`;
    }

    return numPrice.toLocaleString();
};

export default {
    convertPriceToNumber,
    normalizePriceToString,
    isValidPrice,
    getPriceValidationMessage,
    formatPriceForDisplay
};
