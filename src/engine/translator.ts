import {
  IdiomEntry,
  Language,
  MatchedSpan,
  TranslatedSegment,
  TranslationLogRecord,
  TranslationResponse,
} from '../types/index.js';
import { disambiguateContext } from './disambiguator.js';
import { applyOrthographyRules, logTranslation, ruleBasedWordTranslate } from './fallback.js';
import { ILexiconRepository, lexiconRepo } from './lexiconRepo.js';
import { generateCandidateSpans, tokenizeInput, CandidateSpan, Token } from './segmenter.js';
import { NearMatchIndex } from './nearMatch.js';

/** Minimum Dice similarity for a fuzzy (near) match; chosen from the threshold sweep (0.7-0.8 range). */
export const NEAR_MATCH_THRESHOLD = 0.75;
/** Inputs shorter than this are never fuzzy-matched (avoids spurious matches on short sentences). */
export const NEAR_MATCH_MIN_TOKENS = 3;

export interface TranslationEngineOptions {
  repo?: ILexiconRepository;
  logPath?: string;
  /** Longest span (in tokens) to try. Defaults to the longest lexicon entry (min 12). */
  maxSpan?: number;
  /** Fuzzy matching of variants when no exact idiom is found. Default true. */
  nearMatch?: boolean;
  nearMatchThreshold?: number;
}

