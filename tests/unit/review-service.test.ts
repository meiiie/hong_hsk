import { describe, expect, it, vi } from "vitest";
import {
  applyAttempt,
  dueItems,
  isCorrectAnswer,
  newItemsForLesson,
  queueForMode,
  wrongItems,
} from "../../src/domain/review/review-service";
import { makeAppState, makeAttempt, makeReviewState, makeVocabItem } from "./factories";

describe("review service", () => {
  it("normalizes typed Hanzi answers before comparing", () => {
    expect(isCorrectAnswer(" 爱 情! ", "爱情")).toBe(true);
    expect(isCorrectAnswer("爱人", "爱情")).toBe(false);
  });

  it("schedules a wrong answer for quick recovery", () => {
    const next = applyAttempt({}, makeAttempt({ correct: false, input: "爱人" }))["item-1"];

    expect(next.status).toBe("learning");
    expect(next.lastCorrect).toBe(false);
    expect(next.wrongCount).toBe(1);
    expect(next.nextReviewDate).toBe("2026-05-26");
  });

  it("promotes stable recall to mastered after a long correct streak", () => {
    const previous = makeReviewState({
      itemId: "item-1",
      correctStreak: 3,
      totalAttempts: 3,
      correctAttempts: 3,
      intervalDays: 7,
    });
    const next = applyAttempt({ "item-1": previous }, makeAttempt({ correct: true, latencyMs: 4_000 }))["item-1"];

    expect(next.status).toBe("mastered");
    expect(next.correctStreak).toBe(4);
    expect(next.nextReviewDate > next.lastReviewed).toBe(true);
  });

  it("builds today's queue from due cards first and then new lesson cards", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 4, 26, 12));

    try {
      const due = makeVocabItem({ id: "due", hanzi: "复习", lesson: 1, order: 1 });
      const fresh = makeVocabItem({ id: "fresh", hanzi: "新的", lesson: 1, order: 2 });
      const state = makeAppState({
        items: [fresh, due],
        reviews: {
          due: makeReviewState({
            itemId: "due",
            nextReviewDate: "2026-05-24",
            wrongCount: 2,
            lastCorrect: false,
          }),
        },
        settings: {
          ...makeAppState().settings,
          startDate: "2026-05-26",
          dailyReviewTarget: 10,
          dailyNewTarget: 10,
        },
      });

      expect(dueItems(state, "2026-05-26").map((item) => item.id)).toEqual(["due"]);
      expect(wrongItems(state).map((item) => item.id)).toEqual(["due"]);
      expect(newItemsForLesson(state, 1).map((item) => item.id)).toEqual(["fresh"]);
      expect(queueForMode(state, "today").map((item) => item.id)).toEqual(["due", "fresh"]);
    } finally {
      vi.useRealTimers();
    }
  });
});
