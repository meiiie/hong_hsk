import type { LocaleCode, StudyMode, VocabItem } from "../../domain/types";

export type AiTutorAction = "explain" | "examples" | "why_wrong" | "memory_tip" | "ask";

export type AiTutorStatus = "idle" | "loading" | "streaming" | "ready" | "error";

export type AiTutorMessageRole = "user" | "assistant";

export interface AiTutorFeedbackContext {
  input: string;
  correct: boolean;
  revealed?: boolean;
}

export interface AiTutorRequest {
  action: AiTutorAction;
  question?: string;
  sessionId?: string;
  memoryMarkdown?: string;
  messages?: AiTutorConversationMessage[];
  stream?: boolean;
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

export interface AiTutorConversationMessage {
  role: AiTutorMessageRole;
  content: string;
}

export interface AiTutorMessage extends AiTutorConversationMessage {
  id: string;
  createdAt: string;
  action?: AiTutorAction;
  model?: string;
  status?: "streaming" | "done" | "error";
}

export interface AiTutorResponse {
  content: string;
  model: string;
  action: AiTutorAction;
  generatedAt: string;
  sessionId?: string;
}

export interface AiTutorPanelState {
  itemId?: string;
  sessionId?: string;
  status: AiTutorStatus;
  action?: AiTutorAction;
  question?: string;
  messages?: AiTutorMessage[];
  activeMessageId?: string;
  statusNote?: string;
  memoryMarkdown?: string;
  response?: AiTutorResponse;
  error?: string;
}

export interface AiTutorStreamHandlers {
  onStatus?(message: string): void;
  onDelta?(delta: string): void;
  onMetadata?(metadata: Pick<AiTutorResponse, "model" | "generatedAt" | "sessionId">): void;
  onError?(error: string): void;
}

export interface AiTutorClient {
  ask(request: AiTutorRequest): Promise<AiTutorResponse>;
  stream?(request: AiTutorRequest, handlers: AiTutorStreamHandlers, signal?: AbortSignal): Promise<AiTutorResponse>;
}
