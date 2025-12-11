import React, { useState } from 'react';
import { Volume2, Loader2 } from 'lucide-react';
import { speakText } from '../services/geminiService';

interface AudioButtonProps {
  text: string;
  size?: 'sm' | 'md';
  className?: string;
}

export const AudioButton: React.FC<AudioButtonProps> = ({ text, size = 'md', className = '' }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPlaying) return;
    
    setIsPlaying(true);
    try {
      await speakText(text);
    } catch (err) {
      console.error(err);
    } finally {
      setIsPlaying(false);
    }
  };

  const iconSize = size === 'sm' ? 16 : 24;

  return (
    <button
      onClick={handlePlay}
      disabled={isPlaying}
      className={`rounded-full p-2 transition-all active:scale-95 ${
        isPlaying 
          ? 'bg-gray-200 text-gray-500' 
          : 'bg-pop-cyan text-white hover:bg-blue-600 shadow-md hover:shadow-lg'
      } ${className}`}
      aria-label="Play pronunciation"
    >
      {isPlaying ? (
        <Loader2 size={iconSize} className="animate-spin" />
      ) : (
        <Volume2 size={iconSize} />
      )}
    </button>
  );
};
