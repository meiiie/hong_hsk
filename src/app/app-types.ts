export type View = "dashboard" | "study" | "lessons" | "wrong" | "mock" | "plan" | "data" | "settings";

export interface DataHealth {
  total: number;
  courseItems: number;
  missingVi: number;
  missingExamples: number;
  draftVi: number;
  courseReady: boolean;
  examReady: boolean;
  qualityReady: boolean;
}

export interface StudyFeedback {
  itemId: string;
  input: string;
  correct: boolean;
  revealed?: boolean;
}

export interface NekoTutorViewState {
  itemId: string;
  status: "loading" | "ready" | "error" | "cancelled";
  question: string;
  requestId?: string;
  conversationId?: string;
  answer?: string;
  error?: string;
}

export interface NekoTutorMessage {
  id: string;
  role: "learner" | "tutor";
  text: string;
  itemId: string;
  hanzi: string;
  at: string;
}

export interface NekoTutorSessionState {
  schemaVersion: 1;
  conversationId?: string;
  startedAt: string;
  updatedAt: string;
  turnCount: number;
  messages: NekoTutorMessage[];
}
