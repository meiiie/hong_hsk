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
  card: NekoTutorCard;
  learnerAnswer: string;
  correct: boolean;
  revealed: boolean;
  question: string;
  conversationId?: string;
}

export interface NekoTutorResponse {
  answer: string;
  conversationId: string;
}

export interface NekoTutor {
  ask(request: NekoTutorRequest): Promise<NekoTutorResponse>;
}
