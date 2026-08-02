import React, { useState, useEffect } from 'react';
import { Header } from './components/Header.js';
import { TranslatorView } from './components/TranslatorView.js';
import { LexiconExplorer } from './components/LexiconExplorer.js';
import { CuratorView } from './components/CuratorView.js';

export default function App() {
  const [activeTab, setActiveTab] = useState<'translator' | 'curator' | 'lexicon'>('translator');
  const [llmEnabled, setLlmEnabled] = useState(false);

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        if (data.llmDisambiguationEnabled) {
          setLlmEnabled(true);
        }
      })
      .catch((err) => console.error('Health check error:', err));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-amber-100 selection:text-slate-900 antialiased">
      {/* Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        llmEnabled={llmEnabled}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Tab views */}
        {activeTab === 'translator' && <TranslatorView />}
        {activeTab === 'lexicon' && <LexiconExplorer />}
        {activeTab === 'curator' && <CuratorView />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white text-slate-500 text-xs py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 font-serif">YorùbáÒwe</span>
            <span className="text-slate-400">— Four-Layer Idiom & Proverb Translation System</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

