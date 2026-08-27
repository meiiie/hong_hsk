import type { StudyFeedback } from "../app-types";
import type { AppState, StudyDirection, StudyMode, VocabItem } from "../../domain/types";
import { expectedAnswer, queueForMode } from "../../domain/review/review-service";

export class StudyWorkflow {
  mode: StudyMode = "today";
  direction: StudyDirection = "vi-to-zh";
  queue: VocabItem[] = [];
  index = 0;
  cardStartedAt = Date.now();
  strokeCharIndex = 0;
  feedback: StudyFeedback | undefined;

  ensureQueue(state: AppState): void {
    if (this.queue.length) {
      return;
    }
    this.queue = queueForMode(state, this.mode, this.direction);
    this.index = 0;
    this.cardStartedAt = Date.now();
  }

  start(mode: StudyMode): void {
    this.mode = mode;
    this.clear();
  }

  setDirection(direction: StudyDirection): void {
    if (this.direction === direction) {
      return;
    }
    this.direction = direction;
    this.clear();
  }

  nextCard(): void {
    this.index += 1;
    this.cardStartedAt = Date.now();
    this.strokeCharIndex = 0;
    this.feedback = undefined;
  }

  currentItem(): VocabItem | undefined {
    return this.queue[this.index];
  }

  revealCurrentAnswer(): boolean {
    const item = this.currentItem();
    if (!item) {
      return false;
    }
    this.feedback = {
      itemId: item.id,
      input: expectedAnswer(item, this.direction),
      correct: true,
      revealed: true,
    };
    return true;
  }

  hideRevealedAnswer(): boolean {
    if (!this.feedback?.revealed) {
      return false;
    }
    this.feedback = undefined;
    this.strokeCharIndex = 0;
    return true;
  }

  selectStrokeChar(index: number): void {
    this.strokeCharIndex = Number.isFinite(index) ? Math.max(0, Math.round(index)) : 0;
  }

  recordFeedback(itemId: string, input: string, correct: boolean): void {
    this.feedback = { itemId, input, correct };
  }

  cardLatencyMs(now = Date.now()): number {
    return Math.max(0, now - this.cardStartedAt);
  }

  clear(): void {
    this.queue = [];
    this.index = 0;
    this.strokeCharIndex = 0;
    this.cardStartedAt = Date.now();
    this.feedback = undefined;
  }
}
