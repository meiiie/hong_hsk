import { describe, expect, it } from "vitest";
import { StudyWorkflow } from "../../src/app/workflows/study-workflow";
import { makeAppState, makeVocabItem } from "./factories";

describe("study workflow", () => {
  it("builds a lesson queue and tracks card transitions", () => {
    const state = makeAppState({
      items: [
        makeVocabItem({ id: "lesson-1", lesson: 1, order: 1 }),
        makeVocabItem({ id: "lesson-2-a", lesson: 2, order: 2 }),
        makeVocabItem({ id: "lesson-2-b", lesson: 2, order: 1 }),
      ],
      settings: {
        ...makeAppState().settings,
        selectedLesson: 2,
      },
    });
    const workflow = new StudyWorkflow();

    workflow.start("lesson");
    workflow.ensureQueue(state);

    expect(workflow.queue.map((item) => item.id)).toEqual(["lesson-2-b", "lesson-2-a"]);
    expect(workflow.currentItem()?.id).toBe("lesson-2-b");

    workflow.nextCard();

    expect(workflow.currentItem()?.id).toBe("lesson-2-a");
    expect(workflow.feedback).toBeUndefined();
    expect(workflow.strokeCharIndex).toBe(0);
  });

  it("reveals, hides, and records recall feedback without mutating app state", () => {
    const state = makeAppState({ items: [makeVocabItem({ id: "word-1", hanzi: "毕业" })] });
    const workflow = new StudyWorkflow();

    workflow.start("all");
    workflow.ensureQueue(state);
    expect(workflow.revealCurrentAnswer()).toBe(true);
    expect(workflow.feedback).toMatchObject({ itemId: "word-1", input: "毕业", revealed: true });

    expect(workflow.hideRevealedAnswer()).toBe(true);
    expect(workflow.feedback).toBeUndefined();

    workflow.recordFeedback("word-1", "毕也", false);
    expect(workflow.feedback).toMatchObject({ itemId: "word-1", input: "毕也", correct: false });
  });
});
