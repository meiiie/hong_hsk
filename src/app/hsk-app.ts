import "../presentation/styles.css";
import type { AppState, ReviewStatus, StudyMode, VocabItem } from "../domain/types";
import { addDays, formatDateVi, toDateKey } from "../shared/date-utils";
import {
  exportCsv,
  exportJson,
  exportTemplateCsv,
  exportWorkbook,
  importStandardCourseReference,
  importVocabFile,
  mergeItems,
} from "../infrastructure/import-export/workbook-io";
import {
  applyAttempt,
  computeStats,
  createAttempt,
  dueItems,
  isCorrectAnswer,
  newItemsForLesson,
  progressForLesson,
  queueForMode,
  wrongItems,
} from "../domain/review/review-service";
import { LESSON_TITLES } from "../application/bootstrap/initial-state";
import { loadState, resetState, saveState } from "../infrastructure/storage/indexeddb-state-store";
import { HanziStrokeTrainer } from "../infrastructure/hanzi/hanzi-stroke-trainer";
import { icon, labelWithIcon, type IconName } from "../presentation/icons";
import { bookLabel, reviewStatusLabel, studyModeLabel } from "../presentation/i18n";
import { HSK4_REVIEW_POLICY } from "../domain/review/review-policy";
import { countDraftVietnameseMeanings, isDraftVietnameseMeaning } from "../application/vocab/data-enrichment";
import { HSK4_EXCEL_SOURCE } from "../domain/hsk4/hsk4-excel-vocab";
import { HSK4_TARGETS } from "../domain/hsk4/hsk4-targets";
import {
  HSK4_MOCK_BLUEPRINT,
  HSK4_MOCK_SPEC,
  HSK4_MOCK_SETS,
  createMockExam,
  formatExamTime,
  scoreMockExam,
  type MockExamSet,
  type MockExamQuestion,
  type MockExamSession,
} from "../domain/exam/mock-exam";

type View = "dashboard" | "study" | "lessons" | "wrong" | "mock" | "plan" | "data";

