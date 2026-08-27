import type {
  AppState,
  Attempt,
  DashboardStats,
  ReviewState,
  StudyDirection,
  StudyMode,
  VocabItem,
} from "../types";
import { addDays, planDay, toDateKey } from "../../shared/date-utils";
import { gradeQuality, nextEase, nextInterval } from "./review-policy";

const HANZI_PUNCTUATION = /[\s,.;:!?，。！？，、；：“”"'‘’（）()\[\]{}《》〈〉\-—_]/g;
const VIETNAMESE_PUNCTUATION = /[.,;:!?…“”"'‘’()\[\]{}<>/\\|_—–-]+/g;
const VIETNAMESE_VARIANT_SEPARATOR = /[,;/|]+|\s+(?:hoặc|hay)\s+/giu;

export function normalizeAnswer(value: string): string {
  return value.normalize("NFKC").replace(HANZI_PUNCTUATION, "").trim();
}

export function normalizeVietnameseAnswer(value: string): string {
  return value
    .normalize("NFKD")
    .toLocaleLowerCase("vi")
    .replace(/đ/g, "d")
    .replace(/\p{Mark}+/gu, "")
    .replace(VIETNAMESE_PUNCTUATION, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function vietnameseAnswerVariants(expected: string): string[] {
  const withoutNotes = expected.replace(/\([^)]*\)/g, " ");
  const parentheticalAsVariant = expected.replace(/[()]/g, ",");
  return [...new Set(
    [
      expected,
      ...withoutNotes.split(VIETNAMESE_VARIANT_SEPARATOR),
      ...parentheticalAsVariant.split(VIETNAMESE_VARIANT_SEPARATOR),
    ]
      .map(normalizeVietnameseAnswer)
      .filter(Boolean),
  )];
}

export function isCorrectAnswer(input: string, expected: string): boolean {
  return normalizeAnswer(input) === normalizeAnswer(expected);
}

export function isCorrectVietnameseAnswer(input: string, expected: string): boolean {
  const normalizedInput = normalizeVietnameseAnswer(input);
  return Boolean(normalizedInput) && vietnameseAnswerVariants(expected).includes(normalizedInput);
}

export function expectedAnswer(item: VocabItem, direction: StudyDirection): string {
  return direction === "zh-to-vi" ? item.meaningVi : item.hanzi;
}

export function isCorrectStudyAnswer(
  input: string,
  item: VocabItem,
  direction: StudyDirection,
): boolean {
  const expected = expectedAnswer(item, direction);
  return direction === "zh-to-vi"
    ? isCorrectVietnameseAnswer(input, expected)
    : isCorrectAnswer(input, expected);
}

export function createAttempt(
  item: VocabItem,
  input: string,
  correct: boolean,
  mode: StudyMode,
  latencyMs: number,
  direction: StudyDirection = "vi-to-zh",
): Attempt {
  return {
    id: `${Date.now()}-${item.id}-${Math.random().toString(16).slice(2)}`,
    itemId: item.id,
    lesson: item.lesson,
    mode,
    direction,
    at: new Date().toISOString(),
    expected: expectedAnswer(item, direction),
    input,
    correct,
    quality: correct ? "good" : "again",
    latencyMs,
  };
}

export function applyAttempt(
  reviews: Record<string, ReviewState>,
  attempt: Attempt,
): Record<string, ReviewState> {
  const today = toDateKey(new Date(attempt.at));
  const previous = reviews[attempt.itemId];
  const quality = gradeQuality(attempt.correct, attempt.latencyMs, previous);
  const next = scheduleReview(previous, attempt, quality, today);

  return {
    ...reviews,
    [attempt.itemId]: next,
  };
}

export function reviewsForDirection(
  state: AppState,
  direction: StudyDirection,
): Record<string, ReviewState> {
  return direction === "zh-to-vi" ? state.recognitionReviews : state.reviews;
}

export function recommendedStudyDirection(
  state: AppState,
  today = toDateKey(),
): StudyDirection {
  const writingItems = new Set<string>();
  const recognitionItems = new Set<string>();

  state.attempts.forEach((attempt) => {
    if (toDateKey(new Date(attempt.at)) !== today) {
      return;
    }
    if (attempt.direction === "zh-to-vi") {
      recognitionItems.add(attempt.itemId);
      return;
    }
    writingItems.add(attempt.itemId);
  });

  return writingItems.size > recognitionItems.size ? "zh-to-vi" : "vi-to-zh";
}

export function dueItems(
  state: AppState,
  today = toDateKey(),
  direction: StudyDirection = state.settings.studyDirection ?? "vi-to-zh",
): VocabItem[] {
  const reviews = reviewsForDirection(state, direction);
  return state.items
    .filter((item) => isStudyable(item, direction))
    .filter((item) => {
      const review = reviews[item.id];
      return review ? review.nextReviewDate <= today : false;
    })
    .sort((left, right) => priorityScore(reviews, right, today) - priorityScore(reviews, left, today));
}

export function wrongItems(
  state: AppState,
  direction: StudyDirection = state.settings.studyDirection ?? "vi-to-zh",
): VocabItem[] {
  const reviews = reviewsForDirection(state, direction);
  return state.items
    .filter((item) => isStudyable(item, direction) && reviews[item.id]?.lastCorrect === false)
    .sort((left, right) => priorityScore(reviews, right) - priorityScore(reviews, left));
}

export function newItemsForLesson(
  state: AppState,
  lesson: number,
  limit = state.settings.dailyNewTarget,
  direction: StudyDirection = state.settings.studyDirection ?? "vi-to-zh",
): VocabItem[] {
  const reviews = reviewsForDirection(state, direction);
  return state.items
    .filter((item) => item.lesson === lesson && isStudyable(item, direction) && !reviews[item.id])
    .sort((left, right) => left.order - right.order)
    .slice(0, limit);
}

export function queueForMode(
  state: AppState,
  mode: StudyMode,
  direction: StudyDirection = state.settings.studyDirection ?? "vi-to-zh",
): VocabItem[] {
  if (mode === "wrong") {
    return wrongItems(state, direction);
  }
  if (mode === "lesson") {
    return state.items
      .filter((item) => item.lesson === state.settings.selectedLesson && isStudyable(item, direction))
      .sort((left, right) => left.order - right.order);
  }
  if (mode === "all") {
    return state.items.filter((item) => isStudyable(item, direction)).sort((left, right) => {
      if (left.lesson !== right.lesson) {
        return left.lesson - right.lesson;
      }
      return left.order - right.order;
    });
  }

  const due = dueItems(state, toDateKey(), direction).slice(0, state.settings.dailyReviewTarget);
  const todayLesson = Math.min(20, planDay(state.settings.startDate));
  const newCards = newItemsForLesson(state, todayLesson, state.settings.dailyNewTarget, direction);
  const seen = new Set(due.map((item) => item.id));
  return [...due, ...newCards.filter((item) => !seen.has(item.id))];
}

export function computeStats(state: AppState): DashboardStats {
  const reviewList = Object.values(state.reviews);
  const recognitionList = Object.values(state.recognitionReviews);
  const activeDirection = state.settings.studyDirection ?? "vi-to-zh";
  const activeReviews = reviewsForDirection(state, activeDirection);
  const writingAttempts = state.attempts.filter(
    (attempt) => !attempt.direction || attempt.direction === "vi-to-zh",
  );
  const correct = writingAttempts.filter((attempt) => attempt.correct).length;
  const studiedDays = new Set(state.attempts.map((attempt) => toDateKey(new Date(attempt.at))));

  return {
    totalItems: state.items.length,
    learned: reviewList.length,
    mastered: reviewList.filter((review) => review.status === "mastered").length,
    recognitionLearned: recognitionList.length,
    recognitionMastered: recognitionList.filter((review) => review.status === "mastered").length,
    recognitionDueToday: dueItems(state, toDateKey(), "zh-to-vi").length,
    dueToday: dueItems(state, toDateKey(), activeDirection).length,
    wrongOpen: Object.values(activeReviews).filter((review) => review.lastCorrect === false).length,
    accuracy: writingAttempts.length ? Math.round((correct / writingAttempts.length) * 100) : 0,
    streak: currentStreak(studiedDays),
    planDay: planDay(state.settings.startDate),
  };
}

export function progressForLesson(
  state: AppState,
  lesson: number,
  direction: StudyDirection = "vi-to-zh",
): {
  total: number;
  learned: number;
  mastered: number;
  wrong: number;
} {
  const reviews = reviewsForDirection(state, direction);
  const items = state.items.filter((item) => item.lesson === lesson);
  const learned = items.filter((item) => reviews[item.id]);
  return {
    total: items.length,
    learned: learned.length,
    mastered: learned.filter((item) => reviews[item.id]?.status === "mastered").length,
    wrong: learned.filter((item) => reviews[item.id]?.lastCorrect === false).length,
  };
}

function scheduleReview(
  previous: ReviewState | undefined,
  attempt: Attempt,
  quality: ReturnType<typeof gradeQuality>,
  today: string,
): ReviewState {
  const totalAttempts = (previous?.totalAttempts ?? 0) + 1;
  const correctAttempts = (previous?.correctAttempts ?? 0) + (attempt.correct ? 1 : 0);
  const wrongCount = (previous?.wrongCount ?? 0) + (attempt.correct ? 0 : 1);
  const correctStreak = attempt.correct ? (previous?.correctStreak ?? 0) + 1 : 0;
  const easeBase = previous?.ease ?? 2.3;
  const intervalBase = previous?.intervalDays ?? 0;
  const ease = nextEase(easeBase, quality);
  const intervalDays = nextInterval(intervalBase, correctStreak, quality, ease);
  const status = nextStatus(attempt.correct, correctStreak, totalAttempts);

  return {
    itemId: attempt.itemId,
    status,
    firstSeen: previous?.firstSeen ?? today,
    lastReviewed: today,
    nextReviewDate: addDays(today, intervalDays),
    intervalDays,
    ease,
    totalAttempts,
    correctAttempts,
    wrongCount,
    correctStreak,
    lastInput: attempt.input,
    lastCorrect: attempt.correct,
  };
}

function nextStatus(
  correct: boolean,
  correctStreak: number,
  totalAttempts: number,
): ReviewState["status"] {
  if (!correct) {
    return "learning";
  }
  if (correctStreak >= 4) {
    return "mastered";
  }
  return totalAttempts <= 1 ? "learning" : "review";
}

function priorityScore(
  reviews: Record<string, ReviewState>,
  item: VocabItem,
  today = toDateKey(),
): number {
  const review = reviews[item.id];
  if (!review) {
    return 0;
  }
  const wrongPenalty = review.lastCorrect ? 0 : 100;
  const dueBonus = review.nextReviewDate <= today ? 50 : 0;
  return wrongPenalty + dueBonus + review.wrongCount * 8 - review.correctStreak * 3;
}

function isStudyable(item: VocabItem, direction: StudyDirection): boolean {
  return direction === "vi-to-zh" || Boolean(item.meaningVi.trim());
}

function currentStreak(studiedDays: Set<string>): number {
  let cursor = toDateKey();
  let streak = 0;

  while (studiedDays.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return streak;
}
