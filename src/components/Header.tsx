import React from 'react';
import { BookOpen, Languages, ShieldCheck, Sparkles } from 'lucide-react';

import logoImg from '../assets/images/yoruba_owe_logo_1785108414833.jpg';

interface HeaderProps {
  activeTab: 'translator' | 'curator' | 'lexicon';
  setActiveTab: (tab: 'translator' | 'curator' | 'lexicon') => void;
  llmEnabled?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, llmEnabled }) => {
  return (
    <header className="bg-slate-900 text-white border-b border-slate-700 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-3">
          <img
            src={logoImg}
            alt="YorùbáÒwe Logo"
            referrerPolicy="no-referrer"
            className="w-9 h-9 rounded-lg object-cover shadow-sm border border-slate-700"
          />
          <div className="flex items-baseline gap-2">
            <h1 className="text-xl font-semibold tracking-tight text-white font-serif">
              YorùbáÒwe
            </h1>
            <span className="text-slate-400 font-normal text-xs uppercase tracking-wider hidden sm:inline">
              v1.0.4
            </span>
          </div>
        </div>

        {/* Navigation Tabs (Pill Container) */}
        <nav className="flex bg-slate-800 rounded-full p-1 border border-slate-700 text-xs font-medium">
          <button
            onClick={() => setActiveTab('translator')}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-1.5 rounded-full transition-all ${
              activeTab === 'translator'
                ? 'bg-slate-100 text-slate-900 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Languages className="w-3.5 h-3.5" />
            <span>Translator</span>
          </button>

          <button
            onClick={() => setActiveTab('lexicon')}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-1.5 rounded-full transition-all ${
              activeTab === 'lexicon'
                ? 'bg-slate-100 text-slate-900 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Lexicon</span>
          </button>

          <button
            onClick={() => setActiveTab('curator')}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-1.5 rounded-full transition-all ${
              activeTab === 'curator'
                ? 'bg-slate-100 text-slate-900 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Curator</span>
          </button>
        </nav>

        {/* LLM Status Indicator */}
        <div className="hidden md:flex items-center gap-2 text-xs text-slate-300 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
          <Sparkles className={`w-3.5 h-3.5 ${llmEnabled ? 'text-amber-400' : 'text-slate-500'}`} />
          <span>LLM Pass:</span>
          <span className={`font-mono font-semibold ${llmEnabled ? 'text-emerald-400' : 'text-slate-400'}`}>
            {llmEnabled ? 'ENABLED' : 'OFF'}
          </span>
        </div>
      </div>
    </header>
  );
};

