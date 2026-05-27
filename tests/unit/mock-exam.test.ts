import { describe, expect, it } from "vitest";
import {
  HSK4_MOCK_SETS,
  HSK4_MOCK_SPEC,
  createMockExam,
  formatExamTime,
  scoreMockExam,
} from "../../src/domain/exam/mock-exam";
import { makeVocabItem } from "./factories";

const examItems = Array.from({ length: 120 }, (_, index) =>
  makeVocabItem({
    id: `item-${index + 1}`,
    hanzi: `词${index + 1}`,
    order: index + 1,
    lesson: (index % 20) + 1,
    meaningVi: `tu ${index + 1}`,
    exampleHan: `我觉得词${index + 1}非常重要。`,
  }),
);

describe("mock exam", () => {
  it("generates an HSK4-shaped 100-question exam", () => {
    const session = createMockExam(examItems, HSK4_MOCK_SETS[0], 1_717_000_000_000);

    expect(session.questions).toHaveLength(HSK4_MOCK_SPEC.total);
    expect(session.durationMinutes).toBe(HSK4_MOCK_SPEC.durationMinutes);
    expect(session.questions.filter((question) => question.section === "listening")).toHaveLength(HSK4_MOCK_SPEC.listening);
    expect(session.questions.filter((question) => question.section === "reading")).toHaveLength(HSK4_MOCK_SPEC.reading);
    expect(session.questions.filter((question) => question.section === "writing")).toHaveLength(HSK4_MOCK_SPEC.writing);
  });

  it("is deterministic for the same set seed and timestamp", () => {
    const left = createMockExam(examItems, HSK4_MOCK_SETS[1], 1_717_000_000_000);
    const right = createMockExam(examItems, HSK4_MOCK_SETS[1], 1_717_000_000_000);

    expect(left.id).toBe(right.id);
    expect(left.questions.slice(0, 10).map((question) => question.answer)).toEqual(
      right.questions.slice(0, 10).map((question) => question.answer),
    );
  });

  it("scores a fully answered simulated paper by section", () => {
    const session = createMockExam(examItems, HSK4_MOCK_SETS[0], 1_717_000_000_000);
    session.answers = Object.fromEntries(
      session.questions.map((question) => [
        question.id,
        question.type === "write-sentence" ? (question.expectedHan ?? question.answer) : question.answer,
      ]),
    );

    const score = scoreMockExam(session);

    expect(score.correct).toBe(HSK4_MOCK_SPEC.total);
    expect(score.points).toBe(300);
    expect(score.passed).toBe(true);
    expect(score.sections.map((section) => section.total)).toEqual([
      HSK4_MOCK_SPEC.listening,
      HSK4_MOCK_SPEC.reading,
      HSK4_MOCK_SPEC.writing,
    ]);
  });

  it("handles empty data and time display safely", () => {
    expect(createMockExam([], HSK4_MOCK_SETS[0], 1).questions).toEqual([]);
    expect(formatExamTime(65_000)).toBe("01:05");
    expect(formatExamTime(-1)).toBe("00:00");
  });
});
