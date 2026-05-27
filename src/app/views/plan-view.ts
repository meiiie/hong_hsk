import { LESSON_TITLES } from "../../application/bootstrap/initial-state";
import { HSK4_REVIEW_POLICY } from "../../domain/review/review-policy";
import { computeStats } from "../../domain/review/review-service";
import type { AppState } from "../../domain/types";
import { icon, labelWithIcon } from "../../presentation/icons";
import { addDays, formatDateVi, toDateKey } from "../../shared/date-utils";
import { escapeAttribute, escapeHtml, percent } from "./view-helpers";

export function renderPlanView(state: AppState): string {
  const start = state.settings.startDate;
  const stats = computeStats(state);
  const currentDay = Math.min(30, Math.max(1, stats.planDay));
  const planPercent = percent(currentDay, 30);

  return `
    <section class="page-stack plan-page">
      <section class="page-hero plan-hero">
        <div class="page-hero-copy">
          <p class="eyebrow">Lộ trình thi HSK4</p>
          <h2>30 ngày học theo bài, ôn sai và thi thử</h2>
          <p>20 ngày đầu bám bài khóa 4A/4B, phần cuối giảm từ mới để chuyển sang tổng ôn và mô phỏng thi máy tính.</p>
        </div>
        <div class="plan-hero-meter" aria-label="Tiến độ lộ trình ${planPercent}%">
          <span>Ngày ${currentDay}/30</span>
          <strong>${planPercent}%</strong>
          <div class="progress-track"><span style="width: ${planPercent}%"></span></div>
        </div>
      </section>

      <section class="plan-summary-row">
        ${planPrinciple("20 ngày", "Học bài mới", "Bài 1-20 đúng giáo trình", "book")}
        ${planPrinciple(`${HSK4_REVIEW_POLICY.recoveryDays} ngày`, "Sửa lỗi nhanh", "Từ sai quay lại sớm", "rotate")}
        ${planPrinciple("3 ngày cuối", "Thi thử", "Luyện tốc độ phòng thi", "clipboardList")}
      </section>

      <section class="plan-panel">
        <aside class="settings-card plan-settings-card">
          <div class="panel-kicker">
            <strong>Thiết lập</strong>
            <small>Cá nhân hóa nhịp học</small>
          </div>
          <label>
            Ngày bắt đầu
            <input type="date" value="${escapeAttribute(start)}" data-setting="startDate" />
          </label>
          <label>
            Từ mới/ngày
            <input type="number" min="5" max="80" value="${state.settings.dailyNewTarget}" data-setting="dailyNewTarget" />
          </label>
          <label>
            Ôn tối đa/ngày
            <input type="number" min="20" max="240" value="${state.settings.dailyReviewTarget}" data-setting="dailyReviewTarget" />
          </label>
          <button class="primary-button" data-study-mode="today">${labelWithIcon("playCircle", "Ôn hôm nay")}</button>
        </aside>

        <div class="timeline" aria-label="Lịch học 30 ngày">
          ${Array.from({ length: 30 }, (_, index) => planRow(state, index + 1)).join("")}
        </div>
      </section>
    </section>
  `;
}

function planPrinciple(value: string, label: string, hint: string, iconName: "book" | "rotate" | "clipboardList"): string {
  return `
    <article class="plan-principle">
      <span>${icon(iconName)}</span>
      <div>
        <strong>${escapeHtml(value)}</strong>
        <small>${escapeHtml(label)}</small>
      </div>
      <em>${escapeHtml(hint)}</em>
    </article>
  `;
}

function planRow(state: AppState, day: number): string {
  const date = addDays(state.settings.startDate, day - 1);
  const today = toDateKey();
  const isToday = date === today;
  const isPast = date < today;
  const phase = phaseForDay(day);
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
      ? "Từ mới, từ đến hạn, đọc lại ngữ cảnh bài khóa"
      : day <= 24
        ? "Ôn từ sai, kiểm tra lại nền HSK1-3"
        : day <= 27
          ? "Trộn bài 1-20, giảm tốc độ học mới"
          : "Làm đề theo thời gian và sửa lỗi sau đề";

  return `
    <article class="timeline-row ${isToday ? "today" : ""} ${isPast ? "past" : ""}" data-phase="${phase.tone}">
      <span class="timeline-day">Ngày ${day}</span>
      <div class="timeline-main">
        <strong>${escapeHtml(title)}</strong>
        <small>${formatDateVi(date)} · ${escapeHtml(detail)}</small>
      </div>
      <em>${escapeHtml(phase.label)}</em>
    </article>
  `;
}

function phaseForDay(day: number): { label: string; tone: string } {
  if (day <= 20) {
    return { label: "Học bài", tone: "lesson" };
  }
  if (day <= 24) {
    return { label: "Ôn vòng 2", tone: "review" };
  }
  if (day <= 27) {
    return { label: "Tổng ôn", tone: "mixed" };
  }
  return { label: "Thi thử", tone: "mock" };
}
