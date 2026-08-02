import React from 'react';
import { BookOpen, CheckCircle, HelpCircle, Info, Sparkles } from 'lucide-react';
import { MatchedSpan } from '../types/index.js';

interface IdiomSpanCardProps {
  span: MatchedSpan;
  isExpanded?: boolean;
}

export const IdiomSpanCard: React.FC<IdiomSpanCardProps> = ({ span }) => {
  const idiom = span.matchedIdiom;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 text-slate-800">
      {/* Header Badge */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            Detected Idiom Match
          </span>
          {idiom.isProverb && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
              Proverb (Òwe)
            </span>
          )}
          {idiom.register && (
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-100 text-slate-700">
              {idiom.register}
            </span>
          )}
        </div>

        {/* Verification Status */}
        <div className="flex items-center gap-1.5 text-xs">
          {idiom.verified ? (
            <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
              <CheckCircle className="w-3.5 h-3.5" /> Verified Native Speaker
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-amber-800 font-medium bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              <HelpCircle className="w-3.5 h-3.5" /> Seed Placeholder (Unverified)
            </span>
          )}
        </div>
      </div>

      {/* Canonical Form */}
      <div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Canonical Yorùbá Form
        </span>
        <p className="text-lg font-serif font-bold text-slate-900 mt-0.5">
          {idiom.yoruba}
        </p>
      </div>

      {/* Side-By-Side: Literal Gloss vs Figurative Sense */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
        {/* Literal Gloss */}
        <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <BookOpen className="w-3.5 h-3.5 text-slate-500" />
            <span>Literal Word-for-Word Gloss</span>
          </div>
          <p className="text-sm italic text-slate-700 font-serif leading-relaxed">
            "{span.literalGloss || idiom.literalGloss}"
          </p>
        </div>

        {/* Figurative Sense */}
        <div className="bg-emerald-50/60 p-3.5 rounded-lg border border-emerald-200 space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Figurative Meaning (Plain Sense)</span>
          </div>
          <p className="text-sm font-medium text-slate-900 leading-relaxed">
            {span.figurativeSense || idiom.figurativeSense}
          </p>
        </div>
      </div>

      {/* English Equivalents */}
      {idiom.englishEquivalents && idiom.englishEquivalents.length > 0 && (
        <div className="pt-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
            Ranked English Equivalents:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {idiom.englishEquivalents.map((eq, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 text-xs rounded-lg bg-slate-100 text-slate-800 border border-slate-200 font-medium"
              >
                {idx === 0 ? '⭐ ' : ''}
                {eq}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Usage Note & Disambiguation Reason */}
      {(idiom.usageNote || span.disambiguationReason) && (
        <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-start gap-2">
          <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            {idiom.usageNote && (
              <p>
                <strong className="text-slate-800">Usage Note:</strong> {idiom.usageNote}
              </p>
            )}
            {span.disambiguationReason && (
              <p>
                <strong className="text-emerald-800">Context Disambiguation:</strong>{' '}
                {span.disambiguationReason}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Source Citation */}
      {idiom.sourceNote && (
        <p className="text-[11px] text-slate-400 italic pt-1">
          Source: {idiom.sourceNote}
        </p>
      )}
    </div>
  );
};

