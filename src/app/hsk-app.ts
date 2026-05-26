import type { HskAppDependencies } from "./app-dependencies";
import type { View } from "./app-types";
import { bindAppEvents } from "./events/app-event-binder";
import { registerServiceWorker } from "./service-worker";
import { MockExamWorkflow } from "./workflows/mock-exam-workflow";
import { applySettingInput } from "./workflows/settings-workflow";
import { StudyWorkflow } from "./workflows/study-workflow";
import { renderAppShell } from "./views/app-shell-view";
import { renderDashboardView } from "./views/dashboard-view";
import { getDataHealthStats, renderDataView } from "./views/data-view";
import { renderLessonsView, renderWrongView } from "./views/lesson-views";
import { renderMockExamIntro, renderMockExamResults, renderMockExamRunner } from "./views/mock-exam-view";
import { renderPlanView } from "./views/plan-view";
import { renderStudyView } from "./views/study-view";
import { submitStudyAnswer as applyStudyAnswer } from "../application/review/submit-study-answer";
import { replaceStarterVocabulary } from "../application/vocab/replace-vocabulary";
import type { AppState, StudyMode } from "../domain/types";
import { formatExamTime } from "../domain/exam/mock-exam";
import { computeStats } from "../domain/review/review-service";
import { icon } from "../presentation/icons";
import { animateSidebarToggleMotion, hydrateSidebarMotion, type SidebarMotionState } from "../presentation/motion";
import { clamp } from "../shared/number-utils";

const SIDEBAR_COLLAPSED_KEY = "hong-hsk4-sidebar-collapsed";

class HskApp {
  private state!: AppState;
  private activeView: View = "dashboard";
  private readonly study = new StudyWorkflow();
  private readonly mockExam = new MockExamWorkflow();
  private examClockId: number | undefined;
  private sidebarCollapsed = false;
  private sidebarMotionState: SidebarMotionState | undefined;

  constructor(
    private readonly root: HTMLElement,
    private readonly dependencies: HskAppDependencies,
  ) {}

  async init(): Promise<void> {
    this.state = await this.dependencies.stateStore.load();
    this.sidebarCollapsed = loadSidebarCollapsed();
    registerServiceWorker();
    this.render();
  }

  private render(): void {
    const stats = computeStats(this.state);
    const learnedPercent = stats.totalItems > 0 ? Math.min(100, Math.round((stats.learned / stats.totalItems) * 100)) : 0;
    const sidebarMotionState: SidebarMotionState = {
      activeView: this.activeView,
      sidebarCollapsed: this.sidebarCollapsed,
      learned: stats.learned,
      totalItems: stats.totalItems,
      learnedPercent,
      dueToday: stats.dueToday,
    };
    this.root.innerHTML = renderAppShell({
      activeView: this.activeView,
      sidebarCollapsed: this.sidebarCollapsed,
      state: this.state,
      stats,
      content: this.renderActiveView(),
    });
    this.bindEvents();
    void this.dependencies.strokePractice.mount(
      this.root,
      this.activeView === "study" ? this.study.currentItem() : undefined,
      this.study.strokeCharIndex,
    );
    this.syncExamClock();
    hydrateSidebarMotion(this.root, sidebarMotionState, this.sidebarMotionState);
    this.sidebarMotionState = sidebarMotionState;
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
    this.study.ensureQueue(this.state);
    return renderStudyView({
      state: this.state,
      studyMode: this.study.mode,
      studyQueue: this.study.queue,
      studyIndex: this.study.index,
      strokeCharIndex: this.study.strokeCharIndex,
      feedback: this.study.feedback,
    });
  }

  private renderMockExam(): string {
    if (!this.mockExam.session) {
      return renderMockExamIntro(getDataHealthStats(this.state), this.mockExam.selectedSet());
    }
    if (this.mockExam.session.submittedAt) {
      return renderMockExamResults(this.mockExam.session);
    }
    return renderMockExamRunner(this.mockExam.session, this.mockExam.index, this.mockExam.remainingMs());
  }

