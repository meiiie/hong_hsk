import "../presentation/styles.css";
import type { StudyFeedback, View } from "./app-types";
import { registerServiceWorker } from "./service-worker";
import { renderDashboardView } from "./views/dashboard-view";
import { getDataHealthStats, renderDataView } from "./views/data-view";
import { renderLessonsView, renderWrongView } from "./views/lesson-views";
import { renderMockExamIntro, renderMockExamResults, renderMockExamRunner } from "./views/mock-exam-view";
import { renderPlanView } from "./views/plan-view";
import { renderStudyView } from "./views/study-view";
import { renderAppShell } from "./views/app-shell-view";
import { clamp, extractHanziChars, removeStarterItems } from "./views/view-helpers";
import type { AppState, StudyMode, VocabItem } from "../domain/types";
import { toDateKey } from "../shared/date-utils";
import {
  exportCsv,
  exportJson,
  exportTemplateCsv,
  exportWorkbook,
  importStandardCourseReference,
  importVocabFile,
  mergeItems,
} from "../infrastructure/import-export/workbook-io";
import { applyAttempt, computeStats, createAttempt, isCorrectAnswer, queueForMode } from "../domain/review/review-service";
import { loadState, resetState, saveState } from "../infrastructure/storage/indexeddb-state-store";
import { HanziStrokeTrainer } from "../infrastructure/hanzi/hanzi-stroke-trainer";
import {
  HSK4_MOCK_SETS,
  createMockExam,
  formatExamTime,
  type MockExamSet,
  type MockExamSession,
} from "../domain/exam/mock-exam";

class HskApp {
  private state!: AppState;
  private activeView: View = "dashboard";
  private studyMode: StudyMode = "today";
  private studyQueue: VocabItem[] = [];
  private studyIndex = 0;
  private cardStartedAt = Date.now();
  private strokeCharIndex = 0;
  private readonly strokeTrainer = new HanziStrokeTrainer();
  private mockExam: MockExamSession | undefined;
  private mockExamIndex = 0;
  private selectedMockSetId = HSK4_MOCK_SETS[0].id;
  private examClockId: number | undefined;
  private feedback: StudyFeedback | undefined;

  constructor(private readonly root: HTMLElement) {}

  async init(): Promise<void> {
    this.state = await loadState();
    registerServiceWorker();
    this.render();
  }

  private render(): void {
    const stats = computeStats(this.state);
    this.root.innerHTML = renderAppShell({
      activeView: this.activeView,
      state: this.state,
      stats,
      content: this.renderActiveView(),
    });
    this.bindEvents();
    void this.mountStrokeTrainer();
    this.syncExamClock();
  }

  private renderActiveView(): string {
    if (this.activeView === "study") {
      return this.renderStudy();
    }
    if (this.activeView === "lessons") {
      return renderLessonsView(this.state);
    }
    if (this.activeView === "wrong") {
      return renderWrongView(this.state);
    }
    if (this.activeView === "mock") {
      return this.renderMockExam();
    }
    if (this.activeView === "plan") {
      return renderPlanView(this.state);
    }
    if (this.activeView === "data") {
      return renderDataView(this.state);
    }
    return renderDashboardView(this.state, getDataHealthStats(this.state));
  }

  private renderStudy(): string {
    if (!this.studyQueue.length) {
      this.studyQueue = queueForMode(this.state, this.studyMode);
      this.studyIndex = 0;
      this.cardStartedAt = Date.now();
    }

    return renderStudyView({
      state: this.state,
      studyMode: this.studyMode,
      studyQueue: this.studyQueue,
      studyIndex: this.studyIndex,
      strokeCharIndex: this.strokeCharIndex,
      feedback: this.feedback,
    });
  }

  private renderMockExam(): string {
    if (!this.mockExam) {
      return renderMockExamIntro(getDataHealthStats(this.state), this.selectedMockSet());
    }
    if (this.mockExam.submittedAt) {
      return renderMockExamResults(this.mockExam);
    }
    return renderMockExamRunner(this.mockExam, this.mockExamIndex, this.examRemainingMs(this.mockExam));
  }

  private selectedMockSet(): MockExamSet {
    return HSK4_MOCK_SETS.find((set) => set.id === this.selectedMockSetId) ?? HSK4_MOCK_SETS[0];
  }

