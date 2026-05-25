import type { AppState, ReviewStatus, VocabItem } from "../../domain/types";
import { HSK4_EXCEL_SOURCE } from "../../domain/hsk4/hsk4-excel-vocab";
import { reviewStatusLabel } from "../../presentation/i18n";

export function metric(label: string, value: string, hint: string): string {
  return `
    <div class="metric">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
      <small>${escapeHtml(hint)}</small>
    </div>
  `;
}

export function queuePreview(title: string, items: VocabItem[], empty: string): string {
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

export function vocabTable(items: VocabItem[], state: AppState): string {
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

export function statusPill(status: ReviewStatus, lastCorrect: boolean | undefined, locale: AppState["settings"]["locale"]): string {
  const variant = lastCorrect === false ? "bad" : status === "mastered" ? "good" : "neutral";
  return `<span class="status ${variant}">${escapeHtml(reviewStatusLabel(status, locale))}</span>`;
}

export function emptyBlock(text: string): string {
  return `<div class="empty-block">${escapeHtml(text)}</div>`;
}

export function percent(value: number, total: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(total) || total <= 0) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.round((value / total) * 100)));
}

export function displayMeaning(item: VocabItem, useEnglishFallback: boolean): string {
  if (item.meaningVi) {
    return item.meaningVi;
  }
  if (useEnglishFallback && item.meaningEn) {
    return item.meaningEn;
  }
  return "Thiếu nghĩa tiếng Việt";
}

export function extractHanziChars(value: string): string[] {
  return Array.from(value).filter((character) => /\p{Script=Han}/u.test(character));
}

export function removeStarterItems(items: VocabItem[]): VocabItem[] {
  return items.filter(
    (item) =>
      !item.source.startsWith("Starter demo") && !item.source.startsWith(HSK4_EXCEL_SOURCE),
  );
}

export function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }
  return Math.max(min, Math.min(max, Math.round(value)));
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function escapeAttribute(value: string): string {
  return escapeHtml(value).replace(/`/g, "&#096;");
}
