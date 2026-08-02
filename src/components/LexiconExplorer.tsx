import React, { useState, useEffect } from 'react';
import { BookOpen, CheckCircle, Edit3, HelpCircle, Plus, Search } from 'lucide-react';
import { IdiomEntry } from '../types/index.js';
import { LexiconEditorModal } from './LexiconEditorModal.js';

export const LexiconExplorer: React.FC = () => {
  const [entries, setEntries] = useState<IdiomEntry[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<IdiomEntry | null>(null);

  const fetchLexicon = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/lexicon?page=${page}&limit=8&search=${encodeURIComponent(search)}`);
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries || []);
        setTotalPages(data.totalPages || 1);
        setTotal(data.total || 0);
      }
    } catch (err) {
      console.error('Error fetching lexicon:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLexicon();
  }, [page, search]);

  const handleEdit = (entry: IdiomEntry) => {
    setEditingEntry(entry);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingEntry(null);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Bar with Search & Add Button */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-serif text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-600" />
            <span>Curated Yorùbá Proverb Lexicon</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Indexed Yorùbá canonical forms with diacritic-tolerant matching and English equivalents. ({total} total entries)
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search proverbs or meanings..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-400"
            />
          </div>

          <button
            onClick={handleAddNew}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-2xs transition-all flex-shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Entry</span>
          </button>
        </div>
      </div>

      {/* Lexicon Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-sm font-medium">Loading lexicon repository...</div>
      ) : entries.length === 0 ? (
        <div className="p-12 text-center text-slate-500 text-sm bg-white border border-slate-200 rounded-xl shadow-2xs">
          No matching lexicon entries found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-5 shadow-2xs flex flex-col justify-between space-y-3 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      {entry.id}
                    </span>
                    {entry.isProverb && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                        Òwe
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {entry.verified ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                        <CheckCircle className="w-3 h-3" /> Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-amber-800 font-medium">
                        <HelpCircle className="w-3 h-3" /> Unverified Seed
                      </span>
                    )}

                    <button
                      onClick={() => handleEdit(entry)}
                      className="p-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                      title="Edit Entry"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="text-lg font-serif font-bold text-slate-900">
                  {entry.yoruba}
                </h3>

                <div className="mt-2 space-y-1 text-xs">
                  <p className="text-slate-600 italic">
                    <strong className="text-slate-500 not-italic">Gloss:</strong> "{entry.literalGloss}"
                  </p>
                  <p className="text-slate-800 font-medium">
                    <strong className="text-slate-500">Sense:</strong> {entry.figurativeSense}
                  </p>
                </div>

                {entry.englishEquivalents && entry.englishEquivalents.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-1">
                    {entry.englishEquivalents.map((eq, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-700 border border-slate-200 font-medium"
                      >
                        {eq}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {entry.sourceNote && (
                <p className="text-[10px] text-slate-400 pt-2 border-t border-slate-100 italic">
                  Source: {entry.sourceNote}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
            className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 disabled:opacity-40 text-slate-700 text-xs font-semibold border border-slate-200 shadow-2xs cursor-pointer"
          >
            Previous
          </button>
          <span className="text-xs text-slate-500 font-medium">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page === totalPages}
            className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 disabled:opacity-40 text-slate-700 text-xs font-semibold border border-slate-200 shadow-2xs cursor-pointer"
          >
            Next
          </button>
        </div>
      )}

      {/* Lexicon Editor Modal */}
      <LexiconEditorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaveSuccess={fetchLexicon}
        initialEntry={editingEntry}
      />
    </div>
  );
};

