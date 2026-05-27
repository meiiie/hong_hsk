import { LESSON_TITLES } from "../../application/bootstrap/initial-state";
import { progressForLesson, wrongItems } from "../../domain/review/review-service";
import type { AppState, VocabItem } from "../../domain/types";
import { icon, labelWithIcon } from "../../presentation/icons";
import { toDateKey } from "../../shared/date-utils";
import { emptyBlock, escapeHtml, percent, vocabTable } from "./view-helpers";

export function renderLessonsView(state: AppState): string {
  const selected = state.settings.selectedLesson;
  const items = state.items
    .filter((item) => item.lesson === selected)
    .sort((left, right) => left.order - right.order);
  const progress = progressForLesson(state, selected);
  const learnedPercent = percent(progress.learned, progress.total);
  const bookLabel = selected <= 10 ? "Quyển Thượng" : "Quyển Hạ";

  return `
    <section class="page-stack lessons-page">
      <section class="page-hero lesson-hero">
        <div class="page-hero-copy">
          <p class="eyebrow">Theo giáo trình chuẩn 4A/4B</p>
          <h2>Bài ${selected}: ${escapeHtml(LESSON_TITLES[selected] ?? "")}</h2>
          <p>Chọn đúng bài khóa để học từ mới, xem nghĩa tiếng Việt và theo dõi phần đã nhớ trước khi chuyển bài.</p>
        </div>
        <div class="page-hero-actions">
          <button class="primary-button" data-study-mode="lesson">${labelWithIcon("book", "Học bài này")}</button>
          <button class="ghost-button" data-view="study">${labelWithIcon("keyboard", "Gõ chữ Hán")}</button>
        </div>
      </section>

      <section class="lesson-workspace">
        <aside class="lesson-picker-panel" aria-label="Danh sách bài học">
          <div class="panel-kicker">
            <strong>20 bài</strong>
            <small>4A · 4B</small>
          </div>
          <div class="lesson-picker">
            ${Array.from({ length: 20 }, (_, index) => lessonButton(state, selected, index + 1)).join("")}
          </div>
        </aside>

        <article class="table-panel lesson-detail-panel">
          <div class="table-head lesson-detail-head">
            <div>
              <p class="eyebrow">${bookLabel}</p>
              <h2>${escapeHtml(LESSON_TITLES[selected] ?? `Bài ${selected}`)}</h2>
            </div>
            <span class="lesson-progress-badge">${progress.learned}/${progress.total || 0}</span>
          </div>

          <div class="lesson-progress-card">
            <div>
              <span>Tiến độ bài ${selected}</span>
              <strong>${learnedPercent}%</strong>
            </div>
            <div class="progress-track lesson-progress-track">
              <span style="width: ${learnedPercent}%"></span>
            </div>
          </div>

          <div class="lesson-stat-row">
            ${lessonStat("Đã học", progress.learned, "book")}
            ${lessonStat("Đang sai", progress.wrong, "rotate")}
            ${lessonStat("Đã vững", progress.mastered, "check")}
          </div>

          ${vocabTable(items, state)}
        </article>
      </section>
    </section>
  `;
}

export function renderWrongView(state: AppState): string {
  const items = wrongItems(state);
  const today = toDateKey();
  const dueNow = items.filter((item) => state.reviews[item.id]?.nextReviewDate <= today).length;
  const maxWrong = items.reduce((max, item) => Math.max(max, state.reviews[item.id]?.wrongCount ?? 0), 0);
  const preview = items.slice(0, 3);

  return `
    <section class="page-stack wrong-page">
      <section class="page-hero recovery-hero">
        <div class="page-hero-copy">
          <p class="eyebrow">Sửa lỗi trước khi học mới</p>
          <h2>Từ sai lần gần nhất</h2>
          <p>${items.length ? "Ưu tiên các từ vừa gõ sai để khóa lại ký ức đúng, tránh để lỗi kéo dài sang bài mới." : "Khi Hồng gõ sai, app sẽ tự đưa từ vào đây để ôn lại đúng nhịp."}</p>
        </div>
        <div class="page-hero-actions">
          ${
            items.length
              ? `<button class="primary-button" data-study-mode="wrong">${labelWithIcon("rotate", "Ôn nhóm này")}</button>
                 <button class="ghost-button" data-study-mode="today">${labelWithIcon("calendarCheck", "Về hàng đợi")}</button>`
              : `<button class="primary-button" data-study-mode="today">${labelWithIcon("calendarCheck", "Ôn hôm nay")}</button>
                 <button class="ghost-button" data-view="lessons">${labelWithIcon("book", "Xem theo bài")}</button>`
          }
        </div>
      </section>

      <section class="recovery-summary-grid">
        ${recoveryMetric("Đang sai", items.length, "từ cần sửa", "rotate")}
        ${recoveryMetric("Đến hạn", dueNow, "nên làm trước", "calendarCheck")}
        ${recoveryMetric("Sai nhiều nhất", maxWrong, "lần trên một từ", "alert")}
      </section>

      ${
        preview.length
          ? `<section class="recovery-preview" aria-label="Từ sai nổi bật">
              ${preview.map((item) => recoveryPreviewItem(item, state)).join("")}
            </section>`
          : ""
      }

      <article class="table-panel recovery-table-panel">
        ${items.length ? vocabTable(items, state) : emptyBlock("Chưa có từ sai. Hãy học hoặc ôn hôm nay, từ gõ sai sẽ tự được đưa về đây.")}
      </article>
    </section>
  `;
}

function lessonButton(state: AppState, selected: number, lesson: number): string {
  const itemProgress = progressForLesson(state, lesson);
  const lessonPercent = percent(itemProgress.learned, itemProgress.total);
  const isActive = selected === lesson;

  return `
    <button class="${isActive ? "active" : ""}" data-lesson="${lesson}" aria-label="Bài ${lesson}">
      <span>
        <strong>${lesson}</strong>
        <small>${lesson <= 10 ? "4A" : "4B"}</small>
      </span>
      <span class="lesson-button-progress" aria-hidden="true">
        <span style="width: ${lessonPercent}%"></span>
      </span>
      <em>${itemProgress.learned}/${itemProgress.total || 0}</em>
    </button>
  `;
}

function lessonStat(label: string, value: number, iconName: "book" | "rotate" | "check"): string {
  return `
    <div class="lesson-stat">
      <span>${icon(iconName)}</span>
      <strong>${value}</strong>
      <small>${escapeHtml(label)}</small>
    </div>
  `;
}

function recoveryMetric(label: string, value: number, hint: string, iconName: "rotate" | "calendarCheck" | "alert"): string {
  return `
    <article class="recovery-metric">
      <span>${icon(iconName)}</span>
      <div>
        <strong>${value}</strong>
        <small>${escapeHtml(label)}</small>
      </div>
      <em>${escapeHtml(hint)}</em>
    </article>
  `;
}

function recoveryPreviewItem(item: VocabItem, state: AppState): string {
  const review = state.reviews[item.id];

  return `
    <article>
      <span class="hanzi-cell">${escapeHtml(item.hanzi)}</span>
      <div>
        <strong>${escapeHtml(item.meaningVi || item.meaningEn || "Thiếu nghĩa")}</strong>
        <small>Bài ${item.lesson} · sai ${review?.wrongCount ?? 0} lần · ôn tiếp ${escapeHtml(review?.nextReviewDate ?? "hôm nay")}</small>
      </div>
    </article>
  `;
}
