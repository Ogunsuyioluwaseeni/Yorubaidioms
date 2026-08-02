import React, { useState, useEffect } from 'react';
import { X, PlusCircle, Save } from 'lucide-react';
import { IdiomEntry } from '../types/index.js';

interface LexiconEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: () => void;
  initialEntry?: IdiomEntry | null;
  presetYoruba?: string;
}

export const LexiconEditorModal: React.FC<LexiconEditorModalProps> = ({
  isOpen,
  onClose,
  onSaveSuccess,
  initialEntry,
  presetYoruba,
}) => {
  const [yoruba, setYoruba] = useState('');
  const [literalGloss, setLiteralGloss] = useState('');
  const [figurativeSense, setFigurativeSense] = useState('');
  const [englishEquivalentsStr, setEnglishEquivalentsStr] = useState('');
  const [register, setRegister] = useState('proverbial');
  const [usageNote, setUsageNote] = useState('');
  const [isProverb, setIsProverb] = useState(true);
  const [sourceNote, setSourceNote] = useState('Curator verified entry');
  const [verified, setVerified] = useState(true);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialEntry) {
      setYoruba(initialEntry.yoruba || '');
      setLiteralGloss(initialEntry.literalGloss || '');
      setFigurativeSense(initialEntry.figurativeSense || '');
      setEnglishEquivalentsStr((initialEntry.englishEquivalents || []).join(', '));
      setRegister(initialEntry.register || 'proverbial');
      setUsageNote(initialEntry.usageNote || '');
      setIsProverb(Boolean(initialEntry.isProverb));
      setSourceNote(initialEntry.sourceNote || 'Curator verified entry');
      setVerified(Boolean(initialEntry.verified));
    } else if (presetYoruba) {
      setYoruba(presetYoruba);
      setLiteralGloss('');
      setFigurativeSense('');
      setEnglishEquivalentsStr('');
      setRegister('proverbial');
      setUsageNote('');
      setIsProverb(true);
      setSourceNote('Curator reviewed from translation log');
      setVerified(true);
    } else {
      setYoruba('');
      setLiteralGloss('');
      setFigurativeSense('');
      setEnglishEquivalentsStr('');
      setRegister('proverbial');
      setUsageNote('');
      setIsProverb(true);
      setSourceNote('Curator entry');
      setVerified(true);
    }
  }, [initialEntry, presetYoruba, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!yoruba.trim() || !literalGloss.trim() || !figurativeSense.trim()) {
      setError('Please fill out Yorùbá text, literal gloss, and figurative sense.');
      return;
    }

    const englishEquivalents = englishEquivalentsStr
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (englishEquivalents.length === 0) {
      setError('Please provide at least one English equivalent.');
      return;
    }

    setSaving(true);
    setError(null);

    const payload = {
      yoruba: yoruba.trim(),
      literalGloss: literalGloss.trim(),
      figurativeSense: figurativeSense.trim(),
      englishEquivalents,
      register,
      usageNote: usageNote.trim(),
      isProverb,
      sourceNote: sourceNote.trim(),
      verified,
    };

    try {
      const url = initialEntry ? `/api/lexicon/${initialEntry.id}` : '/api/lexicon';
      const method = initialEntry ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error?.message || 'Failed to save lexicon entry.');
      }

      onSaveSuccess();
      onClose();
    } catch (err: any) {
      console.error('Save lexicon error:', err);
      setError(err.message || 'Error saving lexicon entry.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl p-6 shadow-xl space-y-5 my-8 text-slate-800">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-amber-600" />
            <h2 className="text-lg font-bold text-slate-900 font-serif">
              {initialEntry ? 'Edit Lexicon Entry' : 'Add New Lexicon Entry'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-sm text-slate-800">
          {/* Yorùbá Canonical Text */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Yorùbá Proverb / Idiom (Full Tone Marks) *
            </label>
            <input
              type="text"
              value={yoruba}
              onChange={(e) => setYoruba(e.target.value)}
              placeholder='e.g. "Ilé la ti ń kọ́ ẹ̀ṣọ́ rẹ̀ wọ̀de"'
              className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-slate-400 rounded-xl p-3 text-slate-900 font-serif font-bold text-base focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Literal Gloss */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Literal Word-for-Word Gloss *
              </label>
              <input
                type="text"
                value={literalGloss}
                onChange={(e) => setLiteralGloss(e.target.value)}
                placeholder='e.g. "From home we wear good character outside"'
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-slate-400 rounded-xl p-3 focus:outline-none"
                required
              />
            </div>

            {/* Figurative Sense */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Figurative Sense (Plain Meaning) *
              </label>
              <input
                type="text"
                value={figurativeSense}
                onChange={(e) => setFigurativeSense(e.target.value)}
                placeholder='e.g. "Good character and discipline begin within the family"'
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-slate-400 rounded-xl p-3 focus:outline-none"
                required
              />
            </div>
          </div>

          {/* English Equivalents */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              English Equivalents (Comma-Separated, Ranked) *
            </label>
            <input
              type="text"
              value={englishEquivalentsStr}
              onChange={(e) => setEnglishEquivalentsStr(e.target.value)}
              placeholder="Charity begins at home, Good character begins at home, Manners begin at home"
              className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-slate-400 rounded-xl p-3 focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Register */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Register / Tone
              </label>
              <select
                value={register}
                onChange={(e) => setRegister(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-slate-400 rounded-xl p-3 focus:outline-none text-slate-800"
              >
                <option value="proverbial">Proverbial (Òwe)</option>
                <option value="formal">Formal / Governance</option>
                <option value="colloquial">Colloquial / Everyday</option>
              </select>
            </div>

            {/* Source Note */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Source Citation Note
              </label>
              <input
                type="text"
                value={sourceNote}
                onChange={(e) => setSourceNote(e.target.value)}
                placeholder="e.g. Published Yorùbá Proverb Collection, Vol 2"
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-slate-400 rounded-xl p-3 focus:outline-none"
              />
            </div>
          </div>

          {/* Usage Note */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Usage Context & Cultural Note
            </label>
            <textarea
              value={usageNote}
              onChange={(e) => setUsageNote(e.target.value)}
              placeholder="e.g. Used when advising a young adult on family responsibility..."
              rows={2}
              className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-slate-400 rounded-xl p-3 focus:outline-none"
            />
          </div>

          {/* Checkboxes */}
          <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-slate-200">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isProverb}
                onChange={(e) => setIsProverb(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-50 border-slate-300 text-amber-600 focus:ring-amber-500"
              />
              <span className="font-medium text-xs text-slate-800">Is a Proverb (Òwe)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={verified}
                onChange={(e) => setVerified(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-50 border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="font-medium text-xs text-emerald-700">Verified by Native Speaker</span>
            </label>
          </div>

          {/* Submit buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer shadow-2xs"
            >
              <Save className="w-4 h-4 text-amber-400" />
              <span>{saving ? 'Saving...' : 'Save Lexicon Entry'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

