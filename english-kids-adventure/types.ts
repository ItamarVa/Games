export interface VocabWord {
  word: string;
  translation: string;
  transliteration?: string; // e.g. "Kelev" for "כלב"
}

export interface QuizQuestion {
  question: string;
  questionTranslation?: string; // Hebrew translation of the question
  options: string[];
  correctIndex: number;
  explanation: string; // Hebrew explanation
}

export interface StoryData {
  title: string;
  content: string;
  vocabulary: VocabWord[];
  vocabQuiz: QuizQuestion[];
  comprehensionQuiz: QuizQuestion[];
  funFact: string; // Retrieved via Search Grounding
  funFactSource?: string;
}

export enum AppView {
  HOME = 'HOME',
  STORY = 'STORY',
  VEO_STUDIO = 'VEO_STUDIO',
  LIVE_TUTOR = 'LIVE_TUTOR',
}

export interface VeoResponse {
  videoUri?: string;
}

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
}