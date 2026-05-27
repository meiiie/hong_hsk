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
import { renderLessonsView, renderWrongView, type LessonListeningViewState } from "./views/lesson-views";
import { renderMockExamIntro, renderMockExamResults, renderMockExamRunner } from "./views/mock-exam-view";
import { renderPlanView } from "./views/plan-view";
import { renderSettingsView } from "./views/settings-view";
import { renderStudyView } from "./views/study-view";
import { submitStudyAnswer as applyStudyAnswer } from "../application/review/submit-study-answer";
import { replaceStarterVocabulary } from "../application/vocab/replace-vocabulary";
import type { AppState, StudyMode } from "../domain/types";
import { formatExamTime } from "../domain/exam/mock-exam";
import { extractBlcupAudioUrl, findLessonListeningTrack } from "../domain/hsk4/lesson-listening";
import { computeStats } from "../domain/review/review-service";
import { icon } from "../presentation/icons";
import {
  animateSidebarToggleMotion,
  hydrateSidebarMotion,
  hydrateStudyMotion,
  type SidebarMotionState,
  type StudyFeedbackKind,
  type StudyMotionState,
} from "../presentation/motion";
import { clamp } from "../shared/number-utils";

const SIDEBAR_COLLAPSED_KEY = "hong-hsk4-sidebar-collapsed";
const LESSON_TRANSCRIPTS_KEY = "hong-hsk4-lesson-transcripts-v1";
const LESSON_AUDIO_RATES = [0.75, 1, 1.25] as const;

class HskApp {
  private state!: AppState;
  private activeView: View = "dashboard";
  private readonly study = new StudyWorkflow();
  private readonly mockExam = new MockExamWorkflow();
  private readonly lessonAudioCache = new Map<string, string>();
  private examClockId: number | undefined;
  private sidebarCollapsed = false;
  private sidebarMotionState: SidebarMotionState | undefined;
  private mobileMoreOpen = false;
  private accountMenuOpen = false;
  private studyMotionState: StudyMotionState | undefined;
  private lessonAudio: LessonListeningViewState = {
    playbackRate: 1,
    transcripts: {},
  };

  constructor(
    private readonly root: HTMLElement,
    private readonly dependencies: HskAppDependencies,
  ) {}

  async init(): Promise<void> {
    this.state = await this.dependencies.stateStore.load();
    this.sidebarCollapsed = loadSidebarCollapsed();
    this.lessonAudio.transcripts = loadLessonTranscripts();
    registerServiceWorker();
    this.render();
  }

  private render(): void {
    const stats = computeStats(this.state);
    const learnedPercent = stats.totalItems > 0 ? Math.min(100, Math.round((stats.learned / stats.totalItems) * 100)) : 0;
    const sidebarMotionState: SidebarMotionState = {
      activeView: this.activeView,
      sidebarCollapsed: this.sidebarCollapsed,
      mobileMoreOpen: this.mobileMoreOpen,
      learned: stats.learned,
      totalItems: stats.totalItems,
      learnedPercent,
      dueToday: stats.dueToday,
    };
    const content = this.renderActiveView();
    const studyMotionState = this.createStudyMotionState();
    this.root.innerHTML = renderAppShell({
      activeView: this.activeView,
      sidebarCollapsed: this.sidebarCollapsed,
      mobileMoreOpen: this.mobileMoreOpen,
      accountMenuOpen: this.accountMenuOpen,
      state: this.state,
      stats,
      content,
    });
    this.bindEvents();
    void this.dependencies.strokePractice.mount(
      this.root,
      this.activeView === "study" ? this.study.currentItem() : undefined,
      this.study.strokeCharIndex,
    );
    this.syncExamClock();
    hydrateSidebarMotion(this.root, sidebarMotionState, this.sidebarMotionState);
    hydrateStudyMotion(this.root, studyMotionState, this.studyMotionState);
    this.sidebarMotionState = sidebarMotionState;
    this.studyMotionState = studyMotionState;
  }

  private createStudyMotionState(): StudyMotionState {
    const item = this.activeView === "study" ? this.study.currentItem() : undefined;
    const feedback = item && this.study.feedback?.itemId === item.id ? this.study.feedback : undefined;
    const feedbackKind: StudyFeedbackKind = !feedback ? "none" : feedback.revealed ? "revealed" : feedback.correct ? "correct" : "wrong";

    return {
      activeView: this.activeView,
      itemId: item?.id,
      feedbackKind,
      strokeUnlocked: feedbackKind !== "none",
    };
  }

  private renderActiveView(): string {
    if (this.activeView === "study") {
      return this.renderStudy();
    }
    if (this.activeView === "lessons") {
      return renderLessonsView(this.state, this.lessonAudio);
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
    if (this.activeView === "settings") {
      return renderSettingsView(this.state);
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
      toggleAccountMenu: () => this.toggleAccountMenu(),
      closeAccountMenu: () => this.closeAccountMenu(),
      toggleMobileMore: () => this.toggleMobileMore(),
      closeMobileMore: () => this.closeMobileMore(),
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
      playLessonAudio: (trackId) => this.handleLessonAudio(trackId),
      toggleLessonTranscript: (trackId) => this.toggleLessonTranscript(trackId),
      setLessonAudioSpeed: (rate) => this.setLessonAudioSpeed(rate),
      saveLessonTranscript: (trackId, transcript) => this.saveLessonTranscript(trackId, transcript),
    });
  }

