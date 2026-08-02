import { normalizeText } from './normalizer.js';

export interface Token {
  index: number;
  text: string;
  normalizedText: string;
  startChar: number;
  endChar: number;
}

export interface CandidateSpan {
  startTokenIndex: number;
  endTokenIndex: number; // exclusive
  tokenCount: number;
  originalText: string;
  normalizedText: string;
  startCharIndex: number;
  endCharIndex: number;
}

/**
 * Tokenize input string preserving whitespace and character indices, including combining diacritics.
 */
export function tokenizeInput(input: string): Token[] {
  const tokens: Token[] = [];
  if (!input) return tokens;

  // Regex matches words (including Yorùbá characters, accents, and combining diacritics \u0300-\u036f)
  const regex = /[\w\u00C0-\u024F\u1E00-\u1EFF\u0300-\u036f']+/g;
  let match: RegExpExecArray | null;

  let tokenIdx = 0;
  while ((match = regex.exec(input)) !== null) {
    const word = match[0];
    tokens.push({
      index: tokenIdx++,
      text: word,
      normalizedText: normalizeText(word),
      startChar: match.index,
      endChar: match.index + word.length,
    });
  }

  return tokens;
}

/**
 * Generates candidate spans of lengths between minTokens and maxTokens (default 2 to 12).
 */
export function generateCandidateSpans(
  tokens: Token[],
  minTokens = 2,
  maxTokens = 12
): CandidateSpan[] {
  const spans: CandidateSpan[] = [];
  const tokenLength = tokens.length;

  for (let start = 0; start < tokenLength; start++) {
    for (let len = maxTokens; len >= minTokens; len--) {
      const end = start + len;
      if (end <= tokenLength) {
        const slice = tokens.slice(start, end);
        const originalText = slice.map((t) => t.text).join(' ');
        const normalizedText = normalizeText(originalText);
        spans.push({
          startTokenIndex: start,
          endTokenIndex: end,
          tokenCount: len,
          originalText,
          normalizedText,
          startCharIndex: slice[0].startChar,
          endCharIndex: slice[slice.length - 1].endChar,
        });
      }
    }
  }

  return spans;
}
