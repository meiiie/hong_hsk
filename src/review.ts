import type {
  AppState,
  Attempt,
  DashboardStats,
  ReviewState,
  StudyMode,
  VocabItem,
} from "./types";
import { addDays, planDay, toDateKey } from "./date-utils";
import { gradeQuality, nextEase, nextInterval } from "./review-policy";

const HANZI_PUNCTUATION = /[\s,.;:!?，。！？、；：“”"'‘’（）()\[\]{}《》〈〉\-—_]/g;

export function normalizeAnswer(value: string): string {
  return value.normalize("NFKC").replace(HANZI_PUNCTUATION, "").trim();
}

export function isCorrectAnswer(input: string, expected: string): boolean {
  return normalizeAnswer(input) === normalizeAnswer(expected);
}

export function createAttempt(
  item: VocabItem,
  input: string,
  correct: boolean,
  mode: StudyMode,
  latencyMs: number,
): Attempt {
  return {
    id: `${Date.now()}-${item.id}-${Math.random().toString(16).slice(2)}`,
    itemId: item.id,
    lesson: item.lesson,
    mode,
    at: new Date().toISOString(),
    expected: item.hanzi,
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

export function dueItems(state: AppState, today = toDateKey()): VocabItem[] {
  return state.items
    .filter((item) => {
      const review = state.reviews[item.id];
      return review ? review.nextReviewDate <= today : false;
    })
    .sort((left, right) => priorityScore(state, right) - priorityScore(state, left));
}

export function wrongItems(state: AppState): VocabItem[] {
  return state.items
    .filter((item) => state.reviews[item.id]?.lastCorrect === false)
    .sort((left, right) => priorityScore(state, right) - priorityScore(state, left));
}

export function newItemsForLesson(
  state: AppState,
  lesson: number,
  limit = state.settings.dailyNewTarget,
): VocabItem[] {
  return state.items
    .filter((item) => item.lesson === lesson && !state.reviews[item.id])
    .sort((left, right) => left.order - right.order)
    .slice(0, limit);
}

export function queueForMode(state: AppState, mode: StudyMode): VocabItem[] {
  if (mode === "wrong") {
    return wrongItems(state);
  }
  if (mode === "lesson") {
    return state.items
      .filter((item) => item.lesson === state.settings.selectedLesson)
      .sort((left, right) => left.order - right.order);
  }
  if (mode === "all") {
    return state.items.slice().sort((left, right) => {
      if (left.lesson !== right.lesson) {
        return left.lesson - right.lesson;
      }
      return left.order - right.order;
    });
  }

  const due = dueItems(state).slice(0, state.settings.dailyReviewTarget);
  const todayLesson = Math.min(20, planDay(state.settings.startDate));
  const newCards = newItemsForLesson(state, todayLesson);
  const seen = new Set(due.map((item) => item.id));
  return [...due, ...newCards.filter((item) => !seen.has(item.id))];
}

export function computeStats(state: AppState): DashboardStats {
  const reviewList = Object.values(state.reviews);
  const attempts = state.attempts;
  const correct = attempts.filter((attempt) => attempt.correct).length;
  const studiedDays = new Set(attempts.map((attempt) => toDateKey(new Date(attempt.at))));

  return {
    totalItems: state.items.length,
    learned: reviewList.length,
    mastered: reviewList.filter((review) => review.status === "mastered").length,
    dueToday: dueItems(state).length,
    wrongOpen: reviewList.filter((review) => review.lastCorrect === false).length,
    accuracy: attempts.length ? Math.round((correct / attempts.length) * 100) : 0,
    streak: currentStreak(studiedDays),
    planDay: planDay(state.settings.startDate),
  };
}

export function progressForLesson(state: AppState, lesson: number): {
  total: number;
  learned: number;
  mastered: number;
  wrong: number;
} {
  const items = state.items.filter((item) => item.lesson === lesson);
  const learned = items.filter((item) => state.reviews[item.id]);
  return {
    total: items.length,
    learned: learned.length,
    mastered: learned.filter((item) => state.reviews[item.id]?.status === "mastered").length,
    wrong: learned.filter((item) => state.reviews[item.id]?.lastCorrect === false).length,
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

function priorityScore(state: AppState, item: VocabItem): number {
  const review = state.reviews[item.id];
  if (!review) {
    return 0;
  }
  const wrongPenalty = review.lastCorrect ? 0 : 100;
  const dueBonus = review.nextReviewDate <= toDateKey() ? 50 : 0;
  return wrongPenalty + dueBonus + review.wrongCount * 8 - review.correctStreak * 3;
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
