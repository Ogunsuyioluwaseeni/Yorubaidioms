import { normalizeText } from './normalizer.js';

/** Character-trigram set of a normalised string (padded so short strings still work). */
export function trigrams(s: string): Set<string> {
  const p = `  ${normalizeText(s)}  `;
  const set = new Set<string>();
  for (let i = 0; i < p.length - 2; i++) set.add(p.slice(i, i + 3));
  return set;
}

/** Sørensen–Dice similarity between two trigram sets, in [0,1]. */
export function dice(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  const [small, big] = a.size < b.size ? [a, b] : [b, a];
  for (const t of small) if (big.has(t)) inter++;
  return (2 * inter) / (a.size + b.size);
}

export interface NearMatch<T> { entry: T; score: number }

/** Index a lexicon once, then query for the best fuzzy match above a threshold. */
export class NearMatchIndex<T> {
  private items: { entry: T; grams: Set<string> }[];
  constructor(entries: T[], getText: (e: T) => string) {
    this.items = entries.map((entry) => ({ entry, grams: trigrams(getText(entry)) }));
  }
  best(query: string, threshold = 0): NearMatch<T> | null {
    const q = trigrams(query);
    let top: NearMatch<T> | null = null;
    for (const it of this.items) {
      const score = dice(q, it.grams);
      if (!top || score > top.score) top = { entry: it.entry, score };
    }
    return top && top.score >= threshold ? top : null;
  }
}
