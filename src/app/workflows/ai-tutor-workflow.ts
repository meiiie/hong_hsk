import type {
  AiTutorAction,
  AiTutorMessage,
  AiTutorPanelState,
  AiTutorRequest,
  AiTutorResponse,
} from "../../application/ports/ai-tutor-client";
import type { AppState, StudyMode, VocabItem } from "../../domain/types";
import type { StudyFeedback } from "../app-types";

const AI_TUTOR_SESSION_KEY = "hong-hsk4-ai-tutor-session-v1";
const MAX_STORED_MESSAGES = 36;
const MAX_CONTEXT_MESSAGES = 10;
const MAX_MESSAGE_CHARS = 1_600;

interface StoredAiTutorSession {
  sessionId: string;
  messages: AiTutorMessage[];
}

export class AiTutorWorkflow {
  private state: AiTutorPanelState = {
    sessionId: createSessionId(),
    messages: [],
    status: "idle",
  };

  constructor() {
    const stored = loadStoredSession();
    if (stored) {
      this.state = {
        sessionId: stored.sessionId,
        messages: stored.messages,
        status: "idle",
      };
    }
  }

  stateForItem(itemId: string | undefined): AiTutorPanelState {
    if (!itemId) {
      return {
        ...this.state,
        itemId: undefined,
        status: "idle",
      };
    }
    return {
      ...this.state,
      itemId,
    };
  }

  startTurn(itemId: string, action: AiTutorAction, userContent: string, question?: string): string {
    const now = new Date().toISOString();
    const userMessage: AiTutorMessage = {
      id: createMessageId("user"),
      role: "user",
      content: clampMessage(userContent),
      action,
      createdAt: now,
      status: "done",
    };
    const assistantMessage: AiTutorMessage = {
      id: createMessageId("assistant"),
      role: "assistant",
      content: "",
      action,
      createdAt: now,
      status: "streaming",
    };

    this.state = {
      ...this.state,
      itemId,
      action,
      question,
      activeMessageId: assistantMessage.id,
      error: undefined,
      response: undefined,
      status: "streaming",
      statusNote: "Đang kết nối gia sư...",
      messages: pruneMessages([...(this.state.messages ?? []), userMessage, assistantMessage]),
    };
    this.persist();
    return assistantMessage.id;
  }

  appendDelta(messageId: string, delta: string): void {
    if (!delta) {
      return;
    }
    this.state = {
      ...this.state,
      status: "streaming",
      messages: (this.state.messages ?? []).map((message) =>
        message.id === messageId
          ? { ...message, content: clampMessage(message.content + delta), status: "streaming" }
          : message,
      ),
    };
  }

  setStatusNote(note: string): void {
    this.state = {
      ...this.state,
      statusNote: note,
    };
  }

  complete(response: AiTutorResponse): void {
    const activeMessageId = this.state.activeMessageId;
    this.state = {
      ...this.state,
      itemId: this.state.itemId,
      action: response.action,
      question: this.state.question,
      response,
      status: "ready",
      statusNote: "Đã trả lời",
      activeMessageId: undefined,
      messages: (this.state.messages ?? []).map((message) =>
        message.id === activeMessageId
          ? {
              ...message,
              content: clampMessage(response.content || message.content),
              model: response.model,
              status: "done",
            }
          : message,
      ),
    };
    this.persist();
  }

  fail(error: string): void {
    const activeMessageId = this.state.activeMessageId;
    this.state = {
      ...this.state,
      itemId: this.state.itemId,
      action: this.state.action,
      question: this.state.question,
      error,
      status: "error",
      statusNote: "Chưa gọi được gia sư",
      activeMessageId: undefined,
      messages: (this.state.messages ?? []).map((message) =>
        message.id === activeMessageId
          ? { ...message, content: error, status: "error" }
          : message,
      ),
    };
    this.persist();
  }

  reset(): void {
    this.state = {
      ...this.state,
      itemId: undefined,
      action: undefined,
      question: undefined,
      activeMessageId: undefined,
      response: undefined,
      error: undefined,
      status: "idle",
      statusNote: undefined,
    };
  }

  clearSession(): void {
    this.state = {
      sessionId: createSessionId(),
      messages: [],
      status: "idle",
    };
    this.persist();
  }

  requestMessages(): AiTutorRequest["messages"] {
    return (this.state.messages ?? [])
      .filter((message) => message.content.trim())
      .slice(-MAX_CONTEXT_MESSAGES)
      .map((message) => ({
        role: message.role,
        content: clampMessage(message.content),
      }));
  }

  sessionId(): string {
    if (this.state.sessionId) {
      return this.state.sessionId;
    }
    const sessionId = createSessionId();
    this.state = {
      ...this.state,
      sessionId,
    };
    return sessionId;
  }

  private persist(): void {
    saveStoredSession({
      sessionId: this.sessionId(),
      messages: pruneMessages(this.state.messages ?? []),
    });
  }
}

