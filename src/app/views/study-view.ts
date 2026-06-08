import type { AiTutorAction, AiTutorPanelState } from "../../application/ports/ai-tutor-client";
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
  aiTutor: AiTutorPanelState;
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
  const bookName = bookLabel(item.book, state.settings.locale);
  const feedbackLabel = feedback?.revealed ? "Đáp án" : feedback?.correct ? "Đúng" : "Sai";
  const feedbackText = feedback?.revealed ? item.hanzi : `Đáp án: ${item.hanzi}`;
  const exampleHan = usefulStudyExample(item.exampleHan, item.hanzi);
  const exampleVi = usefulStudyExample(item.exampleVi, item.hanzi);

  return `
    <section class="study-layout">
      <article class="study-card" data-motion="study-card" data-study-card-id="${escapeAttribute(item.id)}">
        <div class="session-strip">
          <div>
            <span>${escapeHtml(modeLabel)}</span>
            <strong>Thẻ ${position}</strong>
          </div>
          <div class="progress-track"><span style="width: ${sessionProgress}%"></span></div>
        </div>
        <div class="study-meta">
          <span>Bài ${item.lesson}</span>
          <span>${escapeHtml(bookName)}</span>
          <span>${position}</span>
          <span>${reviewStatusLabel(review?.status ?? "new", state.settings.locale)}</span>
        </div>
        <div class="prompt">
          <div class="prompt-head">
            <p class="eyebrow">Gõ lại chữ Hán</p>
            <details class="answer-help">
              <summary>${labelWithIcon("help", "Cách chấm")}</summary>
              <div class="answer-help-popover">
                <p>Gõ chữ Hán bạn nhớ được. Hệ thống bỏ qua khoảng trắng và dấu câu khi so đáp án.</p>
                <p>Nếu sai do thiếu hoặc thừa chữ, app sẽ nhắc ở phần phản hồi.</p>
              </div>
            </details>
          </div>
          <h2>${escapeHtml(displayMeaning(item, state.settings.useEnglishFallback))}</h2>
          ${
            answerVisible && state.settings.revealPinyin
              ? `<p class="pinyin">${escapeHtml(item.pinyin || "Chưa có pinyin")}</p>`
              : ""
          }
          ${
            answerVisible && (exampleHan || exampleVi)
              ? `<div class="example">
                  ${exampleVi ? `<span>${escapeHtml(exampleVi)}</span>` : ""}
                  ${exampleHan ? `<strong>${escapeHtml(exampleHan)}</strong>` : ""}
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
            data-motion="study-input"
            data-feedback-state="${feedback ? feedbackLabel.toLowerCase() : "none"}"
            inputmode="text"
            value="${escapeAttribute(feedback?.input ?? "")}"
            placeholder="Gõ chữ Hán..."
            ${feedback ? "readonly" : ""}
          />
          <div class="answer-actions">
            ${
              feedback?.revealed
                ? `<button type="button" class="ghost-button answer-toggle active" data-hide-answer>${labelWithIcon("eyeOff", "Ẩn đáp án")}</button>`
                : `<button type="button" class="ghost-button answer-toggle" data-reveal-answer>${labelWithIcon("eye", "Hiện đáp án")}</button>`
            }
            ${
              feedback
                ? `<button type="button" class="primary-button" data-next-card>${labelWithIcon("arrowRight", "Thẻ tiếp theo")}</button>`
                : `<button type="submit" class="primary-button">${labelWithIcon("check", "Chấm đáp án")}</button>`
            }
          </div>
        </form>

        ${
          feedback
            ? `<div class="feedback ${feedback.correct ? "good" : "bad"}" data-motion="study-feedback" role="status" aria-live="polite">
                <strong>${feedbackLabel}</strong>
                <span>${escapeHtml(feedbackText)}</span>
              </div>`
            : ""
        }
      </article>

      <aside class="study-side">
        ${renderAiTutorPanel(item, model.aiTutor, canUseStroke, feedback)}
        ${renderStrokeLab(selectedChar, hanziChars, canUseStroke, strokeCharIndex)}
        ${review ? `<section class="review-panel">
            <h3>Trạng thái từ này</h3>
            ${renderReviewDetail(state, item)}
          </section>` : ""}
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

