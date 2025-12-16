
export enum TopicCategory {
  WHOLE_NUMBERS = 'מספרים שלמים',
  FRACTIONS = 'שברים פשוטים',
  GEOMETRY = 'גיאומטריה'
}

export interface Topic {
  id: string;
  title: string;
  category: TopicCategory;
  description: string;
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  svg?: string; // Optional SVG code for geometry questions
}

export interface UserState {
  points: number;
  level: number;
  completedQuestions: string[];
  avatarUrl?: string;
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  QUIZ = 'QUIZ',
  LIVE_TUTOR = 'LIVE_TUTOR',
  REWARDS = 'REWARDS',
  AVATAR = 'AVATAR'
}
