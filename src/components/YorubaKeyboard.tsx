import React from 'react';
import { Keyboard, Sparkles } from 'lucide-react';

interface YorubaKeyboardProps {
  onInsertChar: (char: string) => void;
  onSelectPreset: (text: string, sourceLang: 'yo' | 'en') => void;
  sourceLang: 'yo' | 'en';
}

const YORUBA_CHARS = [
  'á', 'à', 'ā', 'é', 'è', 'ē',
  'ẹ', 'ẹ́', 'ẹ̀', 'i', 'í', 'ì',
  'ó', 'ò', 'ō', 'ọ', 'ọ́', 'ọ̀',
  'ú', 'ù', 'ū', 'ṣ', 'ń', 'ǹ'
];

const PRESETS = [
  {
    label: 'Ilé la ti ń kọ́...',
    text: 'Ilé la ti ń kọ́ ẹ̀ṣọ́ rẹ̀ wọ̀de',
    lang: 'yo' as const,
  },
  {
    label: 'Agbà kì í wà...',
    text: 'Agbà kì í wà lọ́jà kàran orí ẹran wọ́',
    lang: 'yo' as const,
  },
  {
    label: 'Charity begins at home',
    text: 'Charity begins at home',
    lang: 'en' as const,
  },
  {
    label: 'Where there is life...',
    text: 'Bí ẹ̀mí bá wà, ìrètí ń bẹ',
    lang: 'yo' as const,
  },
];

export const YorubaKeyboard: React.FC<YorubaKeyboardProps> = ({
  onInsertChar,
  onSelectPreset,
  sourceLang,
}) => {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs space-y-2.5">
      {/* Quick Character Palette for Yorùbá */}
      {sourceLang === 'yo' && (
        <div>
          <div className="flex items-center gap-1.5 text-slate-500 font-medium mb-1.5">
            <Keyboard className="w-3.5 h-3.5 text-amber-600" />
            <span>Yorùbá Diacritic Quick Palette:</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {YORUBA_CHARS.map((char) => (
              <button
                key={char}
                type="button"
                onClick={() => onInsertChar(char)}
                className="w-7 h-7 flex items-center justify-center rounded bg-white hover:bg-amber-50 text-slate-700 hover:text-amber-900 font-medium border border-slate-200 hover:border-amber-400 transition-colors shadow-2xs cursor-pointer"
              >
                {char}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Preset Proverbs for quick testing */}
      <div className="pt-1 border-t border-slate-200">
        <div className="flex items-center gap-1.5 text-slate-500 font-medium mb-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>Try Sample Proverbs (òwe):</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => onSelectPreset(preset.text, preset.lang)}
              className="px-2.5 py-1 text-xs rounded-lg bg-white hover:bg-amber-50 text-slate-700 hover:text-amber-900 border border-slate-200 hover:border-amber-300 transition-colors shadow-2xs font-serif cursor-pointer"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

