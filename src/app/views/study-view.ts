import type { AppState, StudyMode, VocabItem } from "../../domain/types";
import { bookLabel, reviewStatusLabel, studyModeLabel } from "../../presentation/i18n";
import { icon, labelWithIcon } from "../../presentation/icons";
import { formatDateVi } from "../../shared/date-utils";
import type { NekoTutorViewState, StudyFeedback } from "../app-types";
import { displayMeaning, escapeAttribute, escapeHtml, extractHanziChars, percent } from "./view-helpers";

interface StudyViewModel {
  state: AppState;
  studyMode: StudyMode;
  studyQueue: VocabItem[];
  studyIndex: number;
  strokeCharIndex: number;
  feedback: StudyFeedback | undefined;
  nekoTutorAvailable: boolean;
  nekoTutor: NekoTutorViewState | undefined;
}

export function renderStudyView(model: StudyViewModel): string {
  const {
    state,
    studyMode,
    studyQueue,
    studyIndex,
    strokeCharIndex,
    feedback: studyFeedback,
    nekoTutorAvailable,
    nekoTutor,
  } = model;

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
        ${renderStrokeLab(selectedChar, hanziChars, canUseStroke, strokeCharIndex)}
        ${renderNekoTutor(item, feedback, nekoTutorAvailable, nekoTutor)}
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

function renderNekoTutor(
  item: VocabItem,
  feedback: StudyFeedback | undefined,
  available: boolean,
  state: NekoTutorViewState | undefined,
): string {
  if (!available) {
    return "";
  }
  if (!feedback) {
    return `
      <section class="neko-tutor neko-tutor-locked" data-neko-tutor>
        <div class="neko-tutor-head">
          <span class="neko-tutor-icon">${icon("sparkles")}</span>
          <span>
            <strong>Neko AI</strong>
            <small>Mở sau khi chấm hoặc hiện đáp án.</small>
          </span>
        </div>
      </section>
    `;
  }

  const current = state?.itemId === item.id ? state : undefined;
  const defaultQuestion = feedback.revealed
    ? "Giải thích ngắn gọn từ này và cho tôi một mẹo ghi nhớ."
    : feedback.correct
      ? "Giải thích cách dùng từ này và cho tôi một ví dụ HSK4 ngắn."
      : "Chỉ ra lỗi trong câu trả lời của tôi và giải thích cách nhớ đáp án đúng.";

  return `
    <section class="neko-tutor" data-neko-tutor>
      <div class="neko-tutor-head">
        <span class="neko-tutor-icon">${icon("sparkles")}</span>
        <span>
          <strong>Neko AI</strong>
          <small>ACP local · chỉ hỗ trợ sau khi trả lời</small>
        </span>
      </div>
      ${
        !current
          ? `<button type="button" class="primary-button neko-primary" data-neko-question="${escapeAttribute(defaultQuestion)}">
              ${labelWithIcon("sparkles", "Hỏi Neko về câu này")}
            </button>`
          : ""
      }
      ${
        current?.status === "loading"
          ? `<div class="neko-loading" role="status" aria-live="polite">
              <span class="neko-pulse" aria-hidden="true"></span>
              <span>Neko đang xem câu trả lời của bạn…</span>
            </div>`
          : ""
      }
      ${
        current?.status === "ready"
          ? `<div class="neko-answer" role="status" aria-live="polite">
              <p>${escapeHtml(current.answer ?? "").replaceAll("\n", "<br />")}</p>
            </div>
            ${renderNekoFollowups()}`
          : ""
      }
      ${
        current?.status === "error"
          ? `<div class="neko-error" role="alert">
              <p>${escapeHtml(current.error ?? "Neko chưa trả lời được.")}</p>
              <button type="button" class="ghost-button" data-neko-question="${escapeAttribute(current.question)}">Thử lại</button>
            </div>`
          : ""
      }
    </section>
  `;
}

function renderNekoFollowups(): string {
  const questions = [
    "Phân biệt từ này với một từ HSK4 dễ nhầm.",
    "Cho tôi hai ví dụ ngắn có dịch tiếng Việt.",
    "Tạo một câu hỏi thử lại, chưa đưa đáp án.",
  ];
  return `
    <div class="neko-suggestions" aria-label="Câu hỏi gợi ý">
      ${questions.map((question) => `<button type="button" data-neko-question="${escapeAttribute(question)}">${escapeHtml(question)}</button>`).join("")}
    </div>
    <form class="neko-question-form" data-neko-question-form>
      <label for="neko-question-input">Hỏi tiếp về từ này</label>
      <div>
        <input id="neko-question-input" name="question" maxlength="600" autocomplete="off" placeholder="Ví dụ: Khi nào dùng từ này?" />
        <button type="submit" class="primary-button">Hỏi</button>
      </div>
    </form>
  `;
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