export function buildAiTutorRequest(
  state: AppState,
  item: VocabItem,
  studyMode: StudyMode,
  action: AiTutorAction,
  feedback: StudyFeedback | undefined,
  question?: string,
  sessionId?: string,
  messages?: AiTutorRequest["messages"],
  memoryMarkdown?: string,
  stream?: boolean,
): AiTutorRequest {
  return {
    action,
    question,
    sessionId,
    messages,
    memoryMarkdown,
    stream,
    item: {
      id: item.id,
      book: item.book,
      lesson: item.lesson,
      lessonTitle: item.lessonTitle,
      hanzi: item.hanzi,
      pinyin: item.pinyin,
      meaningVi: item.meaningVi,
      meaningEn: item.meaningEn,
      partOfSpeech: item.partOfSpeech,
      exampleHan: item.exampleHan,
      examplePinyin: item.examplePinyin,
      exampleVi: item.exampleVi,
      note: item.note,
      source: item.source,
    },
    learner: {
      displayName: state.settings.displayName,
      locale: state.settings.locale,
      studyMode,
    },
    feedback: feedback
      ? {
          input: feedback.input,
          correct: feedback.correct,
          revealed: feedback.revealed,
        }
      : undefined,
  };
}

export function buildAiTutorMemoryMarkdown(state: AppState, item: VocabItem, studyMode: StudyMode): string {
  const recentWrong = Object.values(state.reviews)
    .filter((review) => review.wrongCount > 0)
    .sort((left, right) => {
      if (right.lastReviewed !== left.lastReviewed) {
        return right.lastReviewed.localeCompare(left.lastReviewed);
      }
      return right.wrongCount - left.wrongCount;
    })
    .slice(0, 6)
    .map((review) => {
      const wrongItem = state.items.find((candidate) => candidate.id === review.itemId);
      return wrongItem
        ? `- ${wrongItem.hanzi} (${wrongItem.pinyin || "chưa có pinyin"}): sai ${review.wrongCount} lần, lần nhập gần nhất "${review.lastInput || "trống"}".`
        : "";
    })
    .filter(Boolean);

  return [
    "# Bộ nhớ học tập của Hồng",
    `- Người học: ${state.settings.displayName || "Hồng"}.`,
    `- Mục tiêu: ôn HSK4 giáo trình chuẩn 4A/4B, ưu tiên tiếng Việt, phản hồi ngắn và dùng được ngay.`,
    `- Chế độ hiện tại: ${studyMode}. Bài đang học: ${item.book} bài ${item.lesson} ${item.lessonTitle ? `- ${item.lessonTitle}` : ""}.`,
    `- Từ đang hỏi: ${item.hanzi} (${item.pinyin || "chưa có pinyin"}) - ${item.meaningVi || item.meaningEn || "chưa có nghĩa"}.`,
    `- Quy tắc: không tiết lộ đáp án trước khi người học chấm/hiện đáp án; không xem AI là dữ liệu từ vựng đã kiểm chứng.`,
    recentWrong.length ? "## Từ từng sai gần đây" : "",
    ...recentWrong,
  ]
    .filter(Boolean)
    .join("\n");
}

export function aiTutorUserPrompt(action: AiTutorAction, item: VocabItem, question?: string): string {
  if (action === "ask") {
    return question?.trim() || `Hỏi thêm về ${item.hanzi}`;
  }
  const prompts: Record<Exclude<AiTutorAction, "ask">, string> = {
    explain: `Giải thích cách dùng từ ${item.hanzi}`,
    examples: `Cho ví dụ đặt câu với ${item.hanzi}`,
    memory_tip: `Cho mẹo nhớ từ ${item.hanzi}`,
    why_wrong: `Sửa lỗi khi gõ từ ${item.hanzi}`,
  };
  return prompts[action];
}

function loadStoredSession(): StoredAiTutorSession | undefined {
  try {
    const raw = globalThis.localStorage?.getItem(AI_TUTOR_SESSION_KEY);
    if (!raw) {
      return undefined;
    }
    const parsed = JSON.parse(raw) as Partial<StoredAiTutorSession>;
    if (!parsed.sessionId || !Array.isArray(parsed.messages)) {
      return undefined;
    }
    return {
      sessionId: parsed.sessionId,
      messages: pruneMessages(parsed.messages.filter(isStoredMessage)),
    };
  } catch {
    return undefined;
  }
}

function saveStoredSession(session: StoredAiTutorSession): void {
  try {
    globalThis.localStorage?.setItem(AI_TUTOR_SESSION_KEY, JSON.stringify(session));
  } catch {
    // Local storage is best-effort; the active in-memory chat still works.
  }
}

function isStoredMessage(message: unknown): message is AiTutorMessage {
  if (!message || typeof message !== "object") {
    return false;
  }
  const candidate = message as Partial<AiTutorMessage>;
  return (
    typeof candidate.id === "string" &&
    (candidate.role === "user" || candidate.role === "assistant") &&
    typeof candidate.content === "string" &&
    typeof candidate.createdAt === "string"
  );
}

function pruneMessages(messages: AiTutorMessage[]): AiTutorMessage[] {
  return messages
    .slice(-MAX_STORED_MESSAGES)
    .map((message) => ({
      ...message,
      content: clampMessage(message.content),
    }));
}

function clampMessage(content: string): string {
  return content.slice(0, MAX_MESSAGE_CHARS);
}

function createSessionId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `hsk-ai-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function createMessageId(role: "user" | "assistant"): string {
  return `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
