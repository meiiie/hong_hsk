import type { HskAppDependencies } from "./app-dependencies";
import type { View } from "./app-types";
import { bindAppEvents } from "./events/app-event-binder";
import { registerServiceWorker } from "./service-worker";
import type { AiTutorAction } from "../application/ports/ai-tutor-client";
import { MockExamWorkflow } from "./workflows/mock-exam-workflow";
import {
  AiTutorWorkflow,
  aiTutorUserPrompt,
  buildAiTutorMemoryMarkdown,
  buildAiTutorRequest,
} from "./workflows/ai-tutor-workflow";
import { applySettingInput } from "./workflows/settings-workflow";
import { StudyWorkflow } from "./workflows/study-workflow";
import { registerHskWebMcpTools } from "./webmcp/hsk-webmcp";
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
import type { AppVersionCheck } from "../application/ports/app-version-checker";
import type { AppState, StudyMode } from "../domain/types";
import { formatExamTime } from "../domain/exam/mock-exam";
import { findLessonListeningTrack } from "../domain/hsk4/lesson-listening";
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
  private readonly aiTutor = new AiTutorWorkflow();
  private readonly mockExam = new MockExamWorkflow();
  private examClockId: number | undefined;
  private sidebarCollapsed = false;
  private sidebarMotionState: SidebarMotionState | undefined;
  private mobileMoreOpen = false;
  private accountMenuOpen = false;
  private aiTutorAbort: AbortController | undefined;
  private studyMotionState: StudyMotionState | undefined;
  private versionCheck: AppVersionCheck | undefined;
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
    this.versionCheck = {
      status: "checking",
      current: this.dependencies.versionChecker.current(),
    };
    registerServiceWorker();
    this.render();
    void this.refreshVersionStatus();
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
      versionCheck: this.versionCheck,
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
    registerHskWebMcpTools(
      {
        navigate: (view) => this.navigate(view),
        startStudy: (mode) => this.startStudy(mode),
        askAiTutor: (action, question) => this.askAiTutor(action, question),
      },
      {
        activeView: this.activeView,
        currentItem: this.createWebMcpCurrentItem(),
        aiUnlocked: Boolean(this.study.feedback && this.activeView === "study"),
        dueToday: stats.dueToday,
        wrongOpen: stats.wrongOpen,
        selectedLesson: this.state.settings.selectedLesson,
      },
    );
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
      aiUnlocked: feedbackKind !== "none",
      aiStatus: this.aiTutor.stateForItem(item?.id).status,
    };
  }

  private createWebMcpCurrentItem() {
    if (this.activeView !== "study") {
      return undefined;
    }

    const item = this.study.currentItem();
    if (!item) {
      return undefined;
    }

    return {
      id: item.id,
      hanzi: item.hanzi,
      pinyin: item.pinyin,
      meaningVi: item.meaningVi,
      book: item.book,
      lesson: item.lesson,
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
      return renderSettingsView(this.state, this.versionCheck);
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
      aiTutor: this.aiTutor.stateForItem(this.study.currentItem()?.id),
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
      askAiTutor: (action, question) => this.askAiTutor(action, question),
      cancelAiTutor: () => this.cancelAiTutor(),
      clearAiTutorSession: () => this.clearAiTutorSession(),
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
      checkAppVersion: () => this.refreshVersionStatus(true),
      reloadApp: () => this.reloadApp(),
    });
  }

  private navigate(view: View): void {
    if (view !== "study") {
      this.cancelAiTutor();
    }
    this.activeView = view;
    this.mobileMoreOpen = false;
    this.accountMenuOpen = false;
    if (view !== "study") {
      this.study.clear();
      this.aiTutor.reset();
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
    this.cancelAiTutor();
    this.study.start(mode);
    this.aiTutor.reset();
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
      audioUrl: track.audioUrl,
      loadingTrackId: undefined,
      error: undefined,
    };
    this.render();
    queueMicrotask(() => this.playLessonAudioElement(trackId));
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
        error: "Trình duyệt chặn tự phát hoặc nguồn nghe tạm lỗi. Bấm play trong thanh nghe, hoặc mở Nguồn để kiểm tra.",
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

  private async refreshVersionStatus(forceRender = false): Promise<void> {
    if (forceRender) {
      this.versionCheck = {
        status: "checking",
        current: this.dependencies.versionChecker.current(),
        latest: this.versionCheck?.latest,
      };
      this.render();
    }

    this.versionCheck = await this.dependencies.versionChecker.check();
    this.render();
  }

  private reloadApp(): void {
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.getRegistration().then((registration) => {
        registration?.waiting?.postMessage({ type: "SKIP_WAITING" });
        return registration?.update();
      }).finally(() => {
        window.location.reload();
      });
      return;
    }

    window.location.reload();
  }

  private nextCard(): void {
    this.cancelAiTutor();
    this.study.nextCard();
    this.render();
    this.focusHanziInput();
  }

  private async askAiTutor(action: AiTutorAction, question?: string): Promise<void> {
    const item = this.study.currentItem();
    const feedback =
      item && this.study.feedback?.itemId === item.id
        ? this.study.feedback
        : undefined;
    if (!item || !feedback) {
      return;
    }

    this.cancelAiTutor();
    const userPrompt = aiTutorUserPrompt(action, item, question);
    const assistantMessageId = this.aiTutor.startTurn(item.id, action, userPrompt, question);
    this.render();

    try {
      const memoryMarkdown = buildAiTutorMemoryMarkdown(this.state, item, this.study.mode);
      const request = buildAiTutorRequest(
        this.state,
        item,
        this.study.mode,
        action,
        feedback,
        question,
        this.aiTutor.sessionId(),
        this.aiTutor.requestMessages(),
        memoryMarkdown,
        true,
      );
      const abort = new AbortController();
      this.aiTutorAbort = abort;
      let pendingDelta = "";
      let deltaFrame = 0;
      const flushDelta = () => {
        deltaFrame = 0;
        if (!pendingDelta) {
          return;
        }
        const delta = pendingDelta;
        pendingDelta = "";
        this.aiTutor.appendDelta(assistantMessageId, delta);
        this.patchAiTutorMessage(assistantMessageId);
      };
      const scheduleDelta = (delta: string) => {
        pendingDelta += delta;
        if (deltaFrame) {
          return;
        }
        deltaFrame = window.requestAnimationFrame(flushDelta);
      };
      const response = this.dependencies.aiTutorClient.stream
        ? await this.dependencies.aiTutorClient.stream(
            request,
            {
              onStatus: (message) => {
                this.aiTutor.setStatusNote(message);
                this.patchAiTutorStatus(message);
              },
              onDelta: (delta) => {
                scheduleDelta(delta);
              },
              onError: (error) => {
                flushDelta();
                this.aiTutor.fail(error);
                this.render();
              },
            },
            abort.signal,
          )
        : await this.dependencies.aiTutorClient.ask({ ...request, stream: false });
      if (deltaFrame) {
        window.cancelAnimationFrame(deltaFrame);
      }
      flushDelta();
      if (this.study.currentItem()?.id !== item.id) {
        return;
      }
      this.aiTutor.complete(response);
    } catch (error) {
      if (this.study.currentItem()?.id !== item.id) {
        return;
      }
      this.aiTutor.fail(error instanceof Error ? error.message : "AI tạm thời chưa phản hồi.");
    } finally {
      this.aiTutorAbort = undefined;
    }
    this.render();
  }

  private cancelAiTutor(): void {
    this.aiTutorAbort?.abort();
    this.aiTutorAbort = undefined;
  }

  private clearAiTutorSession(): void {
    this.cancelAiTutor();
    this.aiTutor.clearSession();
    this.render();
  }

  private patchAiTutorStatus(message: string): void {
    const target = this.root.querySelector<HTMLElement>("[data-ai-status-note]");
    if (target) {
      target.textContent = message;
    }
  }

  private patchAiTutorMessage(messageId: string): void {
    const target = this.root.querySelector<HTMLElement>(`[data-ai-message-content="${CSS.escape(messageId)}"]`);
    const message = this.aiTutor
      .stateForItem(this.study.currentItem()?.id)
      .messages?.find((candidate) => candidate.id === messageId);
    if (!target || !message) {
      return;
    }
    target.innerHTML = this.formatStreamingAiContent(message.content);
    const messages = this.root.querySelector<HTMLElement>("[data-ai-messages]");
    if (messages) {
      messages.scrollTop = messages.scrollHeight;
    }
  }

  private formatStreamingAiContent(content: string): string {
    return content
      .trim()
      .split(/\n{2,}/)
      .filter(Boolean)
      .map((paragraph) => `<p>${escapeAiHtml(paragraph).replace(/\n/g, "<br>")}</p>`)
      .join("");
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

function escapeAiHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
