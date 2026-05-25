import { describe, expect, it } from "vitest";
import { submitStudyAnswer } from "../../src/application/review/submit-study-answer";
import { makeAppState, makeVocabItem } from "./factories";

describe("submit study answer use case", () => {
  it("returns undefined for empty input", () => {
    const item = makeVocabItem({ id: "word-1", hanzi: "毕业" });
    expect(submitStudyAnswer(makeAppState({ items: [item] }), item, "   ", "today", 500)).toBeUndefined();
  });

  it("records an attempt and updates review state", () => {
    const item = makeVocabItem({ id: "word-1", hanzi: "毕业" });
    const result = submitStudyAnswer(makeAppState({ items: [item] }), item, "毕业", "today", 1_200);

    expect(result?.correct).toBe(true);
    expect(result?.state.attempts[0]).toMatchObject({
      itemId: "word-1",
      input: "毕业",
      correct: true,
      mode: "today",
    });
    expect(result?.state.reviews["word-1"].lastCorrect).toBe(true);
  });
});
