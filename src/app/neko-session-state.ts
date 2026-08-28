import type { NekoTutorMessage, NekoTutorSessionState } from "./app-types";

export const NEKO_TUTOR_SESSION_KEY = "hong-hsk4-neko-tutor-session-v1";
export const NEKO_TUTOR_ENABLED_KEY = "hong-hsk4-neko-tutor-enabled-v1";
export const NEKO_VISIBLE_MESSAGE_LIMIT = 80;

const SESSION_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;

interface NekoExchange {
  requestId: string;
  conversationId: string;
  itemId: string;
  hanzi: string;
  question: string;
  answer: string;
  at?: string;
}

export function loadNekoTutorSession(storage: Storage): NekoTutorSessionState | undefined {
  try {
    const raw = storage.getItem(NEKO_TUTOR_SESSION_KEY);
    return raw ? parseNekoTutorSession(JSON.parse(raw)) : undefined;
  } catch {
    return undefined;
  }
}

export function saveNekoTutorSession(storage: Storage, session: NekoTutorSessionState): void {
  try {
    storage.setItem(NEKO_TUTOR_SESSION_KEY, JSON.stringify(session));
  } catch {
    // The live conversation still works when browser storage is unavailable.
  }
}

export function clearNekoTutorSession(storage: Storage): void {
  try {
    storage.removeItem(NEKO_TUTOR_SESSION_KEY);
  } catch {
    // The in-memory session is still cleared by the caller.
  }
}

export function loadNekoTutorEnabled(storage: Storage): boolean {
  try {
    return storage.getItem(NEKO_TUTOR_ENABLED_KEY) !== "0";
  } catch {
    return true;
  }
}

export function saveNekoTutorEnabled(storage: Storage, enabled: boolean): void {
  try {
    storage.setItem(NEKO_TUTOR_ENABLED_KEY, enabled ? "1" : "0");
  } catch {
    // The setting remains effective for this page lifetime.
  }
}

export function appendNekoExchange(
  current: NekoTutorSessionState | undefined,
  exchange: NekoExchange,
): NekoTutorSessionState {
  const at = exchange.at ?? new Date().toISOString();
  const messages: NekoTutorMessage[] = [
    ...(current?.messages ?? []),
    {
      id: `${exchange.requestId}:learner`,
      role: "learner" as const,
      text: exchange.question.trim().slice(0, 600),
      itemId: exchange.itemId,
      hanzi: exchange.hanzi,
      at,
    },
    {
      id: `${exchange.requestId}:tutor`,
      role: "tutor" as const,
      text: exchange.answer.trim().slice(0, 8_000),
      itemId: exchange.itemId,
      hanzi: exchange.hanzi,
      at,
    },
  ].slice(-NEKO_VISIBLE_MESSAGE_LIMIT);

  return {
    schemaVersion: 1,
    conversationId: exchange.conversationId,
    startedAt: current?.startedAt ?? at,
    updatedAt: at,
    turnCount: (current?.turnCount ?? 0) + 1,
    messages,
  };
}

export function rememberNekoConversation(
  current: NekoTutorSessionState | undefined,
  conversationId: string,
  at = new Date().toISOString(),
): NekoTutorSessionState {
  return {
    schemaVersion: 1,
    conversationId,
    startedAt: current?.startedAt ?? at,
    updatedAt: at,
    turnCount: current?.turnCount ?? 0,
    messages: current?.messages ?? [],
  };
}

export function parseNekoTutorSession(value: unknown): NekoTutorSessionState | undefined {
  if (!isRecord(value) || value.schemaVersion !== 1) {
    return undefined;
  }
  const conversationId = optionalSessionId(value.conversationId);
  const startedAt = validIsoDate(value.startedAt);
  const updatedAt = validIsoDate(value.updatedAt);
  const turnCount = value.turnCount;
  if (!startedAt || !updatedAt || !Number.isSafeInteger(turnCount) || Number(turnCount) < 0) {
    return undefined;
  }
  if (value.conversationId !== undefined && !conversationId) {
    return undefined;
  }
  if (!Array.isArray(value.messages) || value.messages.length > NEKO_VISIBLE_MESSAGE_LIMIT) {
    return undefined;
  }
  const messages = value.messages.map(parseMessage);
  if (messages.some((message) => !message)) {
    return undefined;
  }
  const parsedMessages = messages as NekoTutorMessage[];
  if (
    parsedMessages.length % 2 !== 0
    || parsedMessages.some((message, index) => message.role !== (index % 2 === 0 ? "learner" : "tutor"))
    || Number(turnCount) < parsedMessages.length / 2
  ) {
    return undefined;
  }
  return {
    schemaVersion: 1,
    conversationId,
    startedAt,
    updatedAt,
    turnCount: Number(turnCount),
    messages: parsedMessages,
  };
}

function parseMessage(value: unknown): NekoTutorMessage | undefined {
  if (!isRecord(value) || (value.role !== "learner" && value.role !== "tutor")) {
    return undefined;
  }
  const id = boundedText(value.id, 180);
  const text = boundedText(value.text, value.role === "tutor" ? 8_000 : 600);
  const itemId = boundedText(value.itemId, 120);
  const hanzi = boundedText(value.hanzi, 80);
  const at = validIsoDate(value.at);
  return id && text && itemId && hanzi && at
    ? { id, role: value.role, text, itemId, hanzi, at }
    : undefined;
}

function optionalSessionId(value: unknown): string | undefined {
  return typeof value === "string" && SESSION_ID_PATTERN.test(value) ? value : undefined;
}

function boundedText(value: unknown, limit: number): string | undefined {
  return typeof value === "string" && value.trim() && value.length <= limit ? value : undefined;
}

function validIsoDate(value: unknown): string | undefined {
  if (typeof value !== "string" || value.length > 40) {
    return undefined;
  }
  try {
    return new Date(value).toISOString() === value ? value : undefined;
  } catch {
    return undefined;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
