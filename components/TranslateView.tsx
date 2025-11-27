
import React, { useState } from 'react';
import { ArrowRightLeft, Copy, Mic, Volume2, Sparkles, Check, RotateCcw } from 'lucide-react';

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'ja', name: 'Japanese' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh', name: 'Chinese' },
  { code: 'it', name: 'Italian' },
  { code: 'de', name: 'German' },
];

const TranslateView: React.FC = () => {
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [sourceLang, setSourceLang] = useState('en');
  const [targetLang, setTargetLang] = useState('ja');
  const [isTranslating, setIsTranslating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleSwapLanguages = () => {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setSourceText(translatedText);
    setTranslatedText(sourceText);
  };

  const handleTranslate = () => {
    if (!sourceText.trim()) return;
    
    setIsTranslating(true);
    // Simulate API call delay
    setTimeout(() => {
      // Mock translation logic
      const mockTranslations: {[key: string]: string} = {
        'ja': 'こんにちは、元気ですか？', // Hello, how are you?
        'es': 'Hola, ¿cómo estás?',
        'fr': 'Bonjour, comment allez-vous?',
        'ko': '안녕하세요, 어떻게 지내세요?',
        'zh': '你好，你好吗？',
        'en': 'Hello, how are you?',
      };
      
      // If we have a mock for the target lang, use it, otherwise generic placeholder
      // For demo purposes, we just return a static string based on lang or echo the text
      const mockResult = mockTranslations[targetLang] || `[Translated to ${LANGUAGES.find(l => l.code === targetLang)?.name}]: ${sourceText}`;
      
      setTranslatedText(mockResult);
      setIsTranslating(false);
    }, 800);
  };

  const handleCopy = () => {
    if (!translatedText) return;
    navigator.clipboard.writeText(translatedText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="p-6 md:p-8 w-full mx-auto space-y-8 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
         <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-indigo-900/30 flex items-center justify-center">
           <ArrowRightLeft className="w-6 h-6 text-sky-600 dark:text-indigo-400" />
         </div>
         <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Live Translation</h2>
      </div>

      <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-[2.5rem] p-6 md:p-8 shadow-sm border border-transparent hover:border-sky-300 dark:hover:border-indigo-500 transition-all duration-500 ease-out hover:shadow-xl hover:bg-white/70 dark:hover:bg-slate-900/70 relative overflow-hidden">
        
        {/* Language Selectors */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8 bg-white dark:bg-slate-800 p-2 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm">
          <select 
            value={sourceLang}
            onChange={(e) => setSourceLang(e.target.value)}
            className="w-full md:w-auto bg-transparent font-bold text-slate-700 dark:text-slate-200 p-3 rounded-xl focus:outline-none hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer text-center md:text-left"
          >
            {LANGUAGES.map(lang => (
              <option key={lang.code} value={lang.code}>{lang.name}</option>
            ))}
          </select>

          <button 
            onClick={handleSwapLanguages}
            className="p-3 bg-slate-100 dark:bg-slate-700 rounded-full hover:bg-sky-100 dark:hover:bg-indigo-900/50 text-slate-500 hover:text-sky-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-all active:scale-95 active:rotate-180 duration-300"
          >
            <ArrowRightLeft className="w-5 h-5" />
          </button>

          <select 
            value={targetLang}
            onChange={(e) => setTargetLang(e.target.value)}
            className="w-full md:w-auto bg-transparent font-bold text-sky-600 dark:text-indigo-400 p-3 rounded-xl focus:outline-none hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer text-center md:text-right"
          >
            {LANGUAGES.map(lang => (
              <option key={lang.code} value={lang.code}>{lang.name}</option>
            ))}
          </select>
        </div>

        {/* Translation Area */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 h-[400px]">
          {/* Source Input */}
          <div className="flex flex-col h-full bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-200 dark:border-slate-700/50 focus-within:border-sky-400 dark:focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-sky-500/10 transition-all shadow-sm">
            <textarea
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              placeholder="Enter text to translate..."
              className="flex-1 w-full bg-transparent resize-none border-none outline-none text-lg text-slate-900 dark:text-white placeholder-slate-400"
            />
            <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-700">
               <div className="flex gap-2">
                 <button className="p-2 text-slate-400 hover:text-sky-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-all active:scale-95">
                   <Mic className="w-5 h-5" />
                 </button>
                 <button className="p-2 text-slate-400 hover:text-sky-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-all active:scale-95">
                   <Volume2 className="w-5 h-5" />
                 </button>
               </div>
               <span className="text-xs font-medium text-slate-400">{sourceText.length} chars</span>
            </div>
          </div>

          {/* Target Output */}
          <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900/50 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 relative group">
            {isTranslating ? (
              <div className="flex-1 flex flex-col items-center justify-center text-sky-600 dark:text-indigo-400 animate-pulse gap-3">
                <Sparkles className="w-8 h-8 animate-spin" />
                <span className="font-bold text-sm">Translating...</span>
              </div>
            ) : (
              <textarea
                readOnly
                value={translatedText}
                placeholder="Translation will appear here..."
                className="flex-1 w-full bg-transparent resize-none border-none outline-none text-lg text-slate-700 dark:text-slate-200 placeholder-slate-400 cursor-default"
              />
            )}
            
            <div className="flex justify-between items-center pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
               <div className="flex gap-2">
                 <button 
                    onClick={handleCopy}
                    className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all active:scale-95 flex items-center gap-2"
                 >
                   {isCopied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                 </button>
                 <button className="p-2 text-slate-400 hover:text-sky-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all active:scale-95">
                   <Volume2 className="w-5 h-5" />
                 </button>
               </div>
               {translatedText && (
                 <button 
                  onClick={() => setTranslatedText('')}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all active:scale-95"
                 >
                    <RotateCcw className="w-4 h-4" />
                 </button>
               )}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-8 flex justify-end">
          <button 
            onClick={handleTranslate}
            disabled={!sourceText || isTranslating}
            className="px-8 py-4 bg-sky-600 hover:bg-sky-500 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white rounded-2xl text-base font-bold shadow-lg shadow-sky-600/30 dark:shadow-indigo-600/30 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-1 hover:shadow-xl flex items-center gap-3"
          >
             {isTranslating ? 'Translating...' : 'Translate Text'}
             <Sparkles className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TranslateView;