function renderAiTutorPanel(
  item: VocabItem,
  aiTutor: AiTutorPanelState,
  canUseAi: boolean,
  feedback: StudyFeedback | undefined,
): string {
  if (!canUseAi) {
    return "";
  }

  const isLoading = aiTutor.status === "loading";
  const wrongDisabled = feedback?.correct === false && !isLoading ? "" : "disabled";
  const response = aiTutor.status === "ready" && aiTutor.response ? formatAiResponse(aiTutor.response.content) : "";
  const activeAction = aiTutor.action;

  return `
    <section class="ai-tutor-panel" data-motion="study-ai" aria-live="polite">
      <div class="ai-tutor-head">
        <div>
          <p class="eyebrow">Gia sư HSK</p>
          <h3>Hỏi về ${escapeHtml(item.hanzi)}</h3>
        </div>
        <span>Nemotron Tutor</span>
      </div>
      <div class="ai-tutor-actions">
        ${aiActionButton("explain", "Giải thích", activeAction, isLoading)}
        ${aiActionButton("examples", "Ví dụ", activeAction, isLoading)}
        ${aiActionButton("memory_tip", "Mẹo nhớ", activeAction, isLoading)}
        <button type="button" data-ai-action="why_wrong" class="${activeAction === "why_wrong" ? "active" : ""}" ${wrongDisabled}>Sửa lỗi</button>
      </div>
      ${
        aiTutor.status === "loading"
          ? `<div class="ai-tutor-response loading" data-motion="study-ai-response"><span></span><p>Gia sư đang phân tích từ này...</p></div>`
          : ""
      }
      ${
        aiTutor.status === "error"
          ? `<div class="ai-tutor-response error" data-motion="study-ai-response"><strong>Chưa gọi được AI</strong><p>${escapeHtml(aiTutor.error ?? "Thử lại sau vài giây.")}</p></div>`
          : ""
      }
      ${
        response
          ? `<div class="ai-tutor-response" data-motion="study-ai-response">${response}<small>AI hỗ trợ học, không thay dữ liệu gốc. Model: ${escapeHtml(aiTutor.response?.model ?? "NVIDIA")}</small></div>`
          : ""
      }
      ${
        aiTutor.status === "idle"
          ? `<p class="ai-tutor-empty">Chọn một gợi ý hoặc hỏi trực tiếp sau khi đã xem đáp án.</p>`
          : ""
      }
      <form class="ai-tutor-form" data-ai-form>
        <label for="ai-question">Hỏi thêm</label>
        <textarea id="ai-question" data-ai-question rows="3" maxlength="400" placeholder="Ví dụ: từ này khác gì với từ gần nghĩa?" ${isLoading ? "disabled" : ""}>${escapeHtml(aiTutor.question ?? "")}</textarea>
        <button type="submit" class="primary-button" ${isLoading ? "disabled" : ""}>${labelWithIcon("arrowRight", "Hỏi gia sư")}</button>
      </form>
    </section>
  `;
}

function aiActionButton(action: AiTutorAction, label: string, activeAction: AiTutorAction | undefined, disabled: boolean): string {
  return `<button type="button" data-ai-action="${action}" class="${activeAction === action ? "active" : ""}" ${disabled ? "disabled" : ""}>${escapeHtml(label)}</button>`;
}

function formatAiResponse(content: string): string {
  return content
    .trim()
    .split(/\n{2,}/)
    .filter(Boolean)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

function usefulStudyExample(example: string, hanzi: string): string {
  const normalized = example.trim();
  if (!normalized) {
    return "";
  }

  const generatedHan = `我今天复习了“${hanzi}”，并在课文里找它的用法。`;
  const generatedVi = `Hôm nay tôi ôn từ “${hanzi}” và tìm cách dùng của nó trong bài khóa.`;

  if (normalized === generatedHan || normalized === generatedVi) {
    return "";
  }

  return normalized;
}

function renderStrokeLab(selectedChar: string, hanziChars: string[], canUseStroke: boolean, strokeCharIndex: number): string {
  if (!canUseStroke) {
    return `
      <div class="stroke-lab stroke-locked" data-motion="stroke-lab">
        <div class="stroke-lock-row">
          <span class="stroke-lock-icon">${icon("pencil")}</span>
          <span>
            <strong>Luyện nét khóa</strong>
            <small>Mở sau khi chấm hoặc hiện đáp án.</small>
          </span>
          ${icon("chevronRight")}
        </div>
      </div>
    `;
  }

  return `
    <div class="stroke-lab" data-motion="stroke-lab">
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
    return "";
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
