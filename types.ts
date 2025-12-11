export interface Language {
  code: string;
  name: string;
  flag: string;
}

export interface DictionaryEntry {
  id: string;
  term: string;
  definition: string;
  examples: {
    text: string;
    translation: string;
  }[];
  usageNote: string;
  imageBase64: string | null;
  targetLang: string;
  nativeLang: string;
  timestamp: number;
}

export interface FlashcardProps {
  entry: DictionaryEntry;
  onFlip?: () => void;
}

export enum AppMode {
  SEARCH = 'SEARCH',
  NOTEBOOK = 'NOTEBOOK',
  STUDY = 'STUDY'
}

export interface StoryResult {
  story: string;
  title: string;
}

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    aistudio?: AIStudio;
  }
}