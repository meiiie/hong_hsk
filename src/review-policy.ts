import type { ReviewQuality, ReviewState } from "./types";

export const HSK4_REVIEW_POLICY = {
  dailyNewTarget: 30,
  dailyReviewTarget: 80,
  slowAnswerMs: 18_000,
  fluentAnswerMs: 6_000,
  minEase: 1.3,
  maxEase: 2.8,
  maxIntervalDays: 45,
  recoveryDays: 1,
  firstRecallDays: 2,
  secondRecallDays: 4,
  secondRecallEasyDays: 6,
  thirdRecallDays: 7,
  thirdRecallEasyDays: 10,
} as const;

export function gradeQuality(
  correct: boolean,
  latencyMs: number,
  previous?: ReviewState,
): ReviewQuality {
  if (!correct) {
    return "again";
  }
  if (latencyMs > HSK4_REVIEW_POLICY.slowAnswerMs || previous?.lastCorrect === false) {
    return "hard";
  }
  if (
    latencyMs < HSK4_REVIEW_POLICY.fluentAnswerMs &&
    (previous?.correctStreak ?? 0) >= 2
  ) {
    return "easy";
  }
  return "good";
}

export function nextEase(currentEase: number, quality: ReviewQuality): number {
  if (quality === "again") {
    return Math.max(HSK4_REVIEW_POLICY.minEase, round(currentEase - 0.2));
  }
  if (quality === "hard") {
    return Math.max(HSK4_REVIEW_POLICY.minEase, round(currentEase - 0.05));
  }
  if (quality === "easy") {
    return Math.min(HSK4_REVIEW_POLICY.maxEase, round(currentEase + 0.12));
  }
  return Math.min(HSK4_REVIEW_POLICY.maxEase, round(currentEase + 0.04));
}

export function nextInterval(
  previousInterval: number,
  correctStreak: number,
  quality: ReviewQuality,
  ease: number,
): number {
  if (quality === "again") {
    return HSK4_REVIEW_POLICY.recoveryDays;
  }
  if (quality === "hard") {
    return Math.max(
      HSK4_REVIEW_POLICY.firstRecallDays,
      Math.round(Math.max(1, previousInterval) * 1.25),
    );
  }
  if (correctStreak <= 1) {
    return HSK4_REVIEW_POLICY.firstRecallDays;
  }
  if (correctStreak === 2) {
    return quality === "easy"
      ? HSK4_REVIEW_POLICY.secondRecallEasyDays
      : HSK4_REVIEW_POLICY.secondRecallDays;
  }
  if (correctStreak === 3) {
    return quality === "easy"
      ? HSK4_REVIEW_POLICY.thirdRecallEasyDays
      : HSK4_REVIEW_POLICY.thirdRecallDays;
  }
  return Math.min(
    HSK4_REVIEW_POLICY.maxIntervalDays,
    Math.max(HSK4_REVIEW_POLICY.thirdRecallEasyDays, Math.round(previousInterval * ease)),
  );
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
