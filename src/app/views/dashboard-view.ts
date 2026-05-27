import { LESSON_TITLES } from "../../application/bootstrap/initial-state";
import { HSK4_TARGETS } from "../../domain/hsk4/hsk4-targets";
import { computeStats, dueItems, newItemsForLesson, wrongItems } from "../../domain/review/review-service";
import type { AppState, DashboardStats, StudyMode, VocabItem } from "../../domain/types";
import { icon, labelWithIcon } from "../../presentation/icons";
import type { DataHealth } from "../app-types";
import { escapeHtml, percent } from "./view-helpers";

export function renderDashboardView(state: AppState, dataHealth: DataHealth): string {
  const stats = computeStats(state);
  const todayLesson = Math.min(20, Math.max(1, stats.planDay));
  const lessonTitle = LESSON_TITLES[todayLesson] ?? "";
  const newCards = newItemsForLesson(state, todayLesson);
  const due = dueItems(state);
  const wrong = wrongItems(state);
  const learnedProgress = percent(stats.learned, stats.totalItems);
  const planProgress = percent(Math.min(stats.planDay, 30), 30);
  const readinessProgress = percent(dataHealth.total, HSK4_TARGETS.oldExamCumulativeWords);
  const priorityCount = due.length + wrong.length;

  return `
    <section class="today-dashboard" aria-label="Kế hoạch học hôm nay">
      ${renderTodayHero(todayLesson, lessonTitle, due.length + wrong.length + newCards.length)}
      ${renderReadinessStrip(dataHealth)}
      <section class="today-grid">
        ${renderProgressPanel(stats, dataHealth, learnedProgress, planProgress, readinessProgress, priorityCount)}
        ${renderQueuePanel(due, wrong, newCards)}
      </section>
    </section>
  `;
}

function renderTodayHero(todayLesson: number, lessonTitle: string, queueCount: number): string {
  return `
    <article class="today-hero">
      <div class="today-hero-head">
        <div>
          <p class="eyebrow">Kế hoạch hôm nay</p>
          <h2>Kế hoạch học hôm nay</h2>
        </div>
        <span class="today-lesson-badge">
          <small>Bài học hôm nay</small>
          <strong>Bài ${todayLesson}</strong>
        </span>
      </div>
      <div class="today-plan">
        <div class="today-focus-card" aria-label="Bài học hôm nay">
          <span>${icon("book")}</span>
          <span>
            <strong>Bài ${todayLesson}</strong>
            <small>${escapeHtml(lessonTitle)}</small>
          </span>
        </div>
        <div class="today-start-card">
          <span>Ước tính 20-25 phút</span>
          <strong>${queueCount} thẻ trong hàng đợi</strong>
          <button class="primary-button today-start-button" data-study-mode="today">
            ${labelWithIcon("playCircle", "Bắt đầu ôn")}
          </button>
        </div>
      </div>
    </article>
  `;
}

function renderReadinessStrip(health: DataHealth): string {
  const qualityGaps = health.missingVi + health.draftVi;
  const ready = health.examReady && health.qualityReady;
  const statusText = ready
    ? "Dữ liệu sẵn sàng"
    : health.courseReady
      ? "Cần bổ sung nền HSK1-3"
      : "Cần kiểm tra dữ liệu";
  const detail = ready
    ? "Bộ từ đủ điều kiện để tập trung vào lịch ôn."
    : health.courseReady
      ? `${health.total}/${HSK4_TARGETS.oldExamCumulativeWords} từ so với chuẩn HSK4 cũ.`
      : `${health.courseItems}/${HSK4_TARGETS.standardCourse4ReferenceItems} mục 4A/4B đã có.`;

  return `
    <article class="today-readiness-strip ${ready ? "ready" : "needs-work"}">
      <span class="today-strip-icon">${icon(ready ? "check" : "alert")}</span>
      <div>
        <strong>${escapeHtml(statusText)}</strong>
        <p>${escapeHtml(detail)}</p>
      </div>
      <div class="today-strip-meta">
        <span>${qualityGaps} nghĩa cần duyệt</span>
        <button class="ghost-button" data-view="data">${labelWithIcon("database", "Dữ liệu")}</button>
      </div>
    </article>
  `;
}

