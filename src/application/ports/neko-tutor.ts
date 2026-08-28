import type { StudyDirection } from "../../domain/types";

export interface NekoTutorCard {
  id: string;
  book: string;
  lesson: number;
  hanzi: string;
  pinyin: string;
  meaningVi: string;
  meaningEn: string;
  partOfSpeech: string;
  exampleHan: string;
  examplePinyin: string;
  exampleVi: string;
}

export interface NekoTutorRequest {
  requestId: string;
  card: NekoTutorCard;
  learnerAnswer: string;
  direction: StudyDirection;
  correct: boolean;
  revealed: boolean;
  question: string;
  conversationId?: string;
}

export interface NekoTutorResponse {
  answer: string;
  conversationId: string;
}

export interface NekoTutorCancelResponse {
  conversationId?: string;
}

export interface NekoTutor {
  ask(request: NekoTutorRequest): Promise<NekoTutorResponse>;
  cancel(requestId: string): Promise<NekoTutorCancelResponse>;
  closeSession(conversationId: string): Promise<void>;
}
