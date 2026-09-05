/**
 * Frontend phone normalization & validation helpers for Ethiopian and international numbers.
 *
 * Examples:
 * - "0911234567"   -> "+251911234567"
 * - "0711234567"   -> "+251711234567"
 * - "911234567"    -> "+251911234567"
 * - "711234567"    -> "+251711234567"
 * - "251911234567" -> "+251911234567"
 * - "+251911234567" -> "+251911234567"
 */

export function normalizePhoneNumber(raw: string): string {
    if (!raw) return '';
    const trimmed = raw.trim();

    // If email or contains '@', keep as is
    if (trimmed.includes('@')) {
        return trimmed;
    }

    // Strip spaces, dashes, parentheses, dots
    const cleaned = trimmed.replace(/[\s\-\(\)\.]/g, '');

    // +25109... or +25107... (with redundant 0 after country code)
    if (/^\+2510[97]\d{8}$/.test(cleaned)) {
        return `+251${cleaned.substring(5)}`;
    }

    // 25109... or 25107... (with 251 country code and redundant 0)
    if (/^2510[97]\d{8}$/.test(cleaned)) {
        return `+251${cleaned.substring(4)}`;
    }

    if (cleaned.startsWith('+')) {
        return cleaned;
    }

    // Local Ethiopian numbers: 09... or 07... (10 digits)
    if (/^0[97]\d{8}$/.test(cleaned)) {
        return `+251${cleaned.substring(1)}`;
    }

    // Local Ethiopian numbers without 0: 9... or 7... (9 digits)
    if (/^[97]\d{8}$/.test(cleaned)) {
        return `+251${cleaned}`;
    }

    // Country code without '+': 2519... or 2517... (12 digits)
    if (/^251[97]\d{8}$/.test(cleaned)) {
        return `+${cleaned}`;
    }

    // Fallback raw digits
    if (/^\d{7,15}$/.test(cleaned)) {
        return `+${cleaned}`;
    }

    return cleaned;
}

export function isValidPhoneNumber(raw: string): boolean {
    const normalized = normalizePhoneNumber(raw);
    return /^\+\d{7,15}$/.test(normalized);
}
