import { LESSON_TITLES } from "../../application/bootstrap/initial-state";
import type { AppState } from "../../domain/types";
import { progressForLesson, wrongItems } from "../../domain/review/review-service";
import { labelWithIcon } from "../../presentation/icons";
import { emptyBlock, escapeHtml, vocabTable } from "./view-helpers";

export function renderLessonsView(state: AppState): string {
  const selected = state.settings.selectedLesson;
  const items = state.items
    .filter((item) => item.lesson === selected)
    .sort((left, right) => left.order - right.order);
  const progress = progressForLesson(state, selected);

  return `
    <section class="lesson-layout">
      <aside class="lesson-picker">
        ${Array.from({ length: 20 }, (_, index) => {
          const lesson = index + 1;
          const itemProgress = progressForLesson(state, lesson);
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
        ${vocabTable(items, state)}
      </article>
    </section>
  `;
}

export function renderWrongView(state: AppState): string {
  const items = wrongItems(state);
  return `
    <section class="table-panel">
      <div class="table-head">
        <div>
          <p class="eyebrow">Sửa lỗi</p>
          <h2>Từ sai lần gần nhất</h2>
        </div>
        <button class="primary-button" data-study-mode="wrong">${labelWithIcon("rotate", "Ôn nhóm này")}</button>
      </div>
      ${items.length ? vocabTable(items, state) : emptyBlock("Chưa có từ sai. Khi bạn gõ sai, từ sẽ tự xuất hiện ở đây.")}
    </section>
  `;
}
