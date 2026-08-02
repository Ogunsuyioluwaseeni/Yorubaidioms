import React, { useState, useEffect } from 'react';
import { AlertCircle, PlusCircle, RefreshCw, ShieldCheck, Sparkles, Plus } from 'lucide-react';
import { TranslationLogRecord } from '../types/index.js';
import { LexiconEditorModal } from './LexiconEditorModal.js';

export const CuratorView: React.FC = () => {
  const [flaggedLogs, setFlaggedLogs] = useState<TranslationLogRecord[]>([]);
  const [flaggedCount, setFlaggedCount] = useState(0);
  const [totalLogs, setTotalLogs] = useState(0);
  const [loading, setLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [presetYoruba, setPresetYoruba] = useState<string>('');

  const fetchFlaggedLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/flagged');
      if (res.ok) {
        const data = await res.json();
        setFlaggedLogs(data.logs || []);
        setFlaggedCount(data.flaggedCount || 0);
        setTotalLogs(data.totalLogs || 0);
      }
    } catch (err) {
      console.error('Failed to fetch flagged logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlaggedLogs();
  }, []);

  const handleCurateLog = (log: TranslationLogRecord) => {
    setPresetYoruba(log.originalText);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Curator Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-slate-800" />
            <h2 className="text-xl font-bold font-serif text-slate-900">
              Curator Review & Flagged Translations
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Review translations logged as "Literal Fallback" to identify missing proverbs and curate new entries into the lexicon.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchFlaggedLogs}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer shadow-2xs"
            title="Refresh logs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => {
              setPresetYoruba('');
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-2xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Add New Entry</span>
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border border-amber-200 p-4 rounded-xl flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[10px] text-amber-800 font-bold uppercase tracking-wider block">
              Flagged Low-Confidence
            </span>
            <span className="text-2xl font-black text-amber-900 font-serif">{flaggedCount}</span>
          </div>
          <AlertCircle className="w-8 h-8 text-amber-500/80" />
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
              Total Logged Queries
            </span>
            <span className="text-2xl font-black text-slate-900 font-serif">{totalLogs}</span>
          </div>
          <Sparkles className="w-8 h-8 text-emerald-600/80" />
        </div>
      </div>

      {/* Flagged Translations Table */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600" />
          <span>Recent Fallback Logged Queries ({flaggedLogs.length})</span>
        </h3>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">Loading flagged logs...</div>
        ) : flaggedLogs.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm bg-slate-50 rounded-xl border border-slate-200">
            No fallback translation logs recorded yet. Try translating text without an idiom in the translator to generate curator logs!
          </div>
        ) : (
          <div className="space-y-3">
            {flaggedLogs.map((log) => (
              <div
                key={log.translationId}
                className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="space-y-1 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200">
                      Fallback Logged
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>

                  <p className="text-sm font-serif font-semibold text-slate-900">
                    "{log.originalText}"
                  </p>
                  <p className="text-xs text-slate-600 italic">
                    Fallback Output: "{log.translatedText}"
                  </p>
                </div>

                <button
                  onClick={() => handleCurateLog(log)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-800 hover:text-slate-900 border border-slate-300 text-xs font-semibold transition-colors flex-shrink-0 cursor-pointer shadow-2xs"
                >
                  <PlusCircle className="w-4 h-4 text-amber-600" />
                  <span>Curate into Lexicon</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lexicon Editor Modal */}
      <LexiconEditorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaveSuccess={fetchFlaggedLogs}
        presetYoruba={presetYoruba}
      />
    </div>
  );
};

