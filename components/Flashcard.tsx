import React, { useState } from 'react';
import { DictionaryEntry } from '../types';
import { AudioButton } from './AudioButton';

interface FlashcardProps {
  entry: DictionaryEntry;
}

export const Flashcard: React.FC<FlashcardProps> = ({ entry }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => setIsFlipped(!isFlipped);

  return (
    <div 
      className="w-full h-96 cursor-pointer perspective-1000"
      onClick={handleFlip}
    >
      <div 
        className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${
          isFlipped ? 'rotate-y-180' : ''
        }`}
      >
        {/* Front Side - Target Lang & Image */}
        <div className="absolute w-full h-full backface-hidden bg-white border-4 border-pop-yellow rounded-2xl shadow-xl flex flex-col items-center justify-center p-6 overflow-hidden">
           <div className="absolute top-4 right-4 z-10">
              <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-full">Front</span>
           </div>
           
           <h2 className="text-4xl font-extrabold text-pop-dark mb-6 text-center">{entry.term}</h2>
           
           {entry.imageBase64 && (
             <div className="w-48 h-48 rounded-xl overflow-hidden shadow-inner border-2 border-gray-100 bg-gray-50 flex items-center justify-center">
                <img 
                  src={`data:image/png;base64,${entry.imageBase64}`} 
                  alt={entry.term} 
                  className="w-full h-full object-cover"
                />
             </div>
           )}
           <p className="mt-4 text-gray-400 text-sm font-semibold animate-bounce-slow">Tap to flip</p>
        </div>

        {/* Back Side - Native Lang Definition & Context */}
        <div className="absolute w-full h-full backface-hidden rotate-y-180 bg-white border-4 border-pop-pink rounded-2xl shadow-xl flex flex-col p-6 overflow-y-auto">
          <div className="absolute top-4 right-4 z-10" onClick={(e) => e.stopPropagation()}>
             <AudioButton text={entry.term} size="sm" className="bg-pop-pink hover:bg-red-500"/>
          </div>
          
          <h3 className="text-2xl font-bold text-pop-dark mb-2 border-b-2 border-pop-pink pb-2">
            {entry.term}
          </h3>
          
          <div className="flex-1 overflow-y-auto">
            <p className="text-lg text-gray-700 font-medium mb-4 italic">
              "{entry.definition}"
            </p>
            
            <div className="space-y-3">
              {entry.examples.slice(0,1).map((ex, i) => (
                <div key={i} className="bg-pop-light p-3 rounded-lg border border-gray-200">
                  <p className="text-pop-dark font-medium text-sm">{ex.text}</p>
                  <p className="text-gray-500 text-xs mt-1">{ex.translation}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 bg-yellow-50 p-3 rounded-lg border border-yellow-100">
              <span className="text-xs font-bold text-yellow-600 uppercase tracking-wider">Note</span>
              <p className="text-sm text-gray-700 mt-1">{entry.usageNote}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
