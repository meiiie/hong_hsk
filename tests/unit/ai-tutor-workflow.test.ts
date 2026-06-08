import { describe, expect, it } from "vitest";
import {
  AiTutorWorkflow,
  buildAiTutorMemoryMarkdown,
  buildAiTutorRequest,
} from "../../src/app/workflows/ai-tutor-workflow";
import { makeAppState, makeReviewState, makeVocabItem } from "./factories";

describe("AI tutor workflow", () => {
  it("keeps a streaming tutor chat session across study cards", () => {
    const workflow = new AiTutorWorkflow();

    const assistantMessageId = workflow.startTurn("word-1", "explain", "Giải thích cách dùng từ 爱情");
    workflow.appendDelta(assistantMessageId, "Short ");
    workflow.appendDelta(assistantMessageId, "explanation");

    expect(workflow.stateForItem("word-1")).toMatchObject({
      status: "streaming",
      action: "explain",
      messages: [
        {
          role: "user",
          content: "Giải thích cách dùng từ 爱情",
        },
        {
          role: "assistant",
          content: "Short explanation",
          status: "streaming",
        },
      ],
    });

    workflow.complete({
      action: "explain",
      content: "Short explanation",
      generatedAt: "2026-06-08T10:00:00.000Z",
      model: "nvidia/nemotron-3-ultra-550b-a55b",
    });

    expect(workflow.stateForItem("word-1")).toMatchObject({
      status: "ready",
      action: "explain",
      messages: [
        {
          role: "user",
          content: "Giải thích cách dùng từ 爱情",
        },
        {
          role: "assistant",
          content: "Short explanation",
          status: "done",
          model: "nvidia/nemotron-3-ultra-550b-a55b",
        },
      ],
    });
    expect(workflow.stateForItem("word-2")).toMatchObject({
      itemId: "word-2",
      status: "ready",
      messages: expect.arrayContaining([
        expect.objectContaining({
          role: "assistant",
          content: "Short explanation",
        }),
      ]),
    });
  });

  it("builds a compact request with item, learner, and feedback context", () => {
    const item = makeVocabItem({
      id: "word-bi-ye",
      hanzi: "毕业",
      pinyin: "biye",
      meaningVi: "tốt nghiệp",
      lesson: 2,
    });
    const state = makeAppState({ items: [item] });

    const request = buildAiTutorRequest(
      state,
      item,
      "lesson",
      "why_wrong",
      {
        itemId: item.id,
        input: "毕也",
        correct: false,
      },
      "Vì sao em sai chữ này?",
    );

    expect(request).toMatchObject({
      action: "why_wrong",
      question: "Vì sao em sai chữ này?",
      item: {
        id: "word-bi-ye",
        hanzi: "毕业",
        meaningVi: "tốt nghiệp",
      },
      learner: {
        displayName: state.settings.displayName,
        locale: "vi",
        studyMode: "lesson",
      },
      feedback: {
        input: "毕也",
        correct: false,
      },
    });
  });

  it("builds a compact markdown memory from current card and recent mistakes", () => {
    const current = makeVocabItem({
      id: "word-current",
      hanzi: "弹钢琴",
      pinyin: "tan gangqin",
      meaningVi: "chơi đàn piano",
      lesson: 15,
    });
    const wrong = makeVocabItem({
      id: "word-wrong",
      hanzi: "法律",
      pinyin: "falv",
      meaningVi: "pháp luật",
      lesson: 1,
    });
    const state = makeAppState({
      items: [current, wrong],
      reviews: {
        "word-wrong": makeReviewState({
          itemId: "word-wrong",
          wrongCount: 2,
          lastInput: "法侓",
          lastReviewed: "2026-06-07",
        }),
      },
    });

    const memory = buildAiTutorMemoryMarkdown(state, current, "today");

    expect(memory).toContain("# Bộ nhớ học tập của Hồng");
    expect(memory).toContain("弹钢琴");
    expect(memory).toContain("法律");
    expect(memory).toContain("法侓");
  });
});
