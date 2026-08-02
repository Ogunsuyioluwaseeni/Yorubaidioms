import { describe, expect, it, beforeEach } from 'vitest';
import { normalizeText, matchesNormalized } from '../normalizer.js';
import { tokenizeInput, generateCandidateSpans } from '../segmenter.js';
import { JsonFileLexiconRepository } from '../lexiconRepo.js';
import { disambiguateRuleBased } from '../disambiguator.js';
import { ruleBasedWordTranslate, applyOrthographyRules } from '../fallback.js';
import { translateIdiomaticText } from '../translator.js';
import { IdiomEntry } from '../../types/index.js';
import fs from 'fs';
import path from 'path';

describe('Normalizer', () => {
  it('strips Yorùbá diacritics and converts to lowercase', () => {
    expect(normalizeText('Ilé la ti ń kọ́ ẹ̀ṣọ́ rẹ̀ wọ̀de')).toBe('ile la ti n ko eso re wode');
    expect(normalizeText('Ọpọ́lọ́ kò ní ìrù')).toBe('opolo ko ni iru');
  });

  it('handles empty or special character strings', () => {
    expect(normalizeText('')).toBe('');
    expect(matchesNormalized('Ilé', 'ile')).toBe(true);
  });
});

describe('Segmenter & Span Generation', () => {
  it('tokenizes input sentence into tokens with character offsets', () => {
    const tokens = tokenizeInput('Ilé la ti ń kọ́');
    expect(tokens.length).toBe(5);
    expect(tokens[0].text).toBe('Ilé');
    expect(tokens[0].normalizedText).toBe('ile');
  });

  it('generates candidate spans of lengths 2 to 12', () => {
    const tokens = tokenizeInput('Ilé la ti ń kọ́ ẹ̀ṣọ́ rẹ̀ wọ̀de');
    const spans = generateCandidateSpans(tokens, 2, 12);
    expect(spans.length).toBeGreaterThan(0);
    expect(spans.some((s) => s.tokenCount === 2)).toBe(true);
    expect(spans.some((s) => s.tokenCount === 8)).toBe(true);
  });
});

describe('Lexicon Repository (Bidirectional)', () => {
  let repo: JsonFileLexiconRepository;
  const testPath = path.join(process.cwd(), 'src', 'engine', '__tests__', 'test_lexicon.json');

  beforeEach(() => {
    const testData: IdiomEntry[] = [
      {
        id: 'test-01',
        yoruba: 'Ilé la ti ń kọ́ ẹ̀ṣọ́ rẹ̀ wọ̀de',
        literalGloss: 'From home we wear good character',
        figurativeSense: 'Charity begins at home',
        englishEquivalents: ['Charity begins at home', 'Manners begin at home'],
        isProverb: true,
        sourceNote: 'seed placeholder',
        verified: false,
      },
    ];
    fs.writeFileSync(testPath, JSON.stringify(testData), 'utf-8');
    repo = new JsonFileLexiconRepository(testPath);
  });

  it('finds Yorùbá idiom match using diacritic-tolerant lookup', () => {
    const matches = repo.findMatchesForNormalized('ile la ti n ko eso re wode', 'yo');
    expect(matches.length).toBe(1);
    expect(matches[0].id).toBe('test-01');
  });

  it('finds English equivalent idiom match (reverse direction)', () => {
    const matches = repo.findMatchesForNormalized('charity begins at home', 'en');
    expect(matches.length).toBe(1);
    expect(matches[0].id).toBe('test-01');
  });

  it('returns empty array when no match exists', () => {
    const matches = repo.findMatchesForNormalized('random phrase with no idiom', 'yo');
    expect(matches.length).toBe(0);
  });
});

describe('Rule-Based Disambiguator', () => {
  const sampleEntry: IdiomEntry = {
    id: 'yowe-001',
    yoruba: 'Ilé la ti ń kọ́ ẹ̀ṣọ́ rẹ̀ wọ̀de',
    literalGloss: 'From home we wear good character',
    figurativeSense: 'Charity begins at home',
    englishEquivalents: ['Charity begins at home'],
    isProverb: true,
    sourceNote: 'seed placeholder',
    verified: false,
  };

  it('classifies as figurative by default for canonical proverb form', () => {
    const tokens = tokenizeInput('Ilé la ti ń kọ́ ẹ̀ṣọ́ rẹ̀ wọ̀de');
    const res = disambiguateRuleBased(sampleEntry, tokens, 0, tokens.length, 'yo');
    expect(res.isFigurative).toBe(true);
  });

  it('detects literal usage when explicit literal keywords are present', () => {
    const tokens = tokenizeInput('Gbogbo ile-iwe ati uniform Ilé la ti ń kọ́ ẹ̀ṣọ́ rẹ̀ wọ̀de');
    const res = disambiguateRuleBased(sampleEntry, tokens, 0, tokens.length, 'yo');
    expect(res.isFigurative).toBe(false);
    expect(res.reason).toContain('literal');
  });
});

describe('Fallback Translator', () => {
  it('translates recognized words and passes through unrecognized words', () => {
    expect(ruleBasedWordTranslate('ile', 'yo', 'en')).toBe('home');
    expect(ruleBasedWordTranslate('unknownword', 'yo', 'en')).toBe('unknownword');
  });

  it('applies orthography rules correctly', () => {
    const words = ['charity', 'begins', 'at', 'home'];
    const formatted = applyOrthographyRules(words, 'en');
    expect(formatted).toBe('Charity begins at home');
  });
});

describe('Full Idiom Engine Translation', () => {
  it('translates full Yorùbá proverb with idiom_match confidence', async () => {
    const testPath = path.join(process.cwd(), 'src', 'engine', '__tests__', 'test_lexicon.json');
    const repo = new JsonFileLexiconRepository(testPath);
    const input = 'Ilé la ti ń kọ́ ẹ̀ṣọ́ rẹ̀ wọ̀de';
    const result = await translateIdiomaticText(input, 'yo', 'en', { repo });

    expect(result.overallConfidence).toBe('idiom_match');
    expect(result.spans.length).toBe(1);
    expect(result.spans[0].matchedIdiom.id).toBe('test-01');
    expect(result.translatedText).toBe('Charity begins at home');
  });

  it('handles literal fallback when text has no idiom', async () => {
    const input = 'Mo lọ sí ọjà';
    const result = await translateIdiomaticText(input, 'yo', 'en');

    expect(result.overallConfidence).toBe('fallback');
    expect(result.fallbackUsed).toBe(true);
    expect(result.spans.length).toBe(0);
  });
});