function renderProgressPanel(
  stats: DashboardStats,
  health: DataHealth,
  learnedProgress: number,
  planProgress: number,
  readinessProgress: number,
  priorityCount: number,
): string {
  return `
    <article class="today-progress-panel">
      <div class="section-title">
        <p class="eyebrow">Tiến độ</p>
        <h2>Nhịp học của Hồng</h2>
      </div>
      <div class="today-progress-stack">
        ${renderProgressRow("Từ đã học", `${stats.learned}/${stats.totalItems}`, learnedProgress, "accent")}
        ${renderProgressRow("Lộ trình 30 ngày", `Ngày ${stats.planDay}`, planProgress, "brand")}
        ${renderProgressRow("Chuẩn thi HSK4 cũ", `${health.total}/${HSK4_TARGETS.oldExamCumulativeWords}`, readinessProgress, "warning")}
      </div>
      <div class="today-mini-stats">
        ${renderMiniStat("Cần ôn", priorityCount.toString(), "trước khi học mới")}
        ${renderMiniStat("Chuỗi", stats.streak.toString(), "ngày duy trì")}
        ${renderMiniStat("Độ đúng", `${stats.accuracy}%`, "theo log đã chấm")}
      </div>
    </article>
  `;
}

function renderProgressRow(label: string, value: string, progress: number, tone: "accent" | "brand" | "warning"): string {
  return `
    <div class="today-progress-row">
      <div>
        <span>${escapeHtml(label)}</span>
        <strong>${escapeHtml(value)}</strong>
      </div>
      <div class="progress-track today-progress-track" data-tone="${tone}">
        <span style="width: ${progress}%"></span>
      </div>
    </div>
  `;
}

function renderMiniStat(label: string, value: string, hint: string): string {
  return `
    <div>
      <strong>${escapeHtml(value)}</strong>
      <span>${escapeHtml(label)}</span>
      <small>${escapeHtml(hint)}</small>
    </div>
  `;
}

function renderQueuePanel(due: VocabItem[], wrong: VocabItem[], newCards: VocabItem[]): string {
  return `
    <article class="today-queue-panel">
      <div class="section-title">
        <p class="eyebrow">Hàng đợi</p>
        <h2>Việc nên làm tiếp</h2>
      </div>
      <div class="today-queue-list">
        ${renderQueueTask("Đến hạn", due, "today", "calendarCheck", "Chưa có từ đến hạn. Có thể học bài mới trước.")}
        ${renderQueueTask("Từ sai", wrong, "wrong", "rotate", "Chưa có lỗi mở. Giữ nhịp ôn như hiện tại.")}
        ${renderQueueTask("Từ mới bài hôm nay", newCards, "lesson", "book", "Bài hôm nay chưa có từ mới hoặc đã học hết.")}
      </div>
    </article>
  `;
}

function renderQueueTask(
  title: string,
  items: VocabItem[],
  mode: Extract<StudyMode, "today" | "lesson" | "wrong">,
  iconName: "calendarCheck" | "rotate" | "book",
  empty: string,
): string {
  const preview = items
    .slice(0, 3)
    .map((item) => `<span class="hanzi-chip">${escapeHtml(item.hanzi)}</span>`)
    .join("");

  return `
    <button class="today-queue-row" type="button" data-study-mode="${mode}" data-tone="${mode}">
      <span class="today-queue-icon">${icon(iconName)}</span>
      <span class="today-queue-copy">
        <strong>${escapeHtml(title)}</strong>
        ${items.length ? `<span class="today-queue-preview">${preview}</span>` : `<small>${escapeHtml(empty)}</small>`}
      </span>
      <span class="today-queue-count">${items.length}</span>
    </button>
  `;
}
