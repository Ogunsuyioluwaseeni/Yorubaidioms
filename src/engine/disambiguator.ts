import { GoogleGenAI } from '@google/genai';
import { IdiomEntry, Language } from '../types/index.js';
import { Token } from './segmenter.js';

export interface DisambiguationResult {
  isFigurative: boolean;
  reason: string;
  source: 'rule_based' | 'llm';
}

/**
 * Rule-based heuristic pass to decide whether an idiom match is used figuratively or literally in context.
 */
export function disambiguateRuleBased(
  entry: IdiomEntry,
  tokens: Token[],
  startTokenIdx: number,
  endTokenIdx: number,
  sourceLang: Language
): DisambiguationResult {
  const fullText = tokens.map((t) => t.text.toLowerCase()).join(' ');

  // Literal context keywords for specific idioms
  const literalSignals: Record<string, string[]> = {
    'yowe-001': ['ile-iwe', 'class', 'uniform', 'dress code', 'clothes', 'washing'],
    'yowe-003': ['poultry', 'farm', 'feed', 'veterinary', 'rooster', 'hen house'],
    'yowe-004': ['kitchen', 'cook', 'pot', 'recipe', 'salt', 'maggi', 'boiling'],
  };

  // Proverbial discourse markers indicating figurative usage
  const proverbMarkers = [
    'owe', 'owe pe', 'oronomo', 'agba', 'as the saying goes', 'proverb',
    'it is said', 'wise words', 'quote', 'like they say', 'awon agba'
  ];

  // Check for proverbial discourse markers anywhere in sentence
  const hasProverbMarker = proverbMarkers.some((marker) => fullText.includes(marker));
  if (hasProverbMarker) {
    return {
      isFigurative: true,
      reason: 'Surrounding context includes proverbial discourse marker.',
      source: 'rule_based',
    };
  }

  // Check for literal context keywords
  const entryLiteralSignals = literalSignals[entry.id] || [];
  const hasLiteralSignal = entryLiteralSignals.some((sig) => fullText.includes(sig));

  if (hasLiteralSignal) {
    return {
      isFigurative: false,
      reason: 'Surrounding context contains literal-sense keywords.',
      source: 'rule_based',
    };
  }

  // Default heuristic for established idioms/proverbs
  return {
    isFigurative: true,
    reason: 'Matched canonical idiom form in lexicon without explicit literal markers.',
    source: 'rule_based',
  };
}

/**
 * Stub/Implementation for LLM-based disambiguation pass when ENABLE_LLM_DISAMBIGUATION is true.
 */
export async function disambiguateWithLLM(
  entry: IdiomEntry,
  inputSentence: string,
  sourceLang: Language
): Promise<DisambiguationResult | null> {
  const enableLLM = process.env.ENABLE_LLM_DISAMBIGUATION === 'true';
  const apiKey = process.env.GEMINI_API_KEY;

  if (!enableLLM || !apiKey) {
    return null;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `You are a Yorùbá-English computational linguist evaluating context disambiguation for idiomatic expressions.

Sentence: "${inputSentence}"
Detected Idiom: "${entry.yoruba}"
Literal Gloss: "${entry.literalGloss}"
Figurative Sense: "${entry.figurativeSense}"

Determine if the idiom in this specific sentence context is used FIGURATIVELY (as a proverb/metaphor) or LITERALLY.
Respond with JSON in format:
{
  "isFigurative": boolean,
  "reason": "brief 1-sentence explanation"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text;
    if (text) {
      const parsed = JSON.parse(text);
      return {
        isFigurative: Boolean(parsed.isFigurative),
        reason: `LLM Disambiguation: ${parsed.reason || 'Evaluated context using Gemini'}`,
        source: 'llm',
      };
    }
  } catch (err) {
    console.warn('LLM disambiguation failed, falling back to rule-based decision:', err);
  }

  return null;
}

/**
 * Main Disambiguator combining Rule-Based and optional LLM pass.
 */
export async function disambiguateContext(
  entry: IdiomEntry,
  tokens: Token[],
  startTokenIdx: number,
  endTokenIdx: number,
  sourceLang: Language,
  fullInputText: string
): Promise<DisambiguationResult> {
  const ruleResult = disambiguateRuleBased(entry, tokens, startTokenIdx, endTokenIdx, sourceLang);

  // If feature flag is enabled, attempt LLM disambiguation
  if (process.env.ENABLE_LLM_DISAMBIGUATION === 'true') {
    const llmResult = await disambiguateWithLLM(entry, fullInputText, sourceLang);
    if (llmResult !== null) {
      return llmResult;
    }
  }

  return ruleResult;
}
