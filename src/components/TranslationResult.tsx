import React, { useState } from 'react';
import { AlertCircle, Check, Copy, Sparkles, HelpCircle } from 'lucide-react';
import { TranslationResponse } from '../types/index.js';
import { IdiomSpanCard } from './IdiomSpanCard.js';

interface TranslationResultProps {
  result: TranslationResponse;
}

export const TranslationResult: React.FC<TranslationResultProps> = ({ result }) => {
  const [copied, setCopied] = useState(false);
  const [selectedSpanId, setSelectedSpanId] = useState<string | null>(
    result.spans[0]?.id || null
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(result.translatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isIdiomMatch = result.overallConfidence === 'idiom_match';

  return (
    <div className="space-y-6">
      {/* Primary Result Box */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-sm space-y-4">
        {/* Result Top Bar with Confidence Indicator */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Translation Result ({result.sourceLang.toUpperCase()} → {result.targetLang.toUpperCase()})
            </span>
          </div>

          {/* VISIBLE CONFIDENCE INDICATOR */}
          <div>
            {isIdiomMatch ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Idiom Match (High Confidence)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                Literal Fallback (Lower Confidence)
              </span>
            )}
          </div>
        </div>

        {/* Original Input with Idiom Span Highlighting */}
        <div>
          <span className="text-xs text-slate-500 font-medium block mb-1">Original Text:</span>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-base leading-relaxed font-serif">
            {result.spans.length === 0 ? (
              <span>{result.originalText}</span>
            ) : (
              /* Highlight matched idiom span in input */
              <p>
                {result.originalText.split('').map((char, idx) => {
                  const matchedSpan = result.spans.find(
                    (s) => idx >= s.startCharIndex && idx < s.endCharIndex
                  );
                  if (matchedSpan) {
                    return (
                      <mark
                        key={idx}
                        onClick={() => setSelectedSpanId(matchedSpan.id)}
                        className={`cursor-pointer px-1 py-0.5 rounded transition-all font-semibold ${
                          selectedSpanId === matchedSpan.id
                            ? 'bg-amber-200 text-slate-900 border-b-2 border-amber-600 shadow-2xs'
                            : 'bg-amber-100 border-b-2 border-amber-500 text-slate-900 hover:bg-amber-200'
                        }`}
                        title="Click to view literal gloss & figurative sense"
                      >
                        {char}
                      </mark>
                    );
                  }
                  return <span key={idx}>{char}</span>;
                })}
              </p>
            )}
          </div>
          {result.spans.length > 0 && (
            <p className="text-[11px] text-emerald-700 mt-1 flex items-center gap-1 font-medium">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              <span>Highlighted text is a matched idiom from the lexicon. Click highlighted phrase to inspect details below.</span>
            </p>
          )}
        </div>

        {/* Final Translated Text */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
              Translated Output:
            </span>
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 font-medium transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-600 font-semibold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Result</span>
                </>
              )}
            </button>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xl font-serif text-slate-900 font-semibold leading-relaxed">
            {result.translatedText}
          </div>
        </div>

        {/* Fallback Warning Notice */}
        {result.fallbackUsed && !isIdiomMatch && (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
            <HelpCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-950">Literal Fallback Translation Applied</p>
              <p className="mt-0.5 text-amber-900/90 leading-relaxed">
                This sentence did not match an established Yorùbá idiom or proverb in our lexicon. A word-level literal fallback was used, which may lose idiomatic nuance. Curators can add new entries in the Curator Dashboard.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Side-by-side Gloss vs Figurative Cards for Detected Idioms */}
      {result.spans.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Detected Idioms & Proverbs ({result.spans.length})</span>
          </h3>
          <div className="grid grid-cols-1 gap-4">
            {result.spans.map((span) => (
              <IdiomSpanCard key={span.id} span={span} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

