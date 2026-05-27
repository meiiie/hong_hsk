import { describe, expect, it } from "vitest";
import { HSK4_REVIEW_POLICY, gradeQuality, nextEase, nextInterval } from "../../src/domain/review/review-policy";
import { makeReviewState } from "./factories";

describe("HSK4 review policy", () => {
  it("grades wrong answers as immediate recovery", () => {
    expect(gradeQuality(false, 1_000)).toBe("again");
    expect(nextInterval(10, 0, "again", 2.3)).toBe(HSK4_REVIEW_POLICY.recoveryDays);
  });

  it("treats slow or recently wrong correct answers as hard", () => {
    expect(gradeQuality(true, HSK4_REVIEW_POLICY.slowAnswerMs + 1)).toBe("hard");
    expect(gradeQuality(true, 2_000, makeReviewState({ lastCorrect: false }))).toBe("hard");
  });

  it("rewards fast fluent recall as easy after a streak", () => {
    expect(gradeQuality(true, HSK4_REVIEW_POLICY.fluentAnswerMs - 1, makeReviewState({ correctStreak: 2 }))).toBe("easy");
    expect(nextInterval(4, 2, "easy", 2.3)).toBe(HSK4_REVIEW_POLICY.secondRecallEasyDays);
  });

  it("keeps ease and interval inside policy bounds", () => {
    expect(nextEase(HSK4_REVIEW_POLICY.minEase, "again")).toBe(HSK4_REVIEW_POLICY.minEase);
    expect(nextEase(HSK4_REVIEW_POLICY.maxEase, "easy")).toBe(HSK4_REVIEW_POLICY.maxEase);
    expect(nextInterval(90, 5, "good", 2.8)).toBe(HSK4_REVIEW_POLICY.maxIntervalDays);
  });
});
