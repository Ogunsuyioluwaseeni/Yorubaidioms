/**
 * Normalizes text for Yorùbá diacritic-tolerant matching, case folding, and punctuation handling.
 */

export function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFC')
    .replace(/[ẹẸ]/g, 'e')
    .replace(/[ọỌ]/g, 'o')
    .replace(/[ṣṢ]/g, 's')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip tone marks and combining diacritics
    .replace(/[^\w\s]/g, ' ') // replace punctuation with space
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normalizes a single word/token.
 */
export function normalizeToken(token: string): string {
  return normalizeText(token);
}

/**
 * Checks if two strings match after diacritic-tolerant normalization.
 */
export function matchesNormalized(str1: string, str2: string): boolean {
  return normalizeText(str1) === normalizeText(str2);
}
