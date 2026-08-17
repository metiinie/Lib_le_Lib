/**
 * Normalizes phone numbers (especially Ethiopian phone numbers) into standard E.164 format (+251...).
 *
 * Examples:
 * - "0911234567"   -> "+251911234567"
 * - "0711234567"   -> "+251711234567"
 * - "911234567"    -> "+251911234567"
 * - "711234567"    -> "+251711234567"
 * - "251911234567" -> "+251911234567"
 * - "+251911234567" -> "+251911234567"
 * - Email address or other non-phone inputs are returned as-is (trimmed).
 */
export function normalizePhoneNumber(destination: string): string {
    if (!destination) return '';
    const trimmed = destination.trim();

    // If destination contains @, treat as email (pass through)
    if (trimmed.includes('@')) {
        return trimmed.toLowerCase();
    }

    // Remove spaces, hyphens, and parentheses
    const cleaned = trimmed.replace(/[\s\-\(\)]/g, '');

    // If already starts with '+', return cleaned
    if (cleaned.startsWith('+')) {
        return cleaned;
    }

    // Local Ethiopian mobile numbers starting with '09' or '07' (10 digits)
    if (/^0[97]\d{8}$/.test(cleaned)) {
        return `+251${cleaned.substring(1)}`;
    }

    // Local Ethiopian mobile numbers without leading '0' (9 digits)
    if (/^[97]\d{8}$/.test(cleaned)) {
        return `+251${cleaned}`;
    }

    // Country code without '+' (12 digits e.g. 251911234567)
    if (/^251[97]\d{8}$/.test(cleaned)) {
        return `+${cleaned}`;
    }

    // Fallback for raw digits: prefix with '+' if 7-15 digits
    if (/^\d{7,15}$/.test(cleaned)) {
        return `+${cleaned}`;
    }

    return cleaned;
}