  private bindEvents(): void {
    bindAppEvents(this.root, {
      navigate: (view) => this.navigate(view),
      toggleSidebar: () => this.toggleSidebar(),
      startStudy: (mode) => this.startStudy(mode),
      selectLesson: (lesson) => this.selectLesson(lesson),
      submitAnswer: () => this.submitAnswer(),
      nextCard: () => this.nextCard(),
      revealAnswer: () => this.revealAnswer(),
      hideAnswer: () => this.hideAnswer(),
      selectStrokeChar: (index) => this.selectStrokeChar(index),
      runStrokeAction: (action) => this.dependencies.strokePractice.run(action),
      updateSetting: (input) => this.updateSetting(input),
      fileSelected: (fileName) => this.updateFileLabel(fileName),
      importFile: () => this.handleImport(),
      loadReference: () => this.handleLoadReference(),
      exportTemplateCsv: () => this.dependencies.dataExporter.exportTemplateCsv(),
      exportWorkbook: () => this.dependencies.dataExporter.exportWorkbook(this.state),
      exportCsv: () => this.dependencies.dataExporter.exportCsv(this.state),
      exportJson: () => this.dependencies.dataExporter.exportJson(this.state),
      resetApp: () => this.handleReset(),
      selectMockSet: (setId) => this.selectMockSet(setId),
      startMockExam: () => this.startMockExam(),
      resetMockExam: () => this.resetMockExam(),
      submitMockExam: () => this.submitMockExam(),
      previousExamQuestion: () => this.previousExamQuestion(),
      nextExamQuestion: () => this.nextExamQuestion(),
      chooseExamAnswer: (answer) => this.chooseExamAnswer(answer),
      saveExamAnswer: (answer) => this.mockExam.saveAnswer(answer),
      appendExamFragment: (currentValue, fragment) => this.mockExam.appendAnswerFragment(currentValue, fragment),
      clearExamAnswer: () => this.clearExamAnswer(),
      playAudio: (text) => this.dependencies.speechPlayer.play(text),
    });
  }

  private navigate(view: View): void {
    this.activeView = view;
    if (view !== "study") {
      this.study.clear();
    }
    this.render();
  }

