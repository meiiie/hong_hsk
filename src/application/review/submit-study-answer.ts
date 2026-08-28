import type { AppState, StudyDirection, StudyMode, VocabItem } from "../../domain/types";
import {
  applyAttempt,
  createAttempt,
  isCorrectStudyAnswer,
} from "../../domain/review/review-service";

export interface StudyAnswerResult {
  state: AppState;
  itemId: string;
  input: string;
  correct: boolean;
}

export function submitStudyAnswer(
  state: AppState,
  item: VocabItem,
  rawInput: string,
  mode: StudyMode,
  latencyMs: number,
  direction: StudyDirection = "vi-to-zh",
): StudyAnswerResult | undefined {
  const input = rawInput.trim();
  if (!input) {
    return undefined;
  }

  const correct = isCorrectStudyAnswer(input, item, direction);
  const attempt = createAttempt(item, input, correct, mode, latencyMs, direction);
  const reviews = direction === "zh-to-vi" ? state.recognitionReviews : state.reviews;
  const nextReviews = applyAttempt(reviews, attempt);
  return {
    state: {
      ...state,
      attempts: [attempt, ...state.attempts].slice(0, 5000),
      reviews: direction === "vi-to-zh" ? nextReviews : state.reviews,
      recognitionReviews: direction === "zh-to-vi" ? nextReviews : state.recognitionReviews,
    },
    itemId: item.id,
    input,
    correct,
  };
}
