import fs from 'fs';
import path from 'path';
import { IdiomEntry, Language } from '../types/index.js';
import { normalizeText } from './normalizer.js';

export interface ILexiconRepository {
  getAll(): IdiomEntry[];
  getPaginated(page: number, limit: number, search?: string): { entries: IdiomEntry[]; total: number };
  getById(id: string): IdiomEntry | undefined;
  add(entry: Omit<IdiomEntry, 'id'>): IdiomEntry;
  update(id: string, updates: Partial<IdiomEntry>): IdiomEntry | undefined;
  findMatchesForNormalized(normalizedSpan: string, sourceLang: Language): IdiomEntry[];
}

export class JsonFileLexiconRepository implements ILexiconRepository {
  private filePath: string;
  private entries: IdiomEntry[] = [];

  constructor(customPath?: string) {
    this.filePath = customPath || path.join(process.cwd(), 'src', 'data', 'lexicon.json');
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        this.entries = JSON.parse(raw);
      } else {
        this.entries = [];
      }
    } catch (err) {
      console.error('Failed to load lexicon file:', err);
      this.entries = [];
    }
  }

  private save() {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.filePath, JSON.stringify(this.entries, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save lexicon file:', err);
    }
  }

  public getAll(): IdiomEntry[] {
    return [...this.entries];
  }

  public getPaginated(page = 1, limit = 10, search?: string): { entries: IdiomEntry[]; total: number } {
    let filtered = this.entries;
    if (search && search.trim().length > 0) {
      const normSearch = normalizeText(search);
      filtered = this.entries.filter((e) =>
        normalizeText(e.yoruba).includes(normSearch) ||
        e.englishEquivalents.some((eq) => normalizeText(eq).includes(normSearch)) ||
        normalizeText(e.figurativeSense).includes(normSearch) ||
        normalizeText(e.literalGloss).includes(normSearch)
      );
    }

    const startIndex = (page - 1) * limit;
    const paginatedEntries = filtered.slice(startIndex, startIndex + limit);
    return {
      entries: paginatedEntries,
      total: filtered.length,
    };
  }

  public getById(id: string): IdiomEntry | undefined {
    return this.entries.find((e) => e.id === id);
  }

  public add(entryData: Omit<IdiomEntry, 'id'>): IdiomEntry {
    const newEntry: IdiomEntry = {
      ...entryData,
      id: `yowe-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    };
    this.entries.unshift(newEntry);
    this.save();
    return newEntry;
  }

  public update(id: string, updates: Partial<IdiomEntry>): IdiomEntry | undefined {
    const index = this.entries.findIndex((e) => e.id === id);
    if (index === -1) return undefined;

    this.entries[index] = {
      ...this.entries[index],
      ...updates,
      id, // ensure ID is preserved
    };
    this.save();
    return this.entries[index];
  }

  public findMatchesForNormalized(normalizedSpan: string, sourceLang: Language): IdiomEntry[] {
    const matches: IdiomEntry[] = [];
    const normSpan = normalizeText(normalizedSpan);

    for (const entry of this.entries) {
      if (sourceLang === 'yo') {
        const normYoruba = normalizeText(entry.yoruba);
        if (normYoruba === normSpan) {
          matches.push(entry);
        }
      } else {
        // sourceLang === 'en'
        for (const eq of entry.englishEquivalents) {
          if (normalizeText(eq) === normSpan) {
            matches.push(entry);
            break;
          }
        }
      }
    }

    return matches;
  }
}

// Export singleton instance
export const lexiconRepo = new JsonFileLexiconRepository();
