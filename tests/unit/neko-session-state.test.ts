import { describe, expect, it } from "vitest";
import {
  NEKO_VISIBLE_MESSAGE_LIMIT,
  appendNekoExchange,
  parseNekoTutorSession,
  rememberNekoConversation,
} from "../../src/app/neko-session-state";

describe("Neko tutor session presentation state", () => {
  it("keeps one durable Neko conversation across cards", () => {
    const first = appendNekoExchange(undefined, {
      requestId: "request-1",
      conversationId: "20260828-010203-004-a1b2c3d4e5f60708",
      itemId: "item-1",
      hanzi: "法律",
      question: "Cho tôi một câu thử lại.",
      answer: "Hãy dùng 法律 trong một câu ngắn.",
      at: "2026-08-28T01:02:03.004Z",
    });
    const second = appendNekoExchange(first, {
      requestId: "request-2",
      conversationId: first.conversationId!,
      itemId: "item-2",
      hanzi: "俩",
      question: "Từ này khác 两 thế nào?",
      answer: "俩 dùng cho hai người và không đi cùng lượng từ.",
      at: "2026-08-28T01:03:03.004Z",
    });

    expect(second.conversationId).toBe(first.conversationId);
    expect(second.turnCount).toBe(2);
    expect(second.messages).toHaveLength(4);
    expect(second.messages.map((message) => message.hanzi)).toEqual(["法律", "法律", "俩", "俩"]);
  });

  it("retains only the bounded visible transcript while preserving the total turn count", () => {
    let session = rememberNekoConversation(undefined, "session-1", "2026-08-28T01:00:00.000Z");
    for (let index = 0; index < NEKO_VISIBLE_MESSAGE_LIMIT; index += 1) {
      session = appendNekoExchange(session, {
        requestId: `request-${index}`,
        conversationId: "session-1",
        itemId: `item-${index}`,
        hanzi: "词",
        question: `Câu hỏi ${index}`,
        answer: `Trả lời ${index}`,
        at: new Date(Date.UTC(2026, 7, 28, 1, index)).toISOString(),
      });
    }

    expect(session.turnCount).toBe(NEKO_VISIBLE_MESSAGE_LIMIT);
    expect(session.messages).toHaveLength(NEKO_VISIBLE_MESSAGE_LIMIT);
    expect(session.messages[0]?.text).toBe(`Câu hỏi ${NEKO_VISIBLE_MESSAGE_LIMIT / 2}`);
  });

  it("rejects malformed or over-sized restored state", () => {
    expect(parseNekoTutorSession({ schemaVersion: 1 })).toBeUndefined();
    expect(parseNekoTutorSession({
      schemaVersion: 1,
      conversationId: "../unsafe",
      startedAt: "2026-08-28T01:00:00.000Z",
      updatedAt: "2026-08-28T01:00:00.000Z",
      turnCount: 0,
      messages: [],
    })).toBeUndefined();
    expect(parseNekoTutorSession({
      schemaVersion: 1,
      startedAt: "2026-08-28T01:00:00.000Z",
      updatedAt: "2026-08-28T01:00:00.000Z",
      turnCount: 1,
      messages: [{
        id: "orphan-tutor",
        role: "tutor",
        text: "Không có lượt người học tương ứng.",
        itemId: "item-1",
        hanzi: "词",
        at: "2026-08-28T01:00:00.000Z",
      }],
    })).toBeUndefined();
  });
});
