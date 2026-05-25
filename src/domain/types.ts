export type StudyMode = "today" | "lesson" | "wrong" | "all";

export type ReviewQuality = "again" | "hard" | "good" | "easy";

export type ReviewStatus = "new" | "learning" | "review" | "mastered";

export type BookCode = "4A" | "4B" | "Custom";

export type LocaleCode = "vi" | "en";

export interface VocabItem {
  id: string;
  book: BookCode;
  lesson: number;
  lessonTitle: string;
  order: number;
  hanzi: string;
  pinyin: string;
  meaningVi: string;
  meaningEn: string;
  partOfSpeech: string;
  exampleHan: string;
  examplePinyin: string;
  exampleVi: string;
  source: string;
  note: string;
  type: string;
}

export interface Attempt {
  id: string;
  itemId: string;
  lesson: number;
  mode: StudyMode;
  at: string;
  expected: string;
  input: string;
  correct: boolean;
  quality: ReviewQuality;
  latencyMs: number;
}

export interface ReviewState {
  itemId: string;
  status: ReviewStatus;
  firstSeen: string;
  lastReviewed: string;
  nextReviewDate: string;
  intervalDays: number;
  ease: number;
  totalAttempts: number;
  correctAttempts: number;
  wrongCount: number;
  correctStreak: number;
  lastInput: string;
  lastCorrect: boolean;
}

export interface StudySettings {
  startDate: string;
  dailyNewTarget: number;
  dailyReviewTarget: number;
  selectedLesson: number;
  locale: LocaleCode;
  revealPinyin: boolean;
  revealMeaning: boolean;
  useEnglishFallback: boolean;
}

export interface AppState {
  version: number;
  items: VocabItem[];
  attempts: Attempt[];
  reviews: Record<string, ReviewState>;
  settings: StudySettings;
  updatedAt: string;
}

export interface DashboardStats {
  totalItems: number;
  learned: number;
  mastered: number;
  dueToday: number;
  wrongOpen: number;
  accuracy: number;
  streak: number;
  planDay: number;
}
