import type { View } from "../app-types";
import type { VocabItem } from "../../domain/types";
import {
  HSK4_MOCK_SETS,
  createMockExam,
  type MockExamSet,
  type MockExamSession,
} from "../../domain/exam/mock-exam";

export class MockExamWorkflow {
  session: MockExamSession | undefined;
  index = 0;
  selectedSetId = HSK4_MOCK_SETS[0].id;

  selectedSet(): MockExamSet {
    return HSK4_MOCK_SETS.find((set) => set.id === this.selectedSetId) ?? HSK4_MOCK_SETS[0];
  }

  selectSet(setId: string): void {
    this.selectedSetId = setId || HSK4_MOCK_SETS[0].id;
  }

  start(items: VocabItem[]): void {
    this.session = createMockExam(items, this.selectedSet());
    this.index = 0;
  }

  reset(): void {
    this.session = undefined;
    this.index = 0;
  }

  submit(now = Date.now()): void {
    if (!this.session) {
      return;
    }
    this.session = { ...this.session, submittedAt: now };
  }

  unansweredCount(): number {
    if (!this.session) {
      return 0;
    }
    const answered = Object.values(this.session.answers).filter((answer) => answer.trim()).length;
    return this.session.questions.length - answered;
  }

  previousQuestion(): void {
    this.index = Math.max(0, this.index - 1);
  }

  nextQuestion(): void {
    const lastIndex = Math.max(0, (this.session?.questions.length ?? 1) - 1);
    this.index = Math.min(lastIndex, this.index + 1);
  }

  saveAnswer(answer: string): void {
    const question = this.session?.questions[this.index];
    if (!this.session || !question) {
      return;
    }
    this.session.answers[question.id] = answer;
  }

  appendAnswerFragment(currentValue: string, fragment: string): string {
    const nextValue = `${currentValue}${fragment}`;
    this.saveAnswer(nextValue);
    return nextValue;
  }

  remainingMs(now = Date.now()): number {
    if (!this.session) {
      return 0;
    }
    return this.session.durationMinutes * 60_000 - (now - this.session.startedAt);
  }

  isRunning(activeView: View): boolean {
    return activeView === "mock" && !!this.session && !this.session.submittedAt;
  }
}
