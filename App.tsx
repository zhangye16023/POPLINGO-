import React, { useState, useEffect } from 'react';
import { 
  Search, Book, Brain, ArrowRight, Save, Trash2, 
  Sparkles, Settings, Key 
} from 'lucide-react';
import { LANGUAGES } from './constants';
import { DictionaryEntry, AppMode, StoryResult } from './types';
import * as GeminiService from './services/geminiService';
import { AudioButton } from './components/AudioButton';
import { Flashcard } from './components/Flashcard';
import { Onboarding } from './components/Onboarding';

const App: React.FC = () => {
  // State
  const [needsApiKey, setNeedsApiKey] = useState(false);
  const [isOnboarding, setIsOnboarding] = useState(true);
  const [mode, setMode] = useState<AppMode>(AppMode.SEARCH);
  
  // Initialize langs from localStorage or default
  const [nativeLang, setNativeLang] = useState(() => localStorage.getItem('poplingo_native') || 'en');
  const [targetLang, setTargetLang] = useState(() => localStorage.getItem('poplingo_target') || 'es');
  
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentResult, setCurrentResult] = useState<DictionaryEntry | null>(null);
  const [notebook, setNotebook] = useState<DictionaryEntry[]>([]);
  const [story, setStory] = useState<StoryResult | null>(null);
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);
  const [studyIndex, setStudyIndex] = useState(0);

  useEffect(() => {
    // Check for API Key in AI Studio environment
    const checkApiKey = async () => {
      if (window.aistudio) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (!hasKey) {
          setNeedsApiKey(true);
        }
      }
    };
    checkApiKey();

    // Check if user has completed onboarding before
    const hasOnboarded = localStorage.getItem('poplingo_onboarded');
    if (hasOnboarded) {
      setIsOnboarding(false);
    }
    
    // Load notebook
    const saved = localStorage.getItem('poplingo_notebook');
    if (saved) {
      setNotebook(JSON.parse(saved));
    }
  }, []);

  // Save notebook to localStorage
  useEffect(() => {
    localStorage.setItem('poplingo_notebook', JSON.stringify(notebook));
  }, [notebook]);

  // Save language preferences whenever they change
  useEffect(() => {
    localStorage.setItem('poplingo_native', nativeLang);
    localStorage.setItem('poplingo_target', targetLang);
  }, [nativeLang, targetLang]);

  const handleConnectApiKey = async () => {
    if (window.aistudio) {
      try {
        await window.aistudio.openSelectKey();
        // Assume success and proceed to mitigate race condition
        setNeedsApiKey(false);
      } catch (e) {
        console.error("API Key selection failed", e);
        // Reset to allow trying again
        setNeedsApiKey(true);
        alert("Failed to select API Key. Please try again.");
      }
    }
  };

  const completeOnboarding = () => {
    localStorage.setItem('poplingo_onboarded', 'true');
    setIsOnboarding(false);
  };

  const handleReset = () => {
    if(confirm("Change languages? This will take you back to the setup screen.")) {
      setIsOnboarding(true);
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setCurrentResult(null);
    setMode(AppMode.SEARCH);

    try {
      // Parallel execution for speed
      const [data, imageBase64] = await Promise.all([
        GeminiService.lookupWord(query, LANGUAGES.find(l => l.code === nativeLang)?.name || 'English', LANGUAGES.find(l => l.code === targetLang)?.name || 'Spanish'),
        GeminiService.generateVisualization(query)
      ]);

      const newEntry: DictionaryEntry = {
        id: crypto.randomUUID(),
        term: query,
        definition: data.definition || 'Definition unavailable',
        examples: data.examples || [],
        usageNote: data.usageNote || 'No usage notes available.',
        imageBase64: imageBase64,
        nativeLang,
        targetLang,
        timestamp: Date.now()
      };

      setCurrentResult(newEntry);
    } catch (error: any) {
      console.error(error);
      const msg = error?.message || "Unknown error";
      
      if (msg.includes("API Key") || msg.includes("API_KEY") || msg.includes("environment variables")) {
        alert("Missing API Key!\n\n1. Did you set VITE_API_KEY (or NEXT_PUBLIC_API_KEY) in your environment variables?\n2. IMPORTANT: Did you REDEPLOY your app after adding the key? Environment variables are only embedded during the build process.");
      } else {
        alert(`Oops! The AI got a bit confused. Error: ${msg}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const addToNotebook = () => {
    if (currentResult && !notebook.find(n => n.id === currentResult.id)) {
      setNotebook([currentResult, ...notebook]);
    }
  };

  const removeFromNotebook = (id: string) => {
    setNotebook(notebook.filter(n => n.id !== id));
  };

  const generateStory = async () => {
    if (notebook.length < 2) {
      alert("Add at least 2 words to your notebook first!");
      return;
    }
    setIsGeneratingStory(true);
    try {
      const words = notebook.slice(0, 5).map(n => n.term); // Take recent 5
      const result = await GeminiService.generateStory(words, LANGUAGES.find(l => l.code === nativeLang)?.name || 'English');
      setStory(result);
    } catch (err: any) {
      console.error(err);
      alert(`Story generation failed: ${err.message}`);
    } finally {
      setIsGeneratingStory(false);
    }
  };

  const renderHeader = () => (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-100">
      <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
        <h1 className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-pop-pink to-pop-yellow cursor-pointer" onClick={() => setMode(AppMode.SEARCH)}>
          PopLingo
        </h1>
        <div className="flex gap-4 items-center">
          <button 
            onClick={() => setMode(AppMode.SEARCH)}
            className={`p-2 rounded-xl transition-colors ${mode === AppMode.SEARCH ? 'bg-pop-light text-pop-cyan' : 'text-gray-400'}`}
          >
            <Search size={24} />
          </button>
          <button 
            onClick={() => setMode(AppMode.NOTEBOOK)}
            className={`p-2 rounded-xl transition-colors ${mode === AppMode.NOTEBOOK ? 'bg-pop-light text-pop-pink' : 'text-gray-400'}`}
          >
            <Book size={24} />
          </button>
          <button 
            onClick={() => setMode(AppMode.STUDY)}
            className={`p-2 rounded-xl transition-colors ${mode === AppMode.STUDY ? 'bg-pop-light text-pop-green' : 'text-gray-400'}`}
          >
            <Brain size={24} />
          </button>
          <div className="w-px h-6 bg-gray-200 mx-1"></div>
          <button 
             onClick={handleReset}
             className="p-2 rounded-xl text-gray-300 hover:text-pop-dark hover:bg-gray-100 transition-all"
             title="Change Languages"
          >
            <Settings size={20} />
          </button>
        </div>
      </div>
    </header>
  );

  const renderSearch = () => (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Language Indicator */}
      <div className="flex items-center justify-center gap-4 py-2">
         <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100 text-sm font-bold text-gray-500">
            <span>{LANGUAGES.find(l => l.code === nativeLang)?.flag}</span>
            <ArrowRight size={14} />
            <span>{LANGUAGES.find(l => l.code === targetLang)?.flag}</span>
         </div>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="relative group">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Type a word in ${LANGUAGES.find(l => l.code === targetLang)?.name}...`}
          className="w-full bg-white text-lg font-medium text-pop-dark p-6 rounded-2xl shadow-lg border-2 border-transparent focus:border-pop-yellow focus:outline-none transition-all placeholder:text-gray-300"
        />
        <button 
          type="submit" 
          disabled={isLoading}
          className="absolute right-3 top-3 bottom-3 aspect-square bg-pop-dark text-white rounded-xl flex items-center justify-center hover:bg-black transition-colors disabled:opacity-50"
        >
          {isLoading ? <Sparkles className="animate-spin" /> : <Search />}
        </button>
      </form>

      {/* Result Card */}
      {currentResult && !isLoading && (
        <div className="bg-white rounded-3xl overflow-hidden shadow-2xl border border-gray-100 mb-8 animate-in zoom-in-95 duration-300">
          {/* Image & Header */}
          <div className="relative h-64 bg-gray-50 flex items-center justify-center">
            {currentResult.imageBase64 ? (
              <>
                <div 
                  className="absolute inset-0 opacity-20 blur-xl"
                  style={{ backgroundImage: `url(data:image/png;base64,${currentResult.imageBase64})`, backgroundSize: 'cover' }}
                />
                <img 
                  src={`data:image/png;base64,${currentResult.imageBase64}`} 
                  alt="AI Visualization" 
                  className="relative h-56 w-56 object-contain drop-shadow-2xl z-10 transition-transform hover:scale-105 duration-300"
                />
              </>
            ) : (
              <div className="text-gray-300 font-bold text-xl">No Image</div>
            )}
            <button 
              onClick={addToNotebook}
              className="absolute top-4 right-4 bg-white/50 backdrop-blur p-3 rounded-full hover:bg-white text-pop-pink transition-all shadow-sm z-20"
            >
              <Save size={24} fill={notebook.find(n => n.id === currentResult.id) ? "currentColor" : "none"} />
            </button>
          </div>

          <div className="p-6">
            {/* Word & Audio */}
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-4xl font-black text-pop-dark tracking-tight">{currentResult.term}</h2>
              <AudioButton text={currentResult.term} className="bg-pop-yellow text-pop-dark hover:bg-yellow-400" />
            </div>
            
            {/* Definition */}
            <div className="mb-6">
              <p className="text-xl font-medium text-gray-700 leading-relaxed">
                {currentResult.definition}
              </p>
            </div>

            {/* Usage Note */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100 mb-6">
               <div className="flex items-center gap-2 mb-2">
                 <span className="bg-blue-100 text-blue-600 text-xs font-bold px-2 py-1 rounded-md uppercase">Vibe Check</span>
               </div>
               <p className="text-gray-700 text-sm leading-relaxed font-medium">
                 {currentResult.usageNote}
               </p>
            </div>

            {/* Examples */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Examples</h3>
              {currentResult.examples.map((ex, i) => (
                <div key={i} className="flex gap-4 items-start group">
                   <div className="pt-1">
                     <AudioButton text={ex.text} size="sm" className="bg-gray-100 text-gray-500 group-hover:bg-pop-cyan group-hover:text-white" />
                   </div>
                   <div>
                     <p className="text-lg font-semibold text-pop-dark">{ex.text}</p>
                     <p className="text-gray-500 italic">{ex.translation}</p>
                   </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderNotebook = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-pop-dark">My Notebook</h2>
        <span className="bg-pop-pink text-white text-xs font-bold px-3 py-1 rounded-full">{notebook.length} items</span>
      </div>

      {notebook.length === 0 ? (
        <div className="text-center py-20 opacity-50">
          <Book size={64} className="mx-auto mb-4 text-gray-300" />
          <p className="font-medium text-gray-400">Your notebook is empty.</p>
          <button onClick={() => setMode(AppMode.SEARCH)} className="text-pop-cyan font-bold mt-2">Go Search!</button>
        </div>
      ) : (
        <>
           <div className="grid grid-cols-1 gap-4">
            {notebook.map((item) => (
              <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-md transition-all">
                <div className="flex items-center gap-4">
                   {item.imageBase64 && (
                     <img src={`data:image/png;base64,${item.imageBase64}`} className="w-12 h-12 rounded-lg object-cover bg-gray-100" />
                   )}
                   <div>
                     <p className="font-bold text-lg text-pop-dark">{item.term}</p>
                     <p className="text-xs text-gray-400 truncate max-w-[150px]">{item.definition}</p>
                   </div>
                </div>
                <div className="flex gap-2">
                  <AudioButton text={item.term} size="sm" className="bg-gray-50 text-gray-400 hover:bg-pop-cyan hover:text-white" />
                  <button onClick={() => removeFromNotebook(item.id)} className="p-2 text-gray-300 hover:text-red-500 transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-pop-dark text-white rounded-3xl p-6 mt-8 shadow-xl">
             <div className="flex items-center justify-between mb-4">
               <h3 className="font-bold text-xl flex items-center gap-2">
                 <Sparkles className="text-pop-yellow" />
                 Story Time
               </h3>
               <button 
                onClick={generateStory}
                disabled={isGeneratingStory}
                className="bg-pop-yellow text-pop-dark px-4 py-2 rounded-xl font-bold text-sm hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
               >
                 {isGeneratingStory ? 'Dreaming...' : 'Make a Story'}
               </button>
             </div>
             
             {story && (
               <div className="bg-white/10 rounded-xl p-4 animate-in fade-in duration-500">
                 <h4 className="font-bold text-pop-pink mb-2 text-lg">{story.title}</h4>
                 <p className="leading-relaxed opacity-90 text-sm whitespace-pre-wrap">{story.story}</p>
               </div>
             )}
             {!story && !isGeneratingStory && (
               <p className="text-white/50 text-sm italic">Generate a story using your saved words to help memorize them!</p>
             )}
          </div>
        </>
      )}
    </div>
  );

  const renderStudy = () => (
    <div className="flex flex-col h-[calc(100vh-140px)] animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-black text-pop-dark">Flashcards</h2>
        <span className="text-sm font-bold text-gray-400">{studyIndex + 1} / {notebook.length || 0}</span>
      </div>

      {notebook.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50">
           <Brain size={64} className="mx-auto mb-4 text-gray-300" />
           <p className="font-medium text-gray-400">No cards to study.</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center">
           <div className="w-full max-w-sm">
              <Flashcard entry={notebook[studyIndex]} />
           </div>
           
           <div className="flex gap-4 mt-8 w-full max-w-sm justify-between">
             <button 
               onClick={() => setStudyIndex((prev) => Math.max(0, prev - 1))}
               disabled={studyIndex === 0}
               className="flex-1 py-4 rounded-xl bg-white text-pop-dark font-bold shadow-sm border border-gray-200 disabled:opacity-30 active:scale-95 transition-all"
             >
               Prev
             </button>
             <button 
               onClick={() => setStudyIndex((prev) => Math.min(notebook.length - 1, prev + 1))}
               disabled={studyIndex === notebook.length - 1}
               className="flex-1 py-4 rounded-xl bg-pop-dark text-white font-bold shadow-lg shadow-pop-dark/30 disabled:opacity-30 active:scale-95 transition-all"
             >
               Next
             </button>
           </div>
        </div>
      )}
    </div>
  );

  // 1. API Key Selection (Priority)
  if (needsApiKey) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white animate-in fade-in duration-700">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="w-20 h-20 bg-pop-cyan rounded-3xl mx-auto flex items-center justify-center shadow-lg mb-6">
            <Key size={40} className="text-white" />
          </div>
          <div className="space-y-2">
             <h1 className="text-3xl font-black text-pop-dark">Connect AI</h1>
             <p className="text-gray-400 font-medium">We need to connect your Google API Key to power the dictionary.</p>
          </div>
          <button 
            onClick={handleConnectApiKey}
            className="w-full bg-pop-dark text-white p-4 rounded-2xl font-bold text-lg hover:scale-105 active:scale-95 transition-all shadow-xl hover:shadow-2xl"
          >
            Connect API Key
          </button>
          <div className="text-xs text-gray-300 px-8">
            This will open a dialog to select your key from Google AI Studio.
          </div>
        </div>
      </div>
    );
  }

  // 2. Onboarding
  if (isOnboarding) {
    return (
      <Onboarding 
        nativeLang={nativeLang}
        targetLang={targetLang}
        setNativeLang={setNativeLang}
        setTargetLang={setTargetLang}
        onComplete={completeOnboarding}
      />
    );
  }

  // 3. Main App
  return (
    <div className="min-h-screen bg-[#F7F9FC] text-pop-dark font-sans selection:bg-pop-yellow selection:text-pop-dark">
      {renderHeader()}
      
      <main className="max-w-md mx-auto px-4 py-6 pb-24">
        {mode === AppMode.SEARCH && renderSearch()}
        {mode === AppMode.NOTEBOOK && renderNotebook()}
        {mode === AppMode.STUDY && renderStudy()}
      </main>
    </div>
  );
};

export default App;