interface DataHealth {
  total: number;
  courseItems: number;
  missingVi: number;
  missingExamples: number;
  draftVi: number;
  courseReady: boolean;
  examReady: boolean;
  qualityReady: boolean;
}

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
  private feedback:
    | {
        itemId: string;
        input: string;
        correct: boolean;
        revealed?: boolean;
      }
    | undefined;

  constructor(private readonly root: HTMLElement) {}

  async init(): Promise<void> {
    this.state = await loadState();
    registerServiceWorker();
    this.render();
  }

  private render(): void {
    const stats = computeStats(this.state);
    this.root.innerHTML = `
      <div class="app-shell">
        <aside class="sidebar">
          <div class="brand">
            <div class="brand-mark">红</div>
            <div>
              <strong>Hồng HSK4 Studio</strong>
              <span>Luyện Hán tự 4A/4B</span>
            </div>
          </div>
          <nav class="nav" aria-label="Điều hướng">
            ${this.navButton("dashboard", "Tổng quan", "layout")}
            ${this.navButton("study", "Học hôm nay", "keyboard")}
            ${this.navButton("lessons", "Theo bài", "book")}
            ${this.navButton("wrong", "Từ sai", "rotate")}
            ${this.navButton("mock", "Thi thử", "clipboardList")}
            ${this.navButton("plan", "Lịch 30 ngày", "calendar")}
            ${this.navButton("data", "Dữ liệu", "database")}
          </nav>
          <div class="sidebar-card">
            <span>Ngày ${stats.planDay}/30</span>
            <strong>${stats.learned}/${stats.totalItems}</strong>
            <small>từ đã chạm ít nhất một lần</small>
          </div>
        </aside>
        <main class="main view-${this.activeView}">
          <header class="topbar">
            <div>
              <h1>${this.titleForView()}</h1>
            </div>
            <div class="top-actions">
              <button class="ghost-button" data-study-mode="today">${labelWithIcon("playCircle", "Bắt đầu ôn")}</button>
              <button class="primary-button" data-view="data">${labelWithIcon("upload", "Nhập Excel")}</button>
              <label class="language-switcher">
                <span>Ngôn ngữ</span>
                <select data-setting="locale" aria-label="Ngôn ngữ giao diện">
                  <option value="vi" ${this.state.settings.locale === "vi" ? "selected" : ""}>Tiếng Việt</option>
                  <option value="en" ${this.state.settings.locale === "en" ? "selected" : ""}>English</option>
                </select>
              </label>
            </div>
          </header>
          ${this.renderActiveView()}
        </main>
      </div>
    `;
    this.bindEvents();
    void this.mountStrokeTrainer();
    this.syncExamClock();
  }

  private navButton(view: View, label: string, iconName: IconName): string {
    return `
      <button class="${this.activeView === view ? "active" : ""}" data-view="${view}">
        ${icon(iconName)}
        <span>${escapeHtml(label)}</span>
      </button>
    `;
  }

  private titleForView(): string {
    const titles: Record<View, string> = {
      dashboard: "Tổng quan hôm nay",
      study: "Học hôm nay",
      lessons: "Theo bài",
      wrong: "Từ cần sửa",
      mock: "Thi thử HSK4",
      plan: "Lịch ôn 30 ngày",
      data: "Dữ liệu học",
    };
    return titles[this.activeView];
  }

  private renderActiveView(): string {
    if (this.activeView === "study") {
      return this.renderStudy();
    }
    if (this.activeView === "lessons") {
      return this.renderLessons();
    }
    if (this.activeView === "wrong") {
      return this.renderWrong();
    }
    if (this.activeView === "mock") {
      return this.renderMockExam();
    }
    if (this.activeView === "plan") {
      return this.renderPlan();
    }
    if (this.activeView === "data") {
      return this.renderData();
    }
    return this.renderDashboard();
  }

  private renderDashboard(): string {
    const stats = computeStats(this.state);
    const todayLesson = Math.min(20, stats.planDay);
    const newCards = newItemsForLesson(this.state, todayLesson);
    const due = dueItems(this.state);
    const wrong = wrongItems(this.state);
    const dataHealth = this.dataHealthStats();
    const learnedProgress = percent(stats.learned, stats.totalItems);
    const planProgress = percent(Math.min(stats.planDay, 30), 30);
    const meaningQualityGaps = dataHealth.missingVi + dataHealth.draftVi;

    return `
      ${this.renderReadinessBanner(dataHealth)}

      <section class="metrics-grid">
        ${metric("Bộ 4A/4B", `${Math.min(dataHealth.courseItems, HSK4_TARGETS.standardCourse4ReferenceItems)}/${HSK4_TARGETS.standardCourse4ReferenceItems}`, "Khung theo giáo trình chuẩn Thượng/Hạ")}
        ${metric("Chuẩn thi HSK4 cũ", `${stats.totalItems}/${HSK4_TARGETS.oldExamCumulativeWords}`, "Mục tiêu thi là 1.200 từ tích lũy")}
        ${metric("Cần duyệt nghĩa", meaningQualityGaps.toString(), "Thiếu nghĩa hoặc còn nghĩa nháp")}
        ${metric("Đến hạn hôm nay", stats.dueToday.toString(), "Ưu tiên ôn trước từ mới")}
        ${metric("Đang sai", stats.wrongOpen.toString(), "Sẽ được kéo vào vòng ôn gần")}
        ${metric("Độ chính xác", `${stats.accuracy}%`, "Tính theo log đã chấm")}
      </section>

      <section class="progress-strip" aria-label="Tiến độ ôn tập">
        <div>
          <span>Tiến độ từ vựng</span>
          <strong>${stats.learned}/${stats.totalItems}</strong>
          <div class="progress-track"><span style="width: ${learnedProgress}%"></span></div>
        </div>
        <div>
          <span>Lộ trình 30 ngày</span>
          <strong>Ngày ${stats.planDay}</strong>
          <div class="progress-track"><span style="width: ${planProgress}%"></span></div>
        </div>
        <div>
          <span>Ưu tiên trước khi học mới</span>
          <strong>${due.length + wrong.length}</strong>
          <small>từ đến hạn hoặc vừa sai</small>
        </div>
      </section>

      <section class="workbench">
        <article class="focus-panel">
          <div class="section-title">
            <p class="eyebrow">Hôm nay</p>
            <h2>Bài ${todayLesson}: ${escapeHtml(LESSON_TITLES[todayLesson] ?? "")}</h2>
          </div>
          <p class="lead">
            Quy trình khuyến nghị: ôn từ đến hạn, xử lý từ sai hôm qua, rồi mới học từ mới của bài hôm nay.
            Mỗi đáp án đều được lưu vào log để ngày sau app tự gọi lại.
          </p>
          <div class="today-checklist" aria-label="Thứ tự học hôm nay">
            ${this.todayChecklist(due.length, wrong.length, newCards.length)}
          </div>
          <div class="action-row">
            <button class="primary-button" data-study-mode="today">${labelWithIcon("calendarCheck", "Ôn theo lịch hôm nay")}</button>
            <button class="ghost-button" data-study-mode="wrong">${labelWithIcon("rotate", "Ôn từ sai")}</button>
            <button class="ghost-button" data-study-mode="lesson">${labelWithIcon("book", "Học bài đang chọn")}</button>
          </div>
        </article>

        <article class="queue-panel">
          <h3>Hàng đợi</h3>
          ${queuePreview("Đến hạn", due, "Chưa có từ đến hạn. Hãy học bài mới trước.")}
          ${queuePreview("Từ sai", wrong, "Chưa có từ sai mở.")}
          ${queuePreview("Từ mới bài hôm nay", newCards, "Bài hôm nay đã hết từ mới hoặc chưa có dữ liệu.")}
        </article>
      </section>
    `;
  }

  private renderReadinessBanner(health: DataHealth): string {
    const ready = health.examReady && health.qualityReady;
    const statusClass = ready ? "ready" : "needs-work";
    let title = "Dữ liệu đã sẵn sàng để ôn thi HSK4";
    let message = "Bộ từ đã đạt mốc 1.200 từ tích lũy và không còn nghĩa Việt nháp/thiếu nghĩa. Bạn có thể tập trung vào lịch ôn.";

    if (!health.qualityReady) {
      title = "Chưa đạt chất lượng dữ liệu cuối cùng";
      message = `${health.missingVi} từ thiếu nghĩa Việt, ${health.draftVi} nghĩa Việt còn là bản nháp cần duyệt. App sẽ không coi bộ này là sẵn sàng cho học thật cho tới khi nghĩa được kiểm chứng.`;
    } else if (!health.courseReady) {
      title = "Chưa đủ bộ từ theo giáo trình chuẩn 4A/4B";
      message = `${health.courseItems}/${HSK4_TARGETS.standardCourse4ReferenceItems} mục 4A/4B hiện có. Nên nạp đủ bộ Bài 1-20 trước khi chạy lịch 30 ngày theo bài khóa.`;
    } else if (!health.examReady) {
      title = "Đủ khung 4A/4B, nhưng chưa đủ chuẩn thi HSK4 cũ";
      message = `Bộ hiện tại mới đạt ${health.total}/${HSK4_TARGETS.oldExamCumulativeWords} từ so với mục tiêu HSK4 cũ 1.200 từ tích lũy. Nếu nền HSK1-3 chưa chắc, cần bổ sung khoảng ${HSK4_TARGETS.foundationHsk1To3Words} từ nền để ôn thi nghiêm túc.`;
    }

    return `
      <section class="readiness-banner ${statusClass}">
        <div class="banner-icon">${icon(ready ? "check" : "alert")}</div>
        <div>
          <strong>${escapeHtml(title)}</strong>
          <p>${escapeHtml(message)}</p>
        </div>
        <button class="${ready ? "ghost-button" : "primary-button"}" data-view="data">
          ${labelWithIcon("upload", ready ? "Kiểm tra dữ liệu" : "Nhập dữ liệu")}
        </button>
      </section>
    `;
  }

  private todayChecklist(dueCount: number, wrongCount: number, newCount: number): string {
    const rows = [
      {
        iconName: "calendarCheck" as const,
        title: "Ôn từ đến hạn",
        value: `${dueCount} thẻ`,
        detail: "Làm trước để giữ nhịp spaced repetition.",
      },
      {
        iconName: "rotate" as const,
        title: "Sửa từ sai gần nhất",
        value: `${wrongCount} thẻ`,
        detail: "Từ sai được kéo lên sớm để tránh quên dai.",
      },
      {
        iconName: "book" as const,
        title: "Học từ mới theo bài khóa",
        value: `${newCount} thẻ`,
        detail: "Giữ đúng thứ tự bài 1-20 của quyển Thượng/Hạ.",
      },
    ];

    return rows
      .map(
        (row, index) => `
          <div class="checklist-row">
            <span class="check-index">${index + 1}</span>
            ${icon(row.iconName)}
            <div>
              <strong>${escapeHtml(row.title)}</strong>
              <small>${escapeHtml(row.detail)}</small>
            </div>
            <b>${escapeHtml(row.value)}</b>
          </div>
        `,
      )
      .join("");
  }

  private renderStudy(): string {
    if (!this.studyQueue.length) {
      this.studyQueue = queueForMode(this.state, this.studyMode);
      this.studyIndex = 0;
      this.cardStartedAt = Date.now();
    }

    const item = this.studyQueue[this.studyIndex];
    if (!item) {
      return `
        <section class="empty-state">
          <h2>Phiên học đã xong</h2>
          <p>Không còn thẻ trong hàng đợi hiện tại. Bạn có thể đổi bài, import thêm dữ liệu, hoặc ôn lại từ sai.</p>
          <div class="action-row">
            <button class="primary-button" data-study-mode="today">${labelWithIcon("calendarCheck", "Tạo lại hàng đợi hôm nay")}</button>
            <button class="ghost-button" data-view="dashboard">${labelWithIcon("layout", "Về tổng quan")}</button>
          </div>
        </section>
      `;
    }

    const review = this.state.reviews[item.id];
    const feedback = this.feedback?.itemId === item.id ? this.feedback : undefined;
    const inputClass = feedback ? (feedback.correct ? "is-correct" : "is-wrong") : "";
    const position = `${this.studyIndex + 1}/${this.studyQueue.length}`;
    const hanziChars = extractHanziChars(item.hanzi);
    const selectedChar = hanziChars[Math.min(this.strokeCharIndex, hanziChars.length - 1)] ?? item.hanzi;
    const canUseStroke = Boolean(feedback);
    const answerVisible = Boolean(feedback);
    const sessionProgress = percent(this.studyIndex + 1, this.studyQueue.length);
    const modeLabel = studyModeLabel(this.studyMode, this.state.settings.locale);
    const feedbackLabel = feedback?.revealed ? "Đáp án" : feedback?.correct ? "Đúng" : "Sai";
    const feedbackText = feedback?.revealed ? item.hanzi : `Đáp án: ${item.hanzi}`;

    return `
      <section class="study-layout">
        <article class="study-card">
          <div class="session-strip">
            <div>
              <span>${escapeHtml(modeLabel)}</span>
              <strong>Thẻ ${position}</strong>
            </div>
            <div class="progress-track"><span style="width: ${sessionProgress}%"></span></div>
          </div>
          <div class="study-meta">
            <span>Bài ${item.lesson}</span>
            <span>${escapeHtml(bookLabel(item.book, this.state.settings.locale))}</span>
            <span>${position}</span>
            <span>${reviewStatusLabel(review?.status ?? "new", this.state.settings.locale)}</span>
          </div>
          <div class="prompt">
            <p class="eyebrow">Gõ lại chữ Hán</p>
            <h2>${escapeHtml(displayMeaning(item, this.state.settings.useEnglishFallback))}</h2>
            ${
              answerVisible && this.state.settings.revealPinyin
                ? `<p class="pinyin">${escapeHtml(item.pinyin || "Chưa có pinyin")}</p>`
                : ""
            }
            ${
              item.exampleHan || item.exampleVi
                ? `<div class="example">
                    <span>${escapeHtml(item.exampleVi || "Ví dụ")}</span>
                    ${feedback ? `<strong>${escapeHtml(item.exampleHan)}</strong>` : ""}
                  </div>`
                : ""
            }
          </div>

          <form class="answer-form" data-answer-form>
            <label for="hanzi-input">Nhập chữ Hán</label>
            <input
              id="hanzi-input"
              class="${inputClass}"
              name="answer"
              autocomplete="off"
              aria-describedby="answer-hint"
              inputmode="text"
              value="${escapeAttribute(feedback?.input ?? "")}"
              placeholder="Gõ chữ Hán..."
              ${feedback ? "readonly" : ""}
            />
            <p id="answer-hint" class="answer-hint">So khớp tự động với đáp án, bỏ qua khoảng trắng và dấu câu. Số chữ Hán cần nhớ: ${hanziChars.length || item.hanzi.length}.</p>
            <div class="answer-actions">
              ${
                feedback
                  ? `<button type="button" class="primary-button" data-next-card>${labelWithIcon("arrowRight", "Thẻ tiếp theo")}</button>`
                  : `<button type="submit" class="primary-button">${labelWithIcon("check", "Chấm đáp án")}</button>`
              }
              ${
                feedback?.revealed
                  ? `<button type="button" class="ghost-button answer-toggle active" data-hide-answer>${labelWithIcon("eyeOff", "Ẩn đáp án")}</button>`
                  : `<button type="button" class="ghost-button answer-toggle" data-reveal-answer>${labelWithIcon("eye", "Hiện đáp án")}</button>`
              }
            </div>
          </form>

          ${
            feedback
              ? `<div class="feedback ${feedback.correct ? "good" : "bad"}" role="status" aria-live="polite">
                  <strong>${feedbackLabel}</strong>
                  <span>${escapeHtml(feedbackText)}</span>
                </div>`
              : ""
          }
        </article>

        <aside class="study-side">
          ${this.renderStrokeLab(selectedChar, hanziChars, canUseStroke)}
          <section class="review-panel">
            <h3>Trạng thái từ này</h3>
            ${this.renderReviewDetail(item)}
          </section>
          <section class="mode-panel">
            <h3>Đổi hàng đợi</h3>
            <div class="mode-box">
              <button class="ghost-button" data-study-mode="today">${labelWithIcon("calendarCheck", "Hôm nay")}</button>
              <button class="ghost-button" data-study-mode="lesson">${labelWithIcon("book", "Theo bài")}</button>
              <button class="ghost-button" data-study-mode="wrong">${labelWithIcon("rotate", "Từ sai")}</button>
              <button class="ghost-button" data-study-mode="all">${labelWithIcon("database", "Trộn tất cả")}</button>
            </div>
          </section>
        </aside>
      </section>
    `;
  }

  private renderStrokeLab(selectedChar: string, hanziChars: string[], canUseStroke: boolean): string {
    if (!canUseStroke) {
      return `
        <div class="stroke-lab stroke-locked">
          <div class="stroke-lab-head">
            <div>
              <p class="eyebrow">Luyện nét</p>
              <h3>Ẩn trong lúc gõ</h3>
            </div>
            <span>Khóa</span>
          </div>
          <div class="stroke-lock-box">
            ${icon("eye")}
            <strong>Chưa mở luyện nét</strong>
            <p>Phần này sẽ hiện sau khi bạn chấm đáp án hoặc chủ động bấm “Hiện đáp án”, để không lộ chữ cần nhớ.</p>
          </div>
        </div>
      `;
    }

    return `
      <div class="stroke-lab">
        <div class="stroke-lab-head">
          <div>
            <p class="eyebrow">Luyện nét</p>
            <h3>Luyện nét chữ ${escapeHtml(selectedChar)}</h3>
          </div>
          <span>${hanziChars.length ? `${this.strokeCharIndex + 1}/${hanziChars.length}` : "1/1"}</span>
        </div>
        ${
          hanziChars.length > 1
            ? `<div class="char-tabs">
                ${hanziChars
                  .map(
                    (char, index) => `
                      <button class="${index === this.strokeCharIndex ? "active" : ""}" data-stroke-char="${index}">
                        ${escapeHtml(char)}
                      </button>
                    `,
                  )
                  .join("")}
              </div>`
            : ""
        }
        <div id="stroke-target" class="stroke-target" aria-label="Animation thứ tự nét chữ Hán"></div>
        <div class="stroke-actions">
          <button class="ghost-button" data-stroke-action="animate">${labelWithIcon("play", "Nét mẫu")}</button>
          <button class="primary-button" data-stroke-action="quiz">${labelWithIcon("pencil", "Quiz nét")}</button>
          <button class="ghost-button" data-stroke-action="outline">${labelWithIcon("squareDashed", "Khung")}</button>
          <button class="ghost-button" data-stroke-action="show">${labelWithIcon("eye", "Hiện chữ")}</button>
        </div>
        <p id="stroke-status" class="stroke-status" role="status" aria-live="polite">Đang chuẩn bị bảng nét...</p>
      </div>
    `;
  }

  private renderReviewDetail(item: VocabItem): string {
    const review = this.state.reviews[item.id];
    if (!review) {
      return `<p class="muted">Chưa có log. Lần chấm đầu tiên sẽ tạo lịch ôn tiếp.</p>`;
    }

    const accuracy = review.totalAttempts
      ? Math.round((review.correctAttempts / review.totalAttempts) * 100)
      : 0;

    return `
      <dl class="detail-list">
        <div><dt>Lần sai</dt><dd>${review.wrongCount}</dd></div>
        <div><dt>Đúng liên tiếp</dt><dd>${review.correctStreak}</dd></div>
        <div><dt>Tỷ lệ đúng</dt><dd>${accuracy}%</dd></div>
        <div><dt>Ôn tiếp</dt><dd>${formatDateVi(review.nextReviewDate)}</dd></div>
      </dl>
    `;
  }

  private renderLessons(): string {
    const selected = this.state.settings.selectedLesson;
    const items = this.state.items
      .filter((item) => item.lesson === selected)
      .sort((left, right) => left.order - right.order);
    const progress = progressForLesson(this.state, selected);

    return `
      <section class="lesson-layout">
        <aside class="lesson-picker">
          ${Array.from({ length: 20 }, (_, index) => {
            const lesson = index + 1;
            const itemProgress = progressForLesson(this.state, lesson);
            return `
              <button class="${selected === lesson ? "active" : ""}" data-lesson="${lesson}">
                <span>Bài ${lesson}</span>
                <small>${itemProgress.learned}/${itemProgress.total || 0}</small>
              </button>
            `;
          }).join("")}
        </aside>
        <article class="table-panel">
          <div class="table-head">
            <div>
              <p class="eyebrow">Quyển ${selected <= 10 ? "Thượng" : "Hạ"}</p>
              <h2>Bài ${selected}: ${escapeHtml(LESSON_TITLES[selected] ?? "")}</h2>
            </div>
            <div class="mini-stats">
              <span>${progress.learned}/${progress.total} đã học</span>
              <span>${progress.wrong} đang sai</span>
              <span>${progress.mastered} đã vững</span>
            </div>
          </div>
          <div class="action-row">
            <button class="primary-button" data-study-mode="lesson">${labelWithIcon("book", "Học bài này")}</button>
            <button class="ghost-button" data-export-csv>${labelWithIcon("download", "Xuất CSV")}</button>
          </div>
          ${vocabTable(items, this.state)}
        </article>
      </section>
    `;
  }

  private renderWrong(): string {
    const items = wrongItems(this.state);
    return `
      <section class="table-panel">
        <div class="table-head">
          <div>
            <p class="eyebrow">Sửa lỗi</p>
            <h2>Từ sai lần gần nhất</h2>
          </div>
          <button class="primary-button" data-study-mode="wrong">${labelWithIcon("rotate", "Ôn nhóm này")}</button>
        </div>
        ${items.length ? vocabTable(items, this.state) : emptyBlock("Chưa có từ sai. Khi bạn gõ sai, từ sẽ tự xuất hiện ở đây.")}
      </section>
    `;
  }

  private renderMockExam(): string {
    if (!this.mockExam) {
      return this.renderMockExamIntro();
    }
    if (this.mockExam.submittedAt) {
      return this.renderMockExamResults(this.mockExam);
    }
    return this.renderMockExamRunner(this.mockExam);
  }

  private renderMockExamIntro(): string {
    const health = this.dataHealthStats();
    const selectedSet = this.selectedMockSet();
    const blueprintItems = HSK4_MOCK_BLUEPRINT.map(
      (item) => `
        <li>
          <strong>${escapeHtml(item.part)}</strong>
          <span>${item.count} câu</span>
          <small>${escapeHtml(item.shape)}</small>
        </li>
      `,
    ).join("");
    return `
      <section class="exam-intro">
        <article class="exam-hero">
          <p class="eyebrow">Mô phỏng cấu trúc HSK4 cũ</p>
          <h2>100 câu trong ${HSK4_MOCK_SPEC.durationMinutes} phút</h2>
          <p>
            Bài thi thử dùng blueprint sát HSK4 cũ: Nghe ${HSK4_MOCK_SPEC.listening} câu, Đọc ${HSK4_MOCK_SPEC.reading} câu,
            Viết ${HSK4_MOCK_SPEC.writing} câu. Nội dung là đề mô phỏng tự sinh từ bộ từ vựng 4A/4B đã nạp; không chép đề
            hoặc audio chính thức có bản quyền.
          </p>
          <div class="action-row">
            <button class="primary-button" data-start-mock>${labelWithIcon("clipboardList", "Bắt đầu thi thử")}</button>
            <button class="ghost-button" data-view="data">${labelWithIcon("database", "Kiểm tra dữ liệu")}</button>
          </div>
          <div class="exam-set-grid" aria-label="Chọn mã đề thi thử">
            ${HSK4_MOCK_SETS.map((set) => this.renderMockSetCard(set, selectedSet.id === set.id)).join("")}
          </div>
          <div class="exam-spec-grid">
            ${metric("Nghe", `${HSK4_MOCK_SPEC.listening} câu`, "Đúng/Sai, hội thoại ngắn, đoạn dài")}
            ${metric("Đọc", `${HSK4_MOCK_SPEC.reading} câu`, "Điền từ, sắp xếp câu, đọc đoạn")}
            ${metric("Viết", `${HSK4_MOCK_SPEC.writing} câu`, "Sắp câu và viết câu theo gợi ý")}
            ${metric("Dữ liệu hiện có", `${health.total} từ`, health.examReady ? "Đủ mốc số lượng" : "Nên bổ sung đủ 1.200 từ")}
          </div>
          <div class="exam-source-note">
            <strong>Mức sát đề hiện tại</strong>
            <p>
              Cấu trúc, số câu và thời lượng bám theo HSK4 cũ. Phần nghe dùng giọng đọc tổng hợp của trình duyệt,
              phù hợp luyện phản xạ nhưng vẫn nên luyện thêm audio chính thức/licensed trước ngày thi.
            </p>
          </div>
        </article>
        <article class="exam-note">
          <h3>Blueprint 7 phần của bài thi</h3>
          <ul class="exam-blueprint">
            ${blueprintItems}
          </ul>
        </article>
        <article class="exam-note">
          <h3>Chuẩn hóa cho người học trên điện thoại</h3>
          <p>
            Mỗi câu hiển thị một màn hình, nút chọn lớn, có điều hướng trước/sau và thanh tiến độ.
            Khi thi thật trên máy tính, người học đã quen việc đọc nhanh, chọn nhanh và gõ chữ Hán.
          </p>
        </article>
      </section>
    `;
  }

  private renderMockSetCard(set: MockExamSet, active: boolean): string {
    return `
      <button class="exam-set-card ${active ? "active" : ""}" data-mock-set="${escapeAttribute(set.id)}" type="button">
        <span>${escapeHtml(set.focus)}</span>
        <strong>${escapeHtml(set.title)}</strong>
        <small>${escapeHtml(set.description)}</small>
      </button>
    `;
  }

  private renderMockExamRunner(session: MockExamSession): string {
    const question = session.questions[this.mockExamIndex];
    if (!question) {
      return emptyBlock("Chưa có dữ liệu để tạo đề thi thử. Hãy nạp bộ từ 4A/4B trước.");
    }

    const answered = Object.values(session.answers).filter((answer) => answer.trim()).length;
    const progress = percent(this.mockExamIndex + 1, session.questions.length);
    const remaining = this.examRemainingMs(session);

    return `
      <section class="exam-runner">
        <header class="exam-status">
          <div>
            <p class="eyebrow">Thi thử HSK4 · ${escapeHtml(session.setTitle)}</p>
            <h2>Câu ${question.number}/${session.questions.length}</h2>
          </div>
          <div class="exam-clock" data-exam-clock>${icon("clock")}<span>${formatExamTime(remaining)}</span></div>
        </header>
        <div class="exam-progress">
          <div class="progress-track"><span style="width: ${progress}%"></span></div>
          <span>${answered}/${session.questions.length} câu đã trả lời</span>
        </div>
        ${this.renderMockQuestion(question, session.answers[question.id] ?? "")}
        <div class="exam-nav">
          <button class="ghost-button" data-exam-prev ${this.mockExamIndex === 0 ? "disabled" : ""}>
            ${labelWithIcon("chevronLeft", "Trước")}
          </button>
          <button class="ghost-button" data-exam-next ${this.mockExamIndex >= session.questions.length - 1 ? "disabled" : ""}>
            ${labelWithIcon("chevronRight", "Sau")}
          </button>
          <button class="primary-button" data-submit-mock>${labelWithIcon("check", "Kết thúc và chấm")}</button>
        </div>
      </section>
    `;
  }

  private renderMockQuestion(question: MockExamQuestion, answer: string): string {
    const optionBlock = question.options?.length
      ? `
        <div class="exam-options">
          ${question.options
            .map(
              (option) => `
                <button class="${answer === option ? "selected" : ""}" data-exam-answer="${escapeAttribute(option)}">
                  ${escapeHtml(option)}
                </button>
              `,
            )
            .join("")}
        </div>
      `
      : "";

    const audioBlock = question.audioText
      ? `<button class="ghost-button audio-button" data-play-audio="${escapeAttribute(question.audioText)}">${labelWithIcon("volume", "Nghe lại")}</button>`
      : "";

    if (question.type === "read-order") {
      return `
        <article class="exam-question">
          <div class="exam-question-head">
            <span>${escapeHtml(question.part)}</span>
          </div>
          <h3>${escapeHtml(question.promptVi)}</h3>
          <div class="exam-order-lines">
            ${question.fragments?.map((fragment) => `<p>${escapeHtml(fragment)}</p>`).join("") ?? ""}
          </div>
          ${optionBlock}
        </article>
      `;
    }

    if (question.type === "order-sentence") {
      return `
        <article class="exam-question">
          <div class="exam-question-head">
            <span>${escapeHtml(question.part)}</span>
            ${audioBlock}
          </div>
          <h3>${escapeHtml(question.promptVi)}</h3>
          <div class="fragment-bank">
            ${question.fragments
              ?.map(
                (fragment) => `
                  <button class="ghost-button" data-exam-fragment="${escapeAttribute(fragment)}">${escapeHtml(fragment)}</button>
                `,
              )
              .join("") ?? ""}
          </div>
          <label class="exam-text-answer">
            Câu trả lời
            <input data-exam-text value="${escapeAttribute(answer)}" placeholder="Gõ hoặc chạm các cụm để tạo câu..." />
          </label>
          <button class="ghost-button compact-button" data-exam-clear>${labelWithIcon("rotate", "Xóa câu")}</button>
        </article>
      `;
    }

    if (question.type === "write-sentence") {
      return `
        <article class="exam-question">
          <div class="exam-question-head"><span>${escapeHtml(question.part)}</span></div>
          <h3>${escapeHtml(question.promptVi)}</h3>
          ${question.promptHan ? `<p class="exam-cue">${escapeHtml(question.promptHan)}</p>` : ""}
          <label class="exam-text-answer">
            Gõ câu tiếng Trung
            <textarea data-exam-text rows="4" placeholder="Ví dụ: ${escapeAttribute(question.expectedHan ?? "")}">${escapeHtml(answer)}</textarea>
          </label>
          <p class="answer-hint">Chấm tự động ước lượng: câu cần chứa từ mục tiêu và có ít nhất 6 chữ Hán.</p>
        </article>
      `;
    }

    const promptClass =
      question.type === "listen-true-false" || question.type === "read-blank" ? "exam-statement" : "exam-hanzi";

    return `
      <article class="exam-question">
        <div class="exam-question-head">
          <span>${escapeHtml(question.part)}</span>
          ${audioBlock}
        </div>
        <h3>${escapeHtml(question.promptVi)}</h3>
        ${question.promptHan ? `<p class="${promptClass}">${escapeHtml(question.promptHan)}</p>` : ""}
        ${question.passageHan ? `<div class="exam-passage">${escapeHtml(question.passageHan)}</div>` : ""}
        ${question.questionHan ? `<p class="exam-question-line">${escapeHtml(question.questionHan)}</p>` : ""}
        ${optionBlock}
      </article>
    `;
  }

  private renderMockExamResults(session: MockExamSession): string {
    const score = scoreMockExam(session);
    return `
      <section class="exam-results">
        <article class="result-card">
          <p class="eyebrow">Kết quả thi thử · ${escapeHtml(session.setTitle)}</p>
          <h2>${score.correct}/${score.total} câu</h2>
          <strong>${score.percent}%</strong>
          <div class="exam-score-line">
            <span>Điểm mô phỏng HSK</span>
            <b>${score.points}/${score.maxPoints}</b>
            <em>${score.passed ? "Đạt ngưỡng 180" : "Chưa đạt ngưỡng 180"}</em>
          </div>
          <p>Điểm viết câu là chấm tự động ước lượng. Với bài thi thật, phần viết nên được giáo viên/người có chuyên môn rà lại.</p>
          <div class="exam-source-note">
            <strong>Nguồn và giới hạn</strong>
            <p>${escapeHtml(session.sourceNote)}</p>
          </div>
          <div class="exam-spec-grid">
            ${score.sections
              .map((section) => metric(section.label, `${section.points}/100`, `${section.correct}/${section.total} câu đúng`))
              .join("")}
          </div>
          <div class="action-row">
            <button class="primary-button" data-start-mock>${labelWithIcon("clipboardList", "Làm đề mới")}</button>
            <button class="ghost-button" data-reset-mock>${labelWithIcon("rotate", "Về màn hình thi thử")}</button>
          </div>
        </article>
      </section>
    `;
  }

  private renderPlan(): string {
    const start = this.state.settings.startDate;
    return `
      <section class="plan-rationale">
        <article>
          <span>1</span>
          <strong>Bám bài khóa 4A/4B</strong>
          <p>20 ngày đầu đi đúng Bài 1-20 của giáo trình Thượng/Hạ, không xếp từ theo alphabet.</p>
        </article>
        <article>
          <span>2</span>
          <strong>Không bỏ nền HSK1-3</strong>
          <p>HSK4 cũ là mục tiêu 1.200 từ tích lũy; bộ 4A/4B cần đi kèm phần kiểm tra lại khoảng 600 từ nền.</p>
        </article>
        <article>
          <span>3</span>
          <strong>Gõ để nhớ chủ động</strong>
          <p>Mỗi thẻ yêu cầu tự gõ chữ Hán, vì thi máy tính cần phản xạ nhập liệu chứ không chỉ nhận mặt chữ.</p>
        </article>
        <article>
          <span>4</span>
          <strong>Ôn giãn cách</strong>
          <p>Sai ôn lại sau ${HSK4_REVIEW_POLICY.recoveryDays} ngày; đúng tăng khoảng ôn ${HSK4_REVIEW_POLICY.firstRecallDays}-${HSK4_REVIEW_POLICY.thirdRecallEasyDays}+ ngày, 3 ngày cuối chuyển sang mô phỏng thi.</p>
        </article>
      </section>
      <section class="plan-panel">
        <div class="settings-card">
          <h2>Thiết lập lộ trình</h2>
          <label>
            Ngày bắt đầu
            <input type="date" value="${escapeAttribute(start)}" data-setting="startDate" />
          </label>
          <label>
            Từ mới/ngày
            <input type="number" min="5" max="80" value="${this.state.settings.dailyNewTarget}" data-setting="dailyNewTarget" />
          </label>
          <label>
            Ôn tối đa/ngày
            <input type="number" min="20" max="240" value="${this.state.settings.dailyReviewTarget}" data-setting="dailyReviewTarget" />
          </label>
        </div>
        <div class="timeline">
          ${Array.from({ length: 30 }, (_, index) => this.planRow(index + 1)).join("")}
        </div>
      </section>
    `;
  }

  private planRow(day: number): string {
    const date = addDays(this.state.settings.startDate, day - 1);
    const isToday = date === toDateKey();
    const title =
      day <= 20
        ? `Bài ${day}: ${LESSON_TITLES[day] ?? ""}`
        : day <= 24
          ? "Ôn vòng 2"
          : day <= 27
            ? "Tổng ôn bài khóa"
            : "Mô phỏng thi máy tính";
    const detail =
      day <= 20
        ? "Bài khóa 4A/4B + ôn từ đến hạn + gõ chữ Hán"
        : day <= 24
          ? "Ôn vòng 2, từ sai và kiểm tra lại nền HSK1-3"
          : day <= 27
            ? "Trộn bài 1-20, đọc lại ngữ cảnh"
            : "Luyện tốc độ, kiểm tra tâm lý phòng thi";

    return `
      <div class="timeline-row ${isToday ? "today" : ""}">
        <span>Ngày ${day}</span>
        <strong>${escapeHtml(title)}</strong>
        <small>${formatDateVi(date)} - ${escapeHtml(detail)}</small>
      </div>
    `;
  }

  private renderData(): string {
    return `
      <section class="data-layout">
        <article class="data-card">
          <h2>Nhập dữ liệu chuẩn</h2>
          <p>
            App ưu tiên file Excel/CSV bạn tự kiểm chứng theo giáo trình chuẩn HSK4 上/下.
            Header được nhận: Bài, Từ Hán, Pinyin, Nghĩa Việt, Ví dụ Hán, Ví dụ Việt, Nghĩa Anh dự phòng.
          </p>
          <div class="file-box">
            <label class="file-picker" for="file-import">${labelWithIcon("fileText", "Chọn file Excel/CSV")}</label>
            <input id="file-import" class="sr-only" type="file" accept=".xlsx,.csv" />
            <span class="file-name" data-file-name>Chưa chọn file</span>
            <button class="primary-button" data-import-file>${labelWithIcon("upload", "Nhập file")}</button>
          </div>
          <label class="toggle-row">
            <input type="checkbox" data-setting="useEnglishFallback" ${this.state.settings.useEnglishFallback ? "checked" : ""} />
            <span>Dùng nghĩa tiếng Anh làm dự phòng khi từ chưa có nghĩa tiếng Việt</span>
          </label>
          <div class="button-grid">
            <button class="ghost-button" data-template-csv>${labelWithIcon("fileText", "Tải mẫu CSV")}</button>
            <button class="ghost-button" data-load-reference>${labelWithIcon("database", "Nạp bộ 20 bài từ Excel")}</button>
          </div>
          <p class="fine-print">
            Bộ mặc định được đóng gói từ file Excel ôn 20 bài, gồm nghĩa tiếng Việt và ví dụ đã biên soạn cho người học Việt.
            Bạn vẫn có thể nhập file riêng để thay thế dữ liệu này.
          </p>
        </article>

        <article class="data-card">
          <h2>Sao lưu và xuất file</h2>
          <p>Xuất lại toàn bộ từ vựng, log chấm, trạng thái ôn và lịch 30 ngày để gửi qua Excel.</p>
          <div class="button-grid">
            <button class="primary-button" data-export-xlsx>${labelWithIcon("fileSpreadsheet", "Xuất file Excel")}</button>
            <button class="ghost-button" data-export-csv>${labelWithIcon("download", "Xuất từ vựng CSV")}</button>
            <button class="ghost-button" data-export-json>${labelWithIcon("databaseBackup", "Sao lưu JSON")}</button>
            <button class="danger-button" data-reset-app>${labelWithIcon("trash", "Xóa dữ liệu hiện tại")}</button>
          </div>
        </article>

        <article class="data-card wide">
          <h2>Thông số dữ liệu hiện tại</h2>
          ${this.dataHealth()}
        </article>
      </section>
    `;
  }

  private dataHealth(): string {
    const health = this.dataHealthStats();
    const byLesson = Array.from({ length: 20 }, (_, index) => {
      const lesson = index + 1;
      return this.state.items.filter((item) => item.lesson === lesson).length;
    });

    return `
      <div class="health-grid">
        ${metric("Bộ 4A/4B", `${Math.min(health.courseItems, HSK4_TARGETS.standardCourse4ReferenceItems)}/${HSK4_TARGETS.standardCourse4ReferenceItems}`, "Mục tiêu theo giáo trình chuẩn")}
        ${metric("Chuẩn thi HSK4 cũ", `${health.total}/${HSK4_TARGETS.oldExamCumulativeWords}`, "Cần 1.200 từ tích lũy")}
        ${metric("Thiếu nghĩa Việt", health.missingVi.toString(), "Nên bổ sung trước khi học thật")}
        ${metric("Nghĩa cần duyệt", health.draftVi.toString(), "Tự bổ sung, chưa tính là bản cuối")}
        ${metric("Thiếu ví dụ", health.missingExamples.toString(), "Không bắt buộc, nhưng rất tốt cho bài khóa")}
        ${metric("HSK1-3 nền", health.examReady ? "Đủ số lượng" : `${HSK4_TARGETS.foundationHsk1To3Words} từ`, "Cần xác nhận nếu mục tiêu là thi HSK4")}
      </div>
      ${this.translationQaBlock()}
      <div class="lesson-bars">
        ${byLesson
          .map(
            (count, index) => `
              <div>
                <span>B${index + 1}</span>
                <meter min="0" max="45" value="${count}"></meter>
                <small>${count}</small>
              </div>
            `,
          )
          .join("")}
      </div>
    `;
  }

  private dataHealthStats(): DataHealth {
    const total = this.state.items.length;
    const courseItems = this.state.items.filter((item) => item.book === "4A" || item.book === "4B").length;
    const missingVi = this.state.items.filter((item) => !item.meaningVi.trim()).length;
    const draftVi = countDraftVietnameseMeanings(this.state.items);
    return {
      total,
      courseItems,
      missingVi,
      missingExamples: this.state.items.filter((item) => !item.exampleHan.trim()).length,
      draftVi,
      courseReady: courseItems >= HSK4_TARGETS.standardCourse4ReferenceItems && missingVi === 0,
      examReady: total >= HSK4_TARGETS.oldExamCumulativeWords && missingVi === 0,
      qualityReady: missingVi === 0 && draftVi === 0,
    };
  }

  private selectedMockSet(): MockExamSet {
    return HSK4_MOCK_SETS.find((set) => set.id === this.selectedMockSetId) ?? HSK4_MOCK_SETS[0];
  }

  private translationQaBlock(): string {
    const draftItems = this.state.items.filter(isDraftVietnameseMeaning).slice(0, 8);
    const missingItems = this.state.items.filter((item) => !item.meaningVi.trim()).slice(0, 8);
    if (!draftItems.length && !missingItems.length) {
      return `
        <div class="qa-panel good">
          <strong>Nghĩa tiếng Việt đã qua cổng chất lượng</strong>
          <p>Không còn mục thiếu nghĩa hoặc nghĩa tự bổ sung bị đánh dấu cần duyệt.</p>
        </div>
      `;
    }

    const samples = [...missingItems, ...draftItems].slice(0, 8);
    return `
      <div class="qa-panel warning">
        <strong>Cổng chất lượng nghĩa tiếng Việt đang chặn học thật</strong>
        <p>
          Các mục dưới đây cần được duyệt lại bằng tiếng Việt tự nhiên, ngắn, đúng sắc thái HSK4.
          Mình không coi dịch máy là bản cuối cho tới khi cờ này được xử lý.
        </p>
        <ul>
          ${samples
            .map(
              (item) => `
                <li>
                  <span class="hanzi-cell">${escapeHtml(item.hanzi)}</span>
                  <small>Bài ${item.lesson} - ${escapeHtml(item.meaningVi || item.meaningEn || "Thiếu nghĩa")}</small>
                </li>
              `,
            )
            .join("")}
        </ul>
      </div>
    `;
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

function metric(label: string, value: string, hint: string): string {
  return `
    <div class="metric">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
      <small>${escapeHtml(hint)}</small>
    </div>
  `;
}

function queuePreview(title: string, items: VocabItem[], empty: string): string {
  return `
    <div class="queue-preview">
      <div class="queue-title">
        <strong>${escapeHtml(title)}</strong>
        <span>${items.length}</span>
      </div>
      ${
        items.length
          ? `<ul>${items
              .slice(0, 5)
              .map((item) => `<li><span>${escapeHtml(item.hanzi)}</span><small>Bài ${item.lesson}</small></li>`)
              .join("")}</ul>`
          : `<p>${escapeHtml(empty)}</p>`
      }
    </div>
  `;
}

function vocabTable(items: VocabItem[], state: AppState): string {
  if (!items.length) {
    return emptyBlock("Chưa có từ nào trong nhóm này.");
  }

  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Bài</th>
            <th>Từ Hán</th>
            <th>Pinyin</th>
            <th>Nghĩa</th>
            <th>Ví dụ</th>
            <th>Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          ${items
            .map((item) => {
              const review = state.reviews[item.id];
              return `
                <tr>
                  <td>B${item.lesson}</td>
                  <td class="hanzi-cell">${escapeHtml(item.hanzi)}</td>
                  <td>${escapeHtml(item.pinyin)}</td>
                  <td>${escapeHtml(displayMeaning(item, state.settings.useEnglishFallback))}</td>
                  <td>${escapeHtml(item.exampleVi || item.exampleHan || item.note)}</td>
                  <td>${statusPill(review?.status ?? "new", review?.lastCorrect, state.settings.locale)}</td>
                </tr>
              `;
            })
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function statusPill(status: ReviewStatus, lastCorrect: boolean | undefined, locale: AppState["settings"]["locale"]): string {
  const variant = lastCorrect === false ? "bad" : status === "mastered" ? "good" : "neutral";
  return `<span class="status ${variant}">${escapeHtml(reviewStatusLabel(status, locale))}</span>`;
}

function emptyBlock(text: string): string {
  return `<div class="empty-block">${escapeHtml(text)}</div>`;
}

function percent(value: number, total: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(total) || total <= 0) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.round((value / total) * 100)));
}

function displayMeaning(item: VocabItem, useEnglishFallback: boolean): string {
  if (item.meaningVi) {
    return item.meaningVi;
  }
  if (useEnglishFallback && item.meaningEn) {
    return item.meaningEn;
  }
  return "Thiếu nghĩa tiếng Việt";
}

function extractHanziChars(value: string): string[] {
  return Array.from(value).filter((character) => /\p{Script=Han}/u.test(character));
}

function removeStarterItems(items: VocabItem[]): VocabItem[] {
  return items.filter(
    (item) =>
      !item.source.startsWith("Starter demo") && !item.source.startsWith(HSK4_EXCEL_SOURCE),
  );
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }
  return Math.max(min, Math.min(max, Math.round(value)));
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttribute(value: string): string {
  return escapeHtml(value).replace(/`/g, "&#096;");
}

function registerServiceWorker(): void {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      void navigator.serviceWorker.register("/sw.js");
    });
  }
}

export function mountHskApp(): void {
  const root = document.querySelector<HTMLElement>("#app");
  if (!root) {
    throw new Error("Không tìm thấy #app");
  }

  void new HskApp(root).init();
}