  private navigate(view: View): void {
    this.activeView = view;
    this.mobileMoreOpen = false;
    this.accountMenuOpen = false;
    if (view !== "study") {
      this.study.clear();
    }
    this.render();
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  private toggleMobileMore(): void {
    this.mobileMoreOpen = !this.mobileMoreOpen;
    this.accountMenuOpen = false;
    this.render();
  }

  private toggleAccountMenu(): void {
    this.accountMenuOpen = !this.accountMenuOpen;
    this.mobileMoreOpen = false;
    this.render();
  }

  private closeAccountMenu(): void {
    if (!this.accountMenuOpen) {
      return;
    }
    this.accountMenuOpen = false;
    this.render();
  }

  private closeMobileMore(): void {
    if (!this.mobileMoreOpen) {
      return;
    }
    this.mobileMoreOpen = false;
    this.render();
  }

  private toggleSidebar(): void {
    this.accountMenuOpen = false;
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
    this.mobileMoreOpen = false;
    this.accountMenuOpen = false;
    this.render();
    this.focusHanziInput();
  }

  private async selectLesson(lesson: number): Promise<void> {
    this.state.settings.selectedLesson = clamp(lesson, 1, 20);
    this.lessonAudio = {
      playbackRate: this.lessonAudio.playbackRate,
      transcripts: this.lessonAudio.transcripts,
    };
    await this.persist();
    this.render();
  }

  private async handleLessonAudio(trackId: string): Promise<void> {
    const track = findLessonListeningTrack(trackId);
    if (!track) {
      return;
    }

    this.lessonAudio = {
      ...this.lessonAudio,
      trackId,
      audioUrl: undefined,
      loadingTrackId: trackId,
      error: undefined,
    };
    this.render();

    try {
      const audioUrl = await this.resolveLessonAudioUrl(track.viewUrl);
      if (this.lessonAudio.trackId !== trackId) {
        return;
      }
      this.lessonAudio = {
        ...this.lessonAudio,
        trackId,
        audioUrl,
        loadingTrackId: undefined,
        error: undefined,
      };
      this.render();
      queueMicrotask(() => this.playLessonAudioElement(trackId));
    } catch (error) {
      if (this.lessonAudio.trackId !== trackId) {
        return;
      }
      this.lessonAudio = {
        ...this.lessonAudio,
        loadingTrackId: undefined,
        error: error instanceof Error ? error.message : "Không mở được audio bài khóa.",
      };
      this.render();
    }
  }

  private async resolveLessonAudioUrl(viewUrl: string): Promise<string> {
    const cached = this.lessonAudioCache.get(viewUrl);
    if (cached) {
      return cached;
    }

    const response = await fetch(viewUrl);
    if (!response.ok) {
      throw new Error("Chưa lấy được audio từ nguồn BLCUP.");
    }

    const audioUrl = extractBlcupAudioUrl(await response.text());
    if (!audioUrl) {
      throw new Error("Nguồn BLCUP chưa trả về đường dẫn audio hợp lệ.");
    }

    this.lessonAudioCache.set(viewUrl, audioUrl);
    return audioUrl;
  }

  private playLessonAudioElement(trackId: string): void {
    const selector = `audio[data-lesson-audio-player="${CSS.escape(trackId)}"]`;
    const player = this.root.querySelector<HTMLAudioElement>(selector);
    if (!player) {
      return;
    }
    player.playbackRate = this.lessonAudio.playbackRate;
    void player.play().catch(() => {
      if (this.lessonAudio.trackId !== trackId) {
        return;
      }
      this.lessonAudio = {
        ...this.lessonAudio,
        error: "Trình duyệt chặn tự phát. Bấm play trong thanh nghe để bắt đầu.",
      };
      this.render();
    });
  }

  private toggleLessonTranscript(trackId: string): void {
    this.lessonAudio = {
      ...this.lessonAudio,
      transcriptTrackId: this.lessonAudio.transcriptTrackId === trackId ? undefined : trackId,
    };
    this.render();
  }

  private setLessonAudioSpeed(rate: number): void {
    if (!LESSON_AUDIO_RATES.includes(rate as (typeof LESSON_AUDIO_RATES)[number])) {
      return;
    }
    this.lessonAudio.playbackRate = rate;
    this.root.querySelectorAll<HTMLButtonElement>("[data-lesson-audio-speed]").forEach((button) => {
      const active = Number(button.dataset.lessonAudioSpeed) === rate;
      button.classList.toggle("active", active);
    });
    const player = this.root.querySelector<HTMLAudioElement>("[data-lesson-audio-player]");
    if (player) {
      player.playbackRate = rate;
    }
  }

  private saveLessonTranscript(trackId: string, transcript: string): void {
    const transcripts = { ...this.lessonAudio.transcripts };
    const cleanTranscript = transcript.trim();
    if (cleanTranscript) {
      transcripts[trackId] = cleanTranscript;
    } else {
      delete transcripts[trackId];
    }
    this.lessonAudio = {
      ...this.lessonAudio,
      transcriptTrackId: trackId,
      transcripts,
    };
    saveLessonTranscripts(transcripts);
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

function loadLessonTranscripts(): Record<string, string> {
  try {
    const stored = window.localStorage.getItem(LESSON_TRANSCRIPTS_KEY);
    if (!stored) {
      return {};
    }
    const parsed = JSON.parse(stored) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }
    return Object.fromEntries(
      Object.entries(parsed).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
    );
  } catch {
    return {};
  }
}

function saveLessonTranscripts(transcripts: Record<string, string>): void {
  try {
    window.localStorage.setItem(LESSON_TRANSCRIPTS_KEY, JSON.stringify(transcripts));
  } catch {
    // Transcript notes are helpful, but the core review app should still work when storage is unavailable.
  }
}
