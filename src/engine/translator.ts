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

export interface TranslationEngineOptions {
  repo?: ILexiconRepository;
  logPath?: string;
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
  const candidateSpans: CandidateSpan[] = generateCandidateSpans(tokens, 2, 12);

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
