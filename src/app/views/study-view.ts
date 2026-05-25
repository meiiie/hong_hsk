import type { AppState, StudyMode, VocabItem } from "../../domain/types";
import { bookLabel, reviewStatusLabel, studyModeLabel } from "../../presentation/i18n";
import { icon, labelWithIcon } from "../../presentation/icons";
import { formatDateVi } from "../../shared/date-utils";
import type { StudyFeedback } from "../app-types";
import { displayMeaning, escapeAttribute, escapeHtml, extractHanziChars, percent } from "./view-helpers";

interface StudyViewModel {
  state: AppState;
  studyMode: StudyMode;
  studyQueue: VocabItem[];
  studyIndex: number;
  strokeCharIndex: number;
  feedback: StudyFeedback | undefined;
}

export function renderStudyView(model: StudyViewModel): string {
  const { state, studyMode, studyQueue, studyIndex, strokeCharIndex, feedback: studyFeedback } = model;

  const item = studyQueue[studyIndex];
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

  const review = state.reviews[item.id];
  const feedback = studyFeedback?.itemId === item.id ? studyFeedback : undefined;
  const inputClass = feedback ? (feedback.correct ? "is-correct" : "is-wrong") : "";
  const position = `${studyIndex + 1}/${studyQueue.length}`;
  const hanziChars = extractHanziChars(item.hanzi);
  const selectedChar = hanziChars[Math.min(strokeCharIndex, hanziChars.length - 1)] ?? item.hanzi;
  const canUseStroke = Boolean(feedback);
  const answerVisible = Boolean(feedback);
  const sessionProgress = percent(studyIndex + 1, studyQueue.length);
  const modeLabel = studyModeLabel(studyMode, state.settings.locale);
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
          <span>${escapeHtml(bookLabel(item.book, state.settings.locale))}</span>
          <span>${position}</span>
          <span>${reviewStatusLabel(review?.status ?? "new", state.settings.locale)}</span>
        </div>
        <div class="prompt">
          <p class="eyebrow">Gõ lại chữ Hán</p>
          <h2>${escapeHtml(displayMeaning(item, state.settings.useEnglishFallback))}</h2>
          ${
            answerVisible && state.settings.revealPinyin
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
          ${renderStrokeLab(selectedChar, hanziChars, canUseStroke, strokeCharIndex)}
        <section class="review-panel">
          <h3>Trạng thái từ này</h3>
          ${renderReviewDetail(state, item)}
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

function renderStrokeLab(selectedChar: string, hanziChars: string[], canUseStroke: boolean, strokeCharIndex: number): string {
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
        <span>${hanziChars.length ? `${strokeCharIndex + 1}/${hanziChars.length}` : "1/1"}</span>
      </div>
      ${
        hanziChars.length > 1
          ? `<div class="char-tabs">
              ${hanziChars
                .map(
                  (char, index) => `
                    <button class="${index === strokeCharIndex ? "active" : ""}" data-stroke-char="${index}">
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

function renderReviewDetail(state: AppState, item: VocabItem): string {
  const review = state.reviews[item.id];
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
