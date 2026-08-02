export type Language = 'yo' | 'en';

export interface IdiomEntry {
  id: string;
  yoruba: string;          // canonical Yorùbá form, full tone marks
  literalGloss: string;    // word-for-word English gloss
  figurativeSense: string; // plain-English meaning
  englishEquivalents: string[]; // ranked, best-fit first
  register?: string;       // e.g. "formal", "colloquial", "proverbial"
  usageNote?: string;      // when/how it's typically used
  isProverb: boolean;
  sourceNote?: string;     // where this entry came from
  verified: boolean;       // has a native speaker confirmed this entry?
}

export interface MatchedSpan {
  id: string;
  startIndex: number;         // token start index
  endIndex: number;           // token end index (exclusive)
  startCharIndex: number;     // character start index in original input
  endCharIndex: number;       // character end index in original input
  originalSpanText: string;
  normalizedSpanText: string;
  matchedIdiomId: string;
  matchedIdiom: IdiomEntry;
  translatedSpanText: string;
  confidence: 'idiom_match' | 'fallback';
  isFigurative: boolean;
  literalGloss: string;
  figurativeSense: string;
  disambiguationReason?: string;
}

export interface TranslatedSegment {
  text: string;
  translatedText: string;
  confidence: 'idiom_match' | 'fallback';
  isIdiom: boolean;
  matchedSpan?: MatchedSpan;
}

export interface TranslationRequest {
  text: string;
  sourceLang: Language;
  targetLang: Language;
}

export interface TranslationResponse {
  translationId: string;
  originalText: string;
  translatedText: string;
  sourceLang: Language;
  targetLang: Language;
  overallConfidence: 'idiom_match' | 'fallback';
  fallbackUsed: boolean;
  segments: TranslatedSegment[];
  spans: MatchedSpan[];
  timestamp: string;
}

export interface TranslationLogRecord extends TranslationResponse {
  createdAt: string;
}
