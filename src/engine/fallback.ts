import fs from 'fs';
import path from 'path';
import { Language, TranslationLogRecord } from '../types/index.js';
import { normalizeText } from './normalizer.js';

// Starter word-level dictionaries for fallback word translation (no duplicate keys)
const YORUBA_TO_ENGLISH_DICT: Record<string, string> = {
  'baa': 'if',
  'bi': 'if',
  'lati': 'from',
  'ti': 'that',
  'ni': 'is',
  'si': 'and',
  'ko': 'not',
  'agba': 'elder',
  'ode': 'outside',
  'ile': 'home',
  'eso': 'adornment',
  'oja': 'market',
  'eran': 'meat',
  'adie': 'chicken',
  'ebi': 'hunger',
  'obe': 'soup',
  'ilefly': 'fly',
  'ipade': 'meeting',
  'opolopo': 'abundance',
  'iro': 'lie',
  'ise': 'work',
  'emo': 'strange thing',
  'eja': 'fish',
  'oju': 'eyes',
  'ireti': 'hope',
  'emi': 'life',
  'esin': 'horse',
  'keke': 'bicycle',
  'gbona': 'hot',
  'beru': 'fear',
  'ran': 'send',
  'wa': 'exist',
  'be': 'exist',
  'mo': 'know',
  'se': 'do',
  'pa': 'kill',
};

const ENGLISH_TO_YORUBA_DICT: Record<string, string> = {
  'home': 'ilé',
  'charity': 'àánú',
  'manners': 'ẹ̀ṣọ́',
  'elder': 'àgbà',
  'elders': 'àwọn àgbà',
  'market': 'ọjà',
  'chicken': 'adìẹ',
  'hunger': 'ebi',
  'soup': 'ọbẹ',
  'meeting': 'ìpàdé',
  'truth': 'òótọ́',
  'lies': 'irọ́',
  'duty': 'iṣẹ́',
  'smoke': 'èéfín',
  'fire': 'iná',
  'fish': 'ẹja',
  'eyes': 'ojú',
  'hope': 'ìrètí',
  'life': 'ẹ̀mí',
  'horse': 'ẹṣin',
  'bicycle': 'kẹ̀kẹ́',
  'ground': 'ilẹ̀',
  'hot': 'gbígbóná',
  'good': 'daadaa',
  'bad': 'buburu',
  'know': 'mọ̀',
  'speak': 'sọ',
  'go': 'lọ',
  'come': 'wá',
  'is': 'jẹ́',
  'the': '',
  'a': '',
  'an': '',
};

/**
 * Translates a single word using rule-based dictionary lookup or pass-through.
 */
export function ruleBasedWordTranslate(word: string, sourceLang: Language, targetLang: Language): string {
  if (!word) return '';
  const norm = normalizeText(word);

  if (sourceLang === 'yo') {
    if (YORUBA_TO_ENGLISH_DICT[norm]) {
      return YORUBA_TO_ENGLISH_DICT[norm];
    }
    return word; // fallback pass-through
  } else {
    if (ENGLISH_TO_YORUBA_DICT[norm]) {
      return ENGLISH_TO_YORUBA_DICT[norm];
    }
    return word; // fallback pass-through
  }
}

/**
 * Applies orthographic post-processing rules (capitalization, whitespace, punctuation).
 */
export function applyOrthographyRules(words: string[], targetLang: Language): string {
  if (!words || words.length === 0) return '';

  let text = words.filter((w) => w.trim().length > 0).join(' ');

  // Clean up duplicate spaces before punctuation
  text = text.replace(/\s+([.,!?;:])/, '$1').replace(/\s+/g, ' ').trim();

  // Capitalize first letter of sentence
  if (text.length > 0) {
    text = text.charAt(0).toUpperCase() + text.slice(1);
  }

  return text;
}

/**
 * Appends a translation record to the translation log file.
 */
export function logTranslation(record: TranslationLogRecord, customLogPath?: string): void {
  const logFilePath = customLogPath || path.join(process.cwd(), 'src', 'data', 'translationLog.json');

  try {
    let logs: TranslationLogRecord[] = [];
    if (fs.existsSync(logFilePath)) {
      const raw = fs.readFileSync(logFilePath, 'utf-8');
      logs = JSON.parse(raw);
    }

    logs.unshift(record);

    // Keep last 100 log entries
    if (logs.length > 100) {
      logs = logs.slice(0, 100);
    }

    const dir = path.dirname(logFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(logFilePath, JSON.stringify(logs, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to log translation:', err);
  }
}

/**
 * Reads logged translation records for curator review.
 */
export function getLoggedTranslations(customLogPath?: string): TranslationLogRecord[] {
  const logFilePath = customLogPath || path.join(process.cwd(), 'src', 'data', 'translationLog.json');

  try {
    if (fs.existsSync(logFilePath)) {
      const raw = fs.readFileSync(logFilePath, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Failed to read translation log:', err);
  }
  return [];
}
