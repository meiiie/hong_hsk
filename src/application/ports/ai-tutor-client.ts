import type { LocaleCode, StudyMode, VocabItem } from "../../domain/types";

export type AiTutorAction = "explain" | "examples" | "why_wrong" | "memory_tip" | "ask";

export type AiTutorStatus = "idle" | "loading" | "ready" | "error";

export interface AiTutorFeedbackContext {
  input: string;
  correct: boolean;
  revealed?: boolean;
}

export interface AiTutorRequest {
  action: AiTutorAction;
  question?: string;
  item: Pick<
    VocabItem,
    | "id"
    | "book"
    | "lesson"
    | "lessonTitle"
    | "hanzi"
    | "pinyin"
    | "meaningVi"
    | "meaningEn"
    | "partOfSpeech"
    | "exampleHan"
    | "examplePinyin"
    | "exampleVi"
    | "note"
    | "source"
  >;
  learner: {
    displayName: string;
    locale: LocaleCode;
    studyMode: StudyMode;
  };
  feedback?: AiTutorFeedbackContext;
}

export interface AiTutorResponse {
  content: string;
  model: string;
  action: AiTutorAction;
  generatedAt: string;
}

export interface AiTutorPanelState {
  itemId?: string;
  status: AiTutorStatus;
  action?: AiTutorAction;
  question?: string;
  response?: AiTutorResponse;
  error?: string;
}

export interface AiTutorClient {
  ask(request: AiTutorRequest): Promise<AiTutorResponse>;
}