  private bindEvents(): void {
    this.root.querySelectorAll<HTMLButtonElement>("[data-view]").forEach((button) => {
      button.addEventListener("click", () => {
        const view = button.dataset.view as View;
        this.activeView = view;
        if (view !== "study") {
          this.clearStudyQueue();
        }
        this.render();
      });
    });

    this.root.querySelectorAll<HTMLButtonElement>("[data-study-mode]").forEach((button) => {
      button.addEventListener("click", () => {
        this.studyMode = button.dataset.studyMode as StudyMode;
        this.activeView = "study";
        this.clearStudyQueue();
        this.render();
        queueMicrotask(() => this.root.querySelector<HTMLInputElement>("#hanzi-input")?.focus());
      });
    });

    this.root.querySelectorAll<HTMLButtonElement>("[data-lesson]").forEach((button) => {
      button.addEventListener("click", async () => {
        this.state.settings.selectedLesson = Number(button.dataset.lesson);
        await this.persist();
        this.render();
      });
    });

    this.root.querySelector<HTMLFormElement>("[data-answer-form]")?.addEventListener("submit", (event) => {
      event.preventDefault();
      void this.submitAnswer();
    });

    this.root.querySelector<HTMLButtonElement>("[data-next-card]")?.addEventListener("click", () => {
      this.studyIndex += 1;
      this.cardStartedAt = Date.now();
      this.strokeCharIndex = 0;
      this.feedback = undefined;
      this.render();
      queueMicrotask(() => this.root.querySelector<HTMLInputElement>("#hanzi-input")?.focus());
    });

    this.root.querySelector<HTMLButtonElement>("[data-reveal-answer]")?.addEventListener("click", () => {
      const item = this.studyQueue[this.studyIndex];
      if (item) {
        this.feedback = { itemId: item.id, input: item.hanzi, correct: true, revealed: true };
        this.render();
      }
    });

    this.root.querySelector<HTMLButtonElement>("[data-hide-answer]")?.addEventListener("click", () => {
      if (this.feedback?.revealed) {
        this.feedback = undefined;
        this.strokeCharIndex = 0;
        this.render();
        queueMicrotask(() => this.root.querySelector<HTMLInputElement>("#hanzi-input")?.focus());
      }
    });

    this.root.querySelectorAll<HTMLButtonElement>("[data-stroke-char]").forEach((button) => {
      button.addEventListener("click", () => {
        this.strokeCharIndex = Number(button.dataset.strokeChar) || 0;
        this.render();
      });
    });

    this.root.querySelectorAll<HTMLButtonElement>("[data-stroke-action]").forEach((button) => {
      button.addEventListener("click", () => {
        void this.handleStrokeAction(button.dataset.strokeAction ?? "");
      });
    });

    this.root.querySelectorAll<HTMLInputElement | HTMLSelectElement>("[data-setting]").forEach((input) => {
      input.addEventListener("change", async () => {
        const key = input.dataset.setting;
        if (key === "startDate") {
          this.state.settings.startDate = input.value || toDateKey();
        }
        if (key === "dailyNewTarget") {
          this.state.settings.dailyNewTarget = clamp(Number(input.value), 5, 80);
        }
        if (key === "dailyReviewTarget") {
          this.state.settings.dailyReviewTarget = clamp(Number(input.value), 20, 240);
        }
        if (key === "locale") {
          this.state.settings.locale = input.value === "en" ? "en" : "vi";
        }
        if (key === "useEnglishFallback") {
          this.state.settings.useEnglishFallback = input instanceof HTMLInputElement ? input.checked : false;
        }
        await this.persist();
        this.render();
      });
    });

    const fileInput = this.root.querySelector<HTMLInputElement>("#file-import");
    fileInput?.addEventListener("change", () => {
      const fileName = fileInput.files?.[0]?.name ?? "Chưa chọn file";
      const label = this.root.querySelector<HTMLElement>("[data-file-name]");
      if (label) {
        label.textContent = fileName;
      }
    });

    this.root.querySelector<HTMLButtonElement>("[data-import-file]")?.addEventListener("click", () => {
      void this.handleImport();
    });
    this.root.querySelector<HTMLButtonElement>("[data-load-reference]")?.addEventListener("click", () => {
      void this.handleLoadReference();
    });
    this.root.querySelector<HTMLButtonElement>("[data-template-csv]")?.addEventListener("click", () => {
      exportTemplateCsv();
    });
    this.root.querySelector<HTMLButtonElement>("[data-export-xlsx]")?.addEventListener("click", () => {
      void exportWorkbook(this.state);
    });
    this.root.querySelectorAll<HTMLButtonElement>("[data-export-csv]").forEach((button) => {
      button.addEventListener("click", () => exportCsv(this.state));
    });
    this.root.querySelector<HTMLButtonElement>("[data-export-json]")?.addEventListener("click", () => {
      exportJson(this.state);
    });
    this.root.querySelector<HTMLButtonElement>("[data-reset-app]")?.addEventListener("click", () => {
      void this.handleReset();
    });

    this.root.querySelectorAll<HTMLButtonElement>("[data-mock-set]").forEach((button) => {
      button.addEventListener("click", () => {
        this.selectedMockSetId = button.dataset.mockSet ?? HSK4_MOCK_SETS[0].id;
        this.render();
      });
    });

    this.root.querySelector<HTMLButtonElement>("[data-start-mock]")?.addEventListener("click", () => {
      this.mockExam = createMockExam(this.state.items, this.selectedMockSet());
      this.mockExamIndex = 0;
      this.activeView = "mock";
      this.render();
    });

    this.root.querySelector<HTMLButtonElement>("[data-reset-mock]")?.addEventListener("click", () => {
      this.mockExam = undefined;
      this.mockExamIndex = 0;
      this.render();
    });

    this.root.querySelector<HTMLButtonElement>("[data-submit-mock]")?.addEventListener("click", () => {
      if (!this.mockExam) {
        return;
      }
      const unanswered = this.mockExam.questions.length - Object.values(this.mockExam.answers).filter((answer) => answer.trim()).length;
      const confirmed =
        unanswered > 0
          ? window.confirm(`Còn ${unanswered} câu chưa trả lời. Bạn vẫn muốn kết thúc và chấm bài?`)
          : true;
      if (!confirmed) {
        return;
      }
      this.mockExam = { ...this.mockExam, submittedAt: Date.now() };
      this.render();
    });

    this.root.querySelector<HTMLButtonElement>("[data-exam-prev]")?.addEventListener("click", () => {
      this.mockExamIndex = Math.max(0, this.mockExamIndex - 1);
      this.render();
    });

    this.root.querySelector<HTMLButtonElement>("[data-exam-next]")?.addEventListener("click", () => {
      const lastIndex = Math.max(0, (this.mockExam?.questions.length ?? 1) - 1);
      this.mockExamIndex = Math.min(lastIndex, this.mockExamIndex + 1);
      this.render();
    });

    this.root.querySelectorAll<HTMLButtonElement>("[data-exam-answer]").forEach((button) => {
      button.addEventListener("click", () => {
        this.saveMockAnswer(button.dataset.examAnswer ?? "");
        this.render();
      });
    });

    this.root.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("[data-exam-text]").forEach((input) => {
      input.addEventListener("input", () => {
        this.saveMockAnswer(input.value);
      });
    });

    this.root.querySelectorAll<HTMLButtonElement>("[data-exam-fragment]").forEach((button) => {
      button.addEventListener("click", () => {
        const input = this.root.querySelector<HTMLInputElement>("[data-exam-text]");
        if (!input) {
          return;
        }
        const fragment = button.dataset.examFragment ?? "";
        input.value = `${input.value}${fragment}`;
        this.saveMockAnswer(input.value);
        input.focus();
      });
    });

    this.root.querySelector<HTMLButtonElement>("[data-exam-clear]")?.addEventListener("click", () => {
      this.saveMockAnswer("");
      this.render();
    });

    this.root.querySelectorAll<HTMLButtonElement>("[data-play-audio]").forEach((button) => {
      button.addEventListener("click", () => {
        this.speakChinese(button.dataset.playAudio ?? "");
      });
    });
  }

