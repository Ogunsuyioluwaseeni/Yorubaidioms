import React, { useState, useRef } from 'react';
import { ArrowLeftRight, Languages, Loader2, RotateCcw, Send } from 'lucide-react';
import { Language, TranslationResponse } from '../types/index.js';
import { YorubaKeyboard } from './YorubaKeyboard.js';
import { TranslationResult } from './TranslationResult.js';

export const TranslatorView: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [sourceLang, setSourceLang] = useState<Language>('yo');
  const [targetLang, setTargetLang] = useState<Language>('en');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TranslationResponse | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSwapLanguages = () => {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    if (result) {
      setInputText(result.translatedText);
      setResult(null);
    }
  };

  const handleInsertChar = (char: string) => {
    if (!textareaRef.current) {
      setInputText((prev) => prev + char);
      return;
    }

    const start = textareaRef.current.selectionStart || 0;
    const end = textareaRef.current.selectionEnd || 0;
    const newText = inputText.substring(0, start) + char + inputText.substring(end);
    setInputText(newText);

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(start + char.length, start + char.length);
      }
    }, 0);
  };

  const handleSelectPreset = (text: string, lang: Language) => {
    setInputText(text);
    setSourceLang(lang);
    setTargetLang(lang === 'yo' ? 'en' : 'yo');
    setResult(null);
  };

  const handleTranslate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: inputText.trim(),
          sourceLang,
          targetLang,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error?.message || 'Translation request failed.');
      }

      const data: TranslationResponse = await res.json();
      setResult(data);
    } catch (err: any) {
      console.error('Translation error:', err);
      setError(err.message || 'Failed to communicate with translation engine.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Translation Form Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-sm space-y-4">
        {/* Language Switcher Bar */}
        <div className="flex items-center justify-between bg-slate-100/80 p-2 rounded-xl border border-slate-200">
          <div className="flex items-center gap-2 font-semibold text-xs px-3.5 py-1.5 rounded-lg bg-white text-slate-800 border border-slate-200 shadow-2xs">
            <Languages className="w-3.5 h-3.5 text-amber-600" />
            <span>{sourceLang === 'yo' ? 'Yorùbá (òwe)' : 'English'}</span>
          </div>

          <button
            type="button"
            onClick={handleSwapLanguages}
            className="p-2 rounded-lg bg-white hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-200 transition-colors shadow-2xs"
            title="Swap Source & Target Languages"
          >
            <ArrowLeftRight className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 font-semibold text-xs px-3.5 py-1.5 rounded-lg bg-white text-slate-800 border border-slate-200 shadow-2xs">
            <span>{targetLang === 'yo' ? 'Yorùbá (òwe)' : 'English'}</span>
          </div>
        </div>

        {/* Input Textarea Form */}
        <form onSubmit={handleTranslate} className="space-y-3">
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                sourceLang === 'yo'
                  ? 'Tẹ òwe tabi ọ̀rọ̀ Yorùbá síbí... (e.g. "Ilé la ti ń kọ́ ẹ̀ṣọ́ rẹ̀ wọ̀de")'
                  : 'Enter English proverb or text here... (e.g. "Charity begins at home")'
              }
              rows={4}
              className="w-full bg-slate-50 border border-slate-200 focus:border-slate-400 focus:bg-white rounded-xl p-4 text-slate-800 placeholder-slate-400 font-serif text-lg leading-relaxed focus:outline-none focus:ring-2 focus:ring-slate-200 transition-all resize-y"
            />
            {inputText && (
              <button
                type="button"
                onClick={() => {
                  setInputText('');
                  setResult(null);
                }}
                className="absolute top-3 right-3 p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-800 text-xs border border-slate-200 transition-colors shadow-2xs"
                title="Clear input"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Yorùbá Virtual Keyboard */}
          <YorubaKeyboard
            onInsertChar={handleInsertChar}
            onSelectPreset={handleSelectPreset}
            sourceLang={sourceLang}
          />

          {/* Form Actions */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-400 font-mono">
              {inputText.length} characters
            </span>

            <button
              type="submit"
              disabled={loading || !inputText.trim()}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 text-white disabled:text-slate-400 font-bold text-sm shadow-sm transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                  <span>Translating...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Translate Idiom</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Error Message */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
            {error}
          </div>
        )}
      </div>

      {/* Result Display */}
      {result && <TranslationResult result={result} />}
    </div>
  );
};