  private toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
    this.applySidebarState();
    animateSidebarToggleMotion(this.root, this.sidebarCollapsed);
    if (this.sidebarMotionState) {
      this.sidebarMotionState = {
        ...this.sidebarMotionState,
        sidebarCollapsed: this.sidebarCollapsed,
      };
    }
    try {
      window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, this.sidebarCollapsed ? "1" : "0");
    } catch {
      // Ignore private-browsing/storage failures; the visual toggle still works for this render cycle.
    }
  }

  private applySidebarState(): void {
    const shell = this.root.querySelector<HTMLElement>(".app-shell");
    const toggle = this.root.querySelector<HTMLButtonElement>("[data-sidebar-toggle]");
    shell?.classList.toggle("sidebar-collapsed", this.sidebarCollapsed);
    if (!toggle) {
      return;
    }
    const label = this.sidebarCollapsed ? "Mở rộng sidebar" : "Thu gọn sidebar";
    toggle.setAttribute("aria-expanded", this.sidebarCollapsed ? "false" : "true");
    toggle.setAttribute("aria-label", label);
    toggle.title = this.sidebarCollapsed ? "Mở rộng" : "Thu gọn";
    toggle.innerHTML = icon(this.sidebarCollapsed ? "chevronRight" : "chevronLeft");
  }

  private startStudy(mode: StudyMode): void {
    this.study.start(mode);
    this.activeView = "study";
    this.render();
    this.focusHanziInput();
  }

  private async selectLesson(lesson: number): Promise<void> {
    this.state.settings.selectedLesson = clamp(lesson, 1, 20);
    await this.persist();
    this.render();
  }

  private nextCard(): void {
    this.study.nextCard();
    this.render();
    this.focusHanziInput();
  }

  private revealAnswer(): void {
    if (this.study.revealCurrentAnswer()) {
      this.render();
    }
  }

  private hideAnswer(): void {
    if (this.study.hideRevealedAnswer()) {
      this.render();
      this.focusHanziInput();
    }
  }

  private selectStrokeChar(index: number): void {
    this.study.selectStrokeChar(index);
    this.render();
  }

  private async updateSetting(input: HTMLInputElement | HTMLSelectElement): Promise<void> {
    applySettingInput(this.state.settings, input);
    await this.persist();
    this.render();
  }

  private updateFileLabel(fileName: string): void {
    const label = this.root.querySelector<HTMLElement>("[data-file-name]");
    if (label) {
      label.textContent = fileName;
    }
  }

  private selectMockSet(setId: string): void {
    this.mockExam.selectSet(setId);
    this.render();
  }

  private startMockExam(): void {
    this.mockExam.start(this.state.items);
    this.activeView = "mock";
    this.render();
  }

  private resetMockExam(): void {
    this.mockExam.reset();
    this.render();
  }

  private submitMockExam(): void {
    const unanswered = this.mockExam.unansweredCount();
    const confirmed =
      unanswered > 0
        ? window.confirm(`Còn ${unanswered} câu chưa trả lời. Bạn vẫn muốn kết thúc và chấm bài?`)
        : true;
    if (!confirmed) {
      return;
    }
    this.mockExam.submit();
    this.render();
  }

  private previousExamQuestion(): void {
    this.mockExam.previousQuestion();
    this.render();
  }

  private nextExamQuestion(): void {
    this.mockExam.nextQuestion();
    this.render();
  }

  private chooseExamAnswer(answer: string): void {
    this.mockExam.saveAnswer(answer);
    this.render();
  }

  private clearExamAnswer(): void {
    this.mockExam.saveAnswer("");
    this.render();
  }

  private syncExamClock(): void {
    const running = this.mockExam.isRunning(this.activeView);
    if (!running && this.examClockId !== undefined) {
      window.clearInterval(this.examClockId);
      this.examClockId = undefined;
      return;
    }
    if (!running || this.examClockId !== undefined) {
      return;
    }
    this.examClockId = window.setInterval(() => {
      if (!this.mockExam.session || this.mockExam.session.submittedAt) {
        this.syncExamClock();
        return;
      }
      const remaining = this.mockExam.remainingMs();
      const clock = this.root.querySelector<HTMLElement>("[data-exam-clock] span");
      if (clock) {
        clock.textContent = formatExamTime(remaining);
      }
      if (remaining <= 0) {
        this.mockExam.submit();
        this.render();
      }
    }, 1000);
  }

  private async submitAnswer(): Promise<void> {
    const item = this.study.currentItem();
    const input = this.root.querySelector<HTMLInputElement>("#hanzi-input");
    if (!item || !input || !input.value.trim()) {
      return;
    }

    const result = applyStudyAnswer(this.state, item, input.value, this.study.mode, this.study.cardLatencyMs());
    if (!result) {
      return;
    }
    this.state = result.state;
    this.study.recordFeedback(result.itemId, result.input, result.correct);
    await this.persist();
    this.render();
  }

  private async handleImport(): Promise<void> {
    const input = this.root.querySelector<HTMLInputElement>("#file-import");
    const file = input?.files?.[0];
    if (!file) {
      return;
    }
    const items = await this.dependencies.vocabularyImporter.importFile(file);
    this.state = replaceStarterVocabulary(this.state, items);
    await this.persist();
    this.resetLearningWorkflows();
    this.render();
  }

  private async handleLoadReference(): Promise<void> {
    const items = await this.dependencies.vocabularyImporter.loadReference();
    this.state = replaceStarterVocabulary(this.state, items);
    await this.persist();
    this.resetLearningWorkflows();
    this.render();
  }

  private async handleReset(): Promise<void> {
    const confirmed = window.confirm("Reset dữ liệu hiện tại và xóa log học trong trình duyệt này?");
    if (!confirmed) {
      return;
    }
    this.state = await this.dependencies.stateStore.reset();
    this.resetLearningWorkflows();
    this.activeView = "dashboard";
    this.render();
  }

  private resetLearningWorkflows(): void {
    this.study.clear();
    this.mockExam.reset();
  }

  private focusHanziInput(): void {
    queueMicrotask(() => this.root.querySelector<HTMLInputElement>("#hanzi-input")?.focus());
  }

  private async persist(): Promise<void> {
    await this.dependencies.stateStore.save(this.state);
  }
}

export function mountHskApp(dependencies: HskAppDependencies): void {
  const root = document.querySelector<HTMLElement>("#app");
  if (!root) {
    throw new Error("Không tìm thấy #app");
  }

  void new HskApp(root, dependencies).init();
}

function loadSidebarCollapsed(): boolean {
  try {
    const stored = window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    if (stored !== null) {
      return stored === "1";
    }
    return window.matchMedia("(min-width: 821px) and (max-width: 1180px)").matches;
  } catch {
    return false;
  }
}
