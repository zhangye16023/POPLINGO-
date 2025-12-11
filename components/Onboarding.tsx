import React from 'react';
import { ArrowRight, Globe } from 'lucide-react';
import { LANGUAGES } from '../constants';

interface OnboardingProps {
  nativeLang: string;
  targetLang: string;
  setNativeLang: (code: string) => void;
  setTargetLang: (code: string) => void;
  onComplete: () => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({
  nativeLang,
  targetLang,
  setNativeLang,
  setTargetLang,
  onComplete
}) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white animate-in fade-in duration-700">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="space-y-2">
           <div className="w-20 h-20 bg-pop-yellow rounded-3xl mx-auto flex items-center justify-center shadow-lg rotate-3 mb-6">
             <Globe size={40} className="text-pop-dark" />
           </div>
           <h1 className="text-4xl font-black text-pop-dark tracking-tight">Welcome to <br/><span className="text-pop-pink">PopLingo</span></h1>
           <p className="text-gray-400 font-medium text-lg">Let's get your languages set up.</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2 text-left">
            <label className="text-sm font-bold text-gray-400 uppercase tracking-wider ml-1">I speak</label>
            <div className="relative">
              <select 
                value={nativeLang}
                onChange={(e) => setNativeLang(e.target.value)}
                className="w-full p-4 bg-pop-light border-2 border-transparent focus:border-pop-cyan rounded-2xl text-xl font-bold text-pop-dark appearance-none outline-none transition-all"
              >
                {LANGUAGES.map(l => (
                  <option key={l.code} value={l.code}>{l.flag} {l.name}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▼</div>
            </div>
          </div>

          <div className="space-y-2 text-left">
            <label className="text-sm font-bold text-gray-400 uppercase tracking-wider ml-1">I want to learn</label>
             <div className="relative">
              <select 
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                className="w-full p-4 bg-pop-light border-2 border-transparent focus:border-pop-pink rounded-2xl text-xl font-bold text-pop-dark appearance-none outline-none transition-all"
              >
                {LANGUAGES.map(l => (
                  <option key={l.code} value={l.code}>{l.flag} {l.name}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▼</div>
            </div>
          </div>
        </div>

        <button 
          onClick={onComplete}
          className="w-full bg-pop-dark text-white p-5 rounded-2xl font-bold text-xl hover:scale-105 active:scale-95 transition-all shadow-xl hover:shadow-2xl flex items-center justify-center gap-2 group"
        >
          Let's Go!
          <ArrowRight className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};