export async function translateIdiomaticText(
  input: string,
  sourceLang: Language,
  targetLang: Language,
  options?: TranslationEngineOptions
): Promise<TranslationResponse> {
  const repo = options?.repo || lexiconRepo;
  const translationId = `trans-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  if (!input || input.trim().length === 0) {
    return {
      translationId,
      originalText: input,
      translatedText: '',
      sourceLang,
      targetLang,
      overallConfidence: 'fallback',
      fallbackUsed: false,
      segments: [],
      spans: [],
      timestamp: new Date().toISOString(),
    };
  }

  const tokens: Token[] = tokenizeInput(input);
  const textsOf = (e: IdiomEntry): string[] =>
    sourceLang === 'yo' ? [e.yoruba] : e.englishEquivalents.length ? e.englishEquivalents : [e.figurativeSense];
  let maxSpan = options?.maxSpan;
  if (maxSpan === undefined) {
    let longest = 12;
    for (const e of repo.getAll()) {
      for (const t of textsOf(e)) longest = Math.max(longest, tokenizeInput(t).length);
    }
    maxSpan = longest;
  }
  const candidateSpans: CandidateSpan[] = generateCandidateSpans(tokens, 2, maxSpan);

  const segments: TranslatedSegment[] = [];
  const spans: MatchedSpan[] = [];

  let i = 0;
  let hasIdiomMatch = false;
  let hasFallback = false;

  while (i < tokens.length) {
    const spansStartingAtI = candidateSpans
      .filter((s) => s.startTokenIndex === i)
      .sort((a, b) => b.tokenCount - a.tokenCount);

    let matchFound = false;

    for (const candSpan of spansStartingAtI) {
      const matches = repo.findMatchesForNormalized(candSpan.normalizedText, sourceLang);
      if (matches.length > 0) {
        const matchedEntry: IdiomEntry = matches[0];

        const disambiguation = await disambiguateContext(
          matchedEntry,
          tokens,
          candSpan.startTokenIndex,
          candSpan.endTokenIndex,
          sourceLang,
          input
        );

        if (disambiguation.isFigurative) {
          matchFound = true;
          hasIdiomMatch = true;

          const translatedSpanText =
            sourceLang === 'yo'
              ? matchedEntry.englishEquivalents[0] || matchedEntry.figurativeSense
              : matchedEntry.yoruba;

          const matchedSpanObj: MatchedSpan = {
            id: `span-${Date.now()}-${i}`,
            startIndex: candSpan.startTokenIndex,
            endIndex: candSpan.endTokenIndex,
            startCharIndex: candSpan.startCharIndex,
            endCharIndex: candSpan.endCharIndex,
            originalSpanText: candSpan.originalText,
            normalizedSpanText: candSpan.normalizedText,
            matchedIdiomId: matchedEntry.id,
            matchedIdiom: matchedEntry,
            translatedSpanText,
            confidence: 'idiom_match',
            isFigurative: true,
            literalGloss: matchedEntry.literalGloss,
            figurativeSense: matchedEntry.figurativeSense,
            disambiguationReason: disambiguation.reason,
          };

          spans.push(matchedSpanObj);

          segments.push({
            text: candSpan.originalText,
            translatedText: translatedSpanText,
            confidence: 'idiom_match',
            isIdiom: true,
            matchedSpan: matchedSpanObj,
          });

          i += candSpan.tokenCount;
          break;
        }
      }
    }

    if (!matchFound) {
      hasFallback = true;
      const token = tokens[i];
      const translatedWord = ruleBasedWordTranslate(token.text, sourceLang, targetLang);

      segments.push({
        text: token.text,
        translatedText: translatedWord,
        confidence: 'fallback',
        isIdiom: false,
      });

      i += 1;
    }
  }

  // Near-match fallback: if no exact idiom was found, try a fuzzy match of the whole input
  // against the lexicon (handles dropped clauses, small edits, word-order changes).
  if (!hasIdiomMatch && options?.nearMatch !== false && tokens.length >= NEAR_MATCH_MIN_TOKENS) {
    const pairs: { entry: IdiomEntry; text: string }[] = [];
    for (const e of repo.getAll()) for (const t of textsOf(e)) pairs.push({ entry: e, text: t });
    const index = new NearMatchIndex(pairs, (p) => p.text);
    const threshold = options?.nearMatchThreshold ?? NEAR_MATCH_THRESHOLD;
    const best = index.best(input, threshold);
    if (best) {
      const matchedEntry = best.entry.entry;
      const translatedSpanText =
        sourceLang === 'yo' ? matchedEntry.englishEquivalents[0] || matchedEntry.figurativeSense : matchedEntry.yoruba;
      const last = tokens[tokens.length - 1];
      const matchedSpanObj: MatchedSpan = {
        id: `span-${Date.now()}-near`,
        startIndex: 0,
        endIndex: tokens.length,
        startCharIndex: tokens[0].startChar,
        endCharIndex: last.endChar,
        originalSpanText: input.slice(tokens[0].startChar, last.endChar),
        normalizedSpanText: tokens.map((t) => t.normalizedText).join(' '),
        matchedIdiomId: matchedEntry.id,
        matchedIdiom: matchedEntry,
        translatedSpanText,
        confidence: 'idiom_match',
        isFigurative: true,
        literalGloss: matchedEntry.literalGloss,
        figurativeSense: matchedEntry.figurativeSense,
        disambiguationReason: `Near match (similarity ${best.score.toFixed(2)}): input is a variant of a known entry`,
      };
      segments.splice(0, segments.length, {
        text: matchedSpanObj.originalSpanText,
        translatedText: translatedSpanText,
        confidence: 'idiom_match',
        isIdiom: true,
        matchedSpan: matchedSpanObj,
      });
      spans.splice(0, spans.length, matchedSpanObj);
      hasIdiomMatch = true;
      hasFallback = false;
    }
  }

  const translatedWords = segments.map((s) => s.translatedText);
  const finalTranslatedText = applyOrthographyRules(translatedWords, targetLang);

  const overallConfidence = hasIdiomMatch ? 'idiom_match' : 'fallback';

  const response: TranslationResponse = {
    translationId,
    originalText: input,
    translatedText: finalTranslatedText,
    sourceLang,
    targetLang,
    overallConfidence,
    fallbackUsed: hasFallback,
    segments,
    spans,
    timestamp: new Date().toISOString(),
  };

  const logRecord: TranslationLogRecord = {
    ...response,
    createdAt: new Date().toISOString(),
  };
  logTranslation(logRecord, options?.logPath);

  return response;
}
