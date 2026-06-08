import { describe, expect, it } from "vitest";
import { AiTutorWorkflow, buildAiTutorRequest } from "../../src/app/workflows/ai-tutor-workflow";
import { makeAppState, makeVocabItem } from "./factories";

describe("AI tutor workflow", () => {
  it("keeps tutor state scoped to the current study card", () => {
    const workflow = new AiTutorWorkflow();

    workflow.start("word-1", "explain");
    workflow.complete({
      action: "explain",
      content: "Short explanation",
      generatedAt: "2026-06-08T10:00:00.000Z",
      model: "nvidia/nemotron-3-ultra-550b-a55b",
    });

    expect(workflow.stateForItem("word-1")).toMatchObject({
      status: "ready",
      action: "explain",
    });
    expect(workflow.stateForItem("word-2")).toEqual({
      itemId: "word-2",
      status: "idle",
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
});
