import React, { useState, useRef } from 'react'; // [修复1] 补上了 useRef
import { ArrowRightLeft, Copy, Mic, Volume2, Sparkles, Check, RotateCcw, StopCircle } from 'lucide-react';
import { API_BASE_URL } from '../../config';

const LANGUAGES = [
  { code: 'my', name: 'Malay' }, // 修正拼写 Melay -> Malay
  { code: 'en', name: 'English' },
  { code: 'ja', name: 'Japanese' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh', name: 'Chinese' },
  { code: 'it', name: 'Italian' },
  { code: 'de', name: 'German' },
];

// [修复2] 补上了这个关键的语言转换函数，没有它录音和朗读都会失效
const getWebSpeechLang = (langCode: string) => {
  const map: { [key: string]: string } = {
    'en': 'en-US',
    'ja': 'ja-JP',
    'es': 'es-ES',
    'fr': 'fr-FR',
    'ko': 'ko-KR',
    'zh': 'zh-CN',
    'it': 'it-IT',
    'de': 'de-DE',
    'my': 'ms-MY', 
  };
  return map[langCode] || langCode;
};

const TranslateView: React.FC = () => {
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [sourceLang, setSourceLang] = useState('en');
  const [targetLang, setTargetLang] = useState('ja');
  const [isTranslating, setIsTranslating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  const recognitionRef = useRef<any>(null); 

  const handleSwapLanguages = () => {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setSourceText(translatedText);
    setTranslatedText(sourceText);
  };

  const handleTranslate = async () => {
    if (!sourceText.trim()) return;
    
    setIsTranslating(true);
    setTranslatedText(''); 

    try {
      const response = await fetch(`${API_BASE_URL}/translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: sourceText,
          source_lang: sourceLang,
          target_lang: targetLang,
        }),
      });

      if (!response.ok) {
        throw new Error(`Translation failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status === 'success') {
        setTranslatedText(data.translation);
      } else {
        console.error("Translation error from backend:", data.error);
        setTranslatedText("Error: Could not translate.");
      }

    } catch (error) {
      console.error("Network or Server Error:", error);
      setTranslatedText("Error: Failed to connect to translation service.");
    } finally {
      setIsTranslating(false);
    }
  };

  const handleCopy = () => {
    if (!translatedText) return;
    navigator.clipboard.writeText(translatedText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

//   [修复3] 补上了朗读功能函数，没有它点击喇叭会报错或没反应
//  const handleSpeak = (text: string, lang: string) => {
//    if (!text) return;
//    
//    // 停止当前正在播放的声音
//    window.speechSynthesis.cancel();
//
//    const utterance = new SpeechSynthesisUtterance(text);
//    utterance.lang = getWebSpeechLang(lang); // 这里调用了上面的辅助函数
//    utterance.rate = 1; // 语速
//    
//    window.speechSynthesis.speak(utterance);
//  };

  const handleSpeak = async (text: string, lang: string) => {
    if (!text) return;

    // 如果正在播放，先停止（防止重叠）
    // 注意：HTML5 Audio 无法像 speechSynthesis 那样全局取消，
    // 这里我们简单地利用一个类变量或者由用户点击再次触发时覆盖。
    // 为了简单起见，我们直接创建新的 Audio 对象播放。
    
    try {
      // 1. 请求后端获取音频 Blob
      const response = await fetch(`${API_BASE_URL}/tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          lang: lang,
        }),
      });

      if (!response.ok) {
        throw new Error('TTS request failed');
      }

      // 2. 将响应转换为 Blob (二进制音频数据)
      const blob = await response.blob();
      
      // 3. 创建临时 URL 并播放
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      
      // 播放音频
      audio.play();

      // 播放结束后释放 URL 内存
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
      };

    } catch (error) {
      console.error("Speech error:", error);
      // [可选] 如果后端失败，降级使用浏览器自带的“难听”声音作为备选
      // const utterance = new SpeechSynthesisUtterance(text);
      // utterance.lang = getWebSpeechLang(lang);
      // window.speechSynthesis.speak(utterance);
    }
  };

  const startRecording = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("您的浏览器不支持语音识别，请使用 Chrome 或 Edge。");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = getWebSpeechLang(sourceLang); // 这里调用了上面的辅助函数
    recognition.continuous = false; 
    recognition.interimResults = false; 

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSourceText(transcript); 
    };

    recognition.onerror = (event: any) => {
      console.error("语音识别错误:", event.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleMicClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
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
          <div className={`flex flex-col h-full bg-white dark:bg-slate-800 rounded-3xl p-5 border transition-all shadow-sm ${isRecording ? 'border-red-500 ring-4 ring-red-500/10' : 'border-slate-200 dark:border-slate-700/50 focus-within:border-sky-400'}`}>
            <textarea
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              placeholder={isRecording ? "正在听..." : "Enter text to translate..."}
              className="flex-1 w-full bg-transparent resize-none border-none outline-none text-lg text-slate-900 dark:text-white placeholder-slate-400"
            />
            <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-700">
               <div className="flex gap-2">
                 <button 
                   onClick={handleMicClick}
                   className={`p-2 rounded-xl transition-all active:scale-95 ${isRecording ? 'text-red-500 bg-red-50 animate-pulse' : 'text-slate-400 hover:text-sky-600 dark:hover:text-indigo-400 hover:bg-slate-50'}`}
                   title="语音输入"
                 >
                   {isRecording ? <StopCircle className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                 </button>

                 <button 
                   onClick={() => handleSpeak(sourceText, sourceLang)}
                   className="p-2 text-slate-400 hover:text-sky-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-all active:scale-95"
                   title="朗读原文"
                 >
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
                    title="复制译文"
                 >
                   {isCopied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                 </button>

                 <button 
                   onClick={() => handleSpeak(translatedText, targetLang)}
                   className="p-2 text-slate-400 hover:text-sky-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all active:scale-95"
                   title="朗读译文"
                 >
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