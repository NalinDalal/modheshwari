/**
 * Phone utilities: validation and normalization to E.164
 * Uses `libphonenumber-js` to parse and format numbers.
 *
 * Functions:
 * - `validatePhone(number, country?)` => { valid, e164, country }
 * - `formatE164(number, country?)` => string | null
 *
 * Country is optional; if omitted libphonenumber-js will attempt to parse
 * using international prefix. Prefer passing `country` (ISO 2-letter) when
 * available (e.g., from user profile or explicit input).
 */

import { parsePhoneNumberFromString, AsYouType } from 'libphonenumber-js';

export type PhoneValidationResult = {
	valid: boolean;
	e164?: string | null;
	country?: string | null;
	reason?: string | null;
};

/**
 * Validate a phone number and return E.164 if valid.
 * @param phone raw user input phone number
 * @param country optional 2-letter ISO country code (e.g., 'IN', 'US')
 */
export function validatePhone(phone: string, country?: string): PhoneValidationResult {
	if (!phone || typeof phone !== 'string') return { valid: false, reason: 'empty' };

	try {
		const pn = parsePhoneNumberFromString(phone, country as any);
		if (!pn) return { valid: false, reason: 'parse_failed' };

		const valid = pn.isValid();
		if (!valid) return { valid: false, reason: 'invalid_number' };

		return { valid: true, e164: pn.number, country: pn.country || null };
	} catch (err: any) {
		return { valid: false, reason: err?.message || String(err) };
	}
}

/**
 * Force-format an input into E.164 if possible. Returns null when not parseable.
 */
export function formatE164(phone: string, country?: string): string | null {
	const res = validatePhone(phone, country);
	return res.valid ? (res.e164 as string) : null;
}

/**
 * Helper to present as-you-type formatting for UI (optional)
 */
export function formatAsYouType(input: string, country?: string): string {
	try {
		const a = new AsYouType(country as any);
		return a.input(input || '') || input;
	} catch (_) {
		return input;
	}
}

export default { validatePhone, formatE164, formatAsYouType };
