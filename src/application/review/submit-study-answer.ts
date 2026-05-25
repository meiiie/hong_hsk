import type { AppState, StudyMode, VocabItem } from "../../domain/types";
import { applyAttempt, createAttempt, isCorrectAnswer } from "../../domain/review/review-service";

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
): StudyAnswerResult | undefined {
  const input = rawInput.trim();
  if (!input) {
    return undefined;
  }

  const correct = isCorrectAnswer(input, item.hanzi);
  const attempt = createAttempt(item, input, correct, mode, latencyMs);
  return {
    state: {
      ...state,
      attempts: [attempt, ...state.attempts].slice(0, 5000),
      reviews: applyAttempt(state.reviews, attempt),
    },
    itemId: item.id,
    input,
    correct,
  };
}