  private saveMockAnswer(answer: string): void {
    if (!this.mockExam) {
      return;
    }
    const question = this.mockExam.questions[this.mockExamIndex];
    if (!question) {
      return;
    }
    this.mockExam.answers[question.id] = answer;
  }

  private speakChinese(text: string): void {
    if (!text.trim() || !("speechSynthesis" in window)) {
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "zh-CN";
    utterance.rate = 0.82;
    utterance.pitch = 1;
    const voice = window.speechSynthesis
      .getVoices()
      .find((candidate) => candidate.lang.toLowerCase().startsWith("zh"));
    if (voice) {
      utterance.voice = voice;
    }
    window.speechSynthesis.speak(utterance);
  }

  private syncExamClock(): void {
    const running = this.activeView === "mock" && this.mockExam && !this.mockExam.submittedAt;
    if (!running && this.examClockId !== undefined) {
      window.clearInterval(this.examClockId);
      this.examClockId = undefined;
      return;
    }
    if (!running || this.examClockId !== undefined) {
      return;
    }
    this.examClockId = window.setInterval(() => {
      if (!this.mockExam || this.mockExam.submittedAt) {
        this.syncExamClock();
        return;
      }
      const remaining = this.examRemainingMs(this.mockExam);
      const clock = this.root.querySelector<HTMLElement>("[data-exam-clock] span");
      if (clock) {
        clock.textContent = formatExamTime(remaining);
      }
      if (remaining <= 0) {
        this.mockExam = { ...this.mockExam, submittedAt: Date.now() };
        this.render();
      }
    }, 1000);
  }

  private examRemainingMs(session: MockExamSession): number {
    return session.durationMinutes * 60_000 - (Date.now() - session.startedAt);
  }

  private async submitAnswer(): Promise<void> {
    const item = this.studyQueue[this.studyIndex];
    const input = this.root.querySelector<HTMLInputElement>("#hanzi-input");
    if (!item || !input || !input.value.trim()) {
      return;
    }

    const correct = isCorrectAnswer(input.value, item.hanzi);
    const attempt = createAttempt(
      item,
      input.value.trim(),
      correct,
      this.studyMode,
      Date.now() - this.cardStartedAt,
    );
    this.state.attempts = [attempt, ...this.state.attempts].slice(0, 5000);
    this.state.reviews = applyAttempt(this.state.reviews, attempt);
    this.feedback = { itemId: item.id, input: input.value.trim(), correct };
    await this.persist();
    this.render();
  }

  private async mountStrokeTrainer(): Promise<void> {
    if (this.activeView !== "study") {
      return;
    }
    const item = this.studyQueue[this.studyIndex];
    const target = this.root.querySelector<HTMLElement>("#stroke-target");
    if (!item || !target) {
      return;
    }

    const characters = extractHanziChars(item.hanzi);
    const character =
      characters[Math.min(this.strokeCharIndex, characters.length - 1)] ?? item.hanzi.charAt(0);
    if (!character) {
      return;
    }

    await this.strokeTrainer.mount(target, character, {
      onStatus: (status, message) => {
        const statusElement = this.root.querySelector<HTMLElement>("#stroke-status");
        if (statusElement) {
          statusElement.textContent = message;
          statusElement.dataset.status = status;
        }
      },
    });
  }

  private async handleStrokeAction(action: string): Promise<void> {
    if (action === "animate") {
      await this.strokeTrainer.animate();
    }
    if (action === "quiz") {
      await this.strokeTrainer.quiz();
    }
    if (action === "outline") {
      await this.strokeTrainer.outlineOnly();
    }
    if (action === "show") {
      await this.strokeTrainer.showAnswer();
    }
  }

  private async handleImport(): Promise<void> {
    const input = this.root.querySelector<HTMLInputElement>("#file-import");
    const file = input?.files?.[0];
    if (!file) {
      return;
    }
    const items = await importVocabFile(file);
    this.state.items = mergeItems(removeStarterItems(this.state.items), items);
    await this.persist();
    this.clearStudyQueue();
    this.render();
  }

  private async handleLoadReference(): Promise<void> {
    const items = await importStandardCourseReference();
    this.state.items = mergeItems(removeStarterItems(this.state.items), items);
    await this.persist();
    this.clearStudyQueue();
    this.render();
  }

  private async handleReset(): Promise<void> {
    const confirmed = window.confirm("Reset dữ liệu hiện tại và xóa log học trong trình duyệt này?");
    if (!confirmed) {
      return;
    }
    this.state = await resetState();
    this.clearStudyQueue();
    this.activeView = "dashboard";
    this.render();
  }

  private clearStudyQueue(): void {
    this.studyQueue = [];
    this.studyIndex = 0;
    this.strokeCharIndex = 0;
    this.cardStartedAt = Date.now();
    this.feedback = undefined;
  }

  private async persist(): Promise<void> {
    await saveState(this.state);
  }
}

export function mountHskApp(): void {
  const root = document.querySelector<HTMLElement>("#app");
  if (!root) {
    throw new Error("Không tìm thấy #app");
  }

  void new HskApp(root).init();
}
