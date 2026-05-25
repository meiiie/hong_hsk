import { describe, expect, it } from "vitest";
import { MockExamWorkflow } from "../../src/app/workflows/mock-exam-workflow";
import { HSK4_MOCK_SETS, HSK4_MOCK_SPEC } from "../../src/domain/exam/mock-exam";
import { makeVocabItem } from "./factories";

const examItems = Array.from({ length: 120 }, (_, index) =>
  makeVocabItem({
    id: `exam-${index + 1}`,
    hanzi: `词${index + 1}`,
    lesson: (index % 20) + 1,
    order: index + 1,
    meaningVi: `tu ${index + 1}`,
    exampleHan: `我觉得词${index + 1}非常重要。`,
  }),
);

describe("mock exam workflow", () => {
  it("tracks selected set, active question, answers, and submit state", () => {
    const workflow = new MockExamWorkflow();

    workflow.selectSet(HSK4_MOCK_SETS[1].id);
    workflow.start(examItems);

    expect(workflow.selectedSet().id).toBe(HSK4_MOCK_SETS[1].id);
    expect(workflow.session?.questions).toHaveLength(HSK4_MOCK_SPEC.total);
    expect(workflow.index).toBe(0);

    const firstQuestion = workflow.session?.questions[0];
    workflow.saveAnswer(firstQuestion?.answer ?? "");
    expect(workflow.unansweredCount()).toBe(HSK4_MOCK_SPEC.total - 1);

    workflow.nextQuestion();
    expect(workflow.index).toBe(1);
    workflow.previousQuestion();
    expect(workflow.index).toBe(0);

    workflow.submit(1_717_000_000_000);
    expect(workflow.session?.submittedAt).toBe(1_717_000_000_000);
    expect(workflow.isRunning("mock")).toBe(false);
  });

  it("can append and clear text answers without changing the current question", () => {
    const workflow = new MockExamWorkflow();
    workflow.start(examItems);

    const nextAnswer = workflow.appendAnswerFragment("我", "学习");
    expect(nextAnswer).toBe("我学习");
    expect(Object.values(workflow.session?.answers ?? {})).toContain("我学习");

    workflow.saveAnswer("");
    expect(Object.values(workflow.session?.answers ?? {})).toContain("");
  });
});
