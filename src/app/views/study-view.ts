import type {
  AppState,
  StudyDirection,
  StudyMode,
  VocabItem,
} from "../../domain/types";
import {
  expectedAnswer,
  reviewsForDirection,
} from "../../domain/review/review-service";
import { bookLabel, reviewStatusLabel, studyModeLabel } from "../../presentation/i18n";
import { icon, labelWithIcon } from "../../presentation/icons";
import { formatDateVi } from "../../shared/date-utils";
import type { NekoTutorViewState, StudyFeedback } from "../app-types";
import { displayMeaning, escapeAttribute, escapeHtml, extractHanziChars, percent } from "./view-helpers";

interface StudyViewModel {
  state: AppState;
  studyMode: StudyMode;
  studyDirection: StudyDirection;
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
    studyDirection,
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
        <p>Không còn thẻ trong hàng đợi hiện tại. Bạn có thể đổi chiều luyện, đổi bài hoặc ôn lại từ sai.</p>
        ${renderDirectionBar(studyDirection, state.settings.alternateStudyDirections)}
        <div class="action-row">
          <button class="primary-button" data-study-mode="today">${labelWithIcon("calendarCheck", "Tạo lại hàng đợi hôm nay")}</button>
          <button class="ghost-button" data-view="dashboard">${labelWithIcon("layout", "Về tổng quan")}</button>
        </div>
      </section>
    `;
  }

  const reviews = reviewsForDirection(state, studyDirection);
  const review = reviews[item.id];
  const feedback = studyFeedback?.itemId === item.id ? studyFeedback : undefined;
  const inputClass = feedback ? (feedback.correct ? "is-correct" : "is-wrong") : "";
  const position = `${studyIndex + 1}/${studyQueue.length}`;
  const hanziChars = extractHanziChars(item.hanzi);
  const selectedChar = hanziChars[Math.min(strokeCharIndex, hanziChars.length - 1)] ?? item.hanzi;
  const answerVisible = Boolean(feedback);
  const sessionProgress = percent(studyIndex + 1, studyQueue.length);
  const modeLabel = studyModeLabel(studyMode, state.settings.locale);
  const bookName = bookLabel(item.book, state.settings.locale);
  const feedbackLabel = !feedback ? "" : feedback.revealed ? "Đáp án" : feedback.correct ? "Đúng" : "Sai";
  const expected = expectedAnswer(item, studyDirection);
  const feedbackText = feedback?.revealed ? expected : `Đáp án: ${expected}`;
  const exampleHan = usefulStudyExample(item.exampleHan, item.hanzi);
  const exampleVi = usefulStudyExample(item.exampleVi, item.hanzi);
  const isRecognition = studyDirection === "zh-to-vi";
  const promptText = isRecognition
    ? item.hanzi
    : displayMeaning(item, state.settings.useEnglishFallback);
  const promptLabel = isRecognition ? "Nhìn chữ, nhớ nghĩa" : "Gợi nghĩa, viết chữ";
  const inputLabel = isRecognition ? "Nhập nghĩa tiếng Việt" : "Nhập chữ Hán";
  const inputPlaceholder = isRecognition ? "Ví dụ: pháp luật…" : "Gõ chữ Hán…";

  return `
    <section class="study-layout">
      <article class="study-card" data-motion="study-card" data-study-card-id="${escapeAttribute(item.id)}">
        ${renderDirectionBar(studyDirection, state.settings.alternateStudyDirections)}
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
        <div class="prompt ${isRecognition ? "prompt-hanzi" : "prompt-meaning"}">
          <div class="prompt-head">
            <p class="eyebrow">${promptLabel}</p>
            ${renderAnswerHelp(studyDirection)}
          </div>
          <h2 ${isRecognition ? 'lang="zh-Hans"' : ""}>${escapeHtml(promptText)}</h2>
          ${
            answerVisible && state.settings.revealPinyin
              ? `<p class="pinyin">${escapeHtml(item.pinyin || "Chưa có pinyin")}</p>`
              : ""
          }
          ${
            answerVisible && (exampleHan || exampleVi)
              ? `<div class="example">
                  ${exampleHan ? `<strong lang="zh-Hans">${escapeHtml(exampleHan)}</strong>` : ""}
                  ${exampleVi ? `<span>${escapeHtml(exampleVi)}</span>` : ""}
                </div>`
              : ""
          }
        </div>

        <form class="answer-form answer-form-${studyDirection}" data-answer-form>
          <label for="hanzi-input">${inputLabel}</label>
          <input
            id="hanzi-input"
            class="${inputClass}"
            name="answer"
            autocomplete="off"
            autocapitalize="none"
            data-motion="study-input"
            data-feedback-state="${feedback ? feedbackLabel.toLowerCase() : "none"}"
            inputmode="text"
            value="${escapeAttribute(feedback?.input ?? "")}"
            placeholder="${inputPlaceholder}"
            aria-describedby="answer-direction-hint"
            ${feedback ? "readonly" : ""}
          />
          <p class="answer-hint" id="answer-direction-hint">
            ${isRecognition ? "Có thể nhập có dấu hoặc không dấu; các nghĩa tương đương đã tách bằng dấu phẩy đều được chấp nhận." : "Khoảng trắng và dấu câu không ảnh hưởng kết quả chấm."}
          </p>
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
        ${renderStrokeLab(selectedChar, hanziChars, answerVisible, strokeCharIndex)}
        ${renderNekoTutor(item, feedback, nekoTutorAvailable, nekoTutor, studyDirection)}
        ${review ? `<section class="review-panel">
            <div class="panel-heading">
              <p class="eyebrow">${isRecognition ? "Nhận nghĩa" : "Tự viết"}</p>
              <h3>Tiến độ từ này</h3>
            </div>
            ${renderReviewDetail(state, item, studyDirection)}
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

function renderDirectionBar(direction: StudyDirection, alternateEnabled: boolean): string {
  const recognition = direction === "zh-to-vi";
  return `
    <div class="study-direction-bar">
      <span class="study-direction-copy">
        <strong>Chiều luyện</strong>
        <small>${recognition ? "Nhìn chữ Hán, nhớ nghĩa Việt" : "Từ nghĩa Việt, tự viết chữ Hán"}</small>
      </span>
      <div class="study-direction-controls">
        <div class="study-direction-switch" role="group" aria-label="Chọn chiều luyện từ vựng cho phiên hiện tại">
          <button type="button" data-study-direction="vi-to-zh" class="${recognition ? "" : "active"}" aria-pressed="${recognition ? "false" : "true"}">
            Việt <span aria-hidden="true">→</span> Trung
          </button>
          <button type="button" data-study-direction="zh-to-vi" class="${recognition ? "active" : ""}" aria-pressed="${recognition ? "true" : "false"}">
            Trung <span aria-hidden="true">→</span> Việt
          </button>
        </div>
        <label class="study-alternate-toggle">
          <input type="checkbox" data-setting="alternateStudyDirections" ${alternateEnabled ? "checked" : ""} />
          <span>
            <strong>Đổi chiều mỗi phiên</strong>
            <small>${alternateEnabled ? "Mỗi lần mở lại Học tập, dùng chiều còn lại." : "Giữ chiều bạn chọn cho các phiên sau."}</small>
          </span>
        </label>
      </div>
    </div>
  `;
}

function renderAnswerHelp(direction: StudyDirection): string {
  const recognition = direction === "zh-to-vi";
  return `
    <details class="answer-help">
      <summary>${labelWithIcon("help", "Cách chấm")}</summary>
      <div class="answer-help-popover">
        ${
          recognition
            ? `<p>App bỏ qua dấu tiếng Việt, viết hoa và dấu câu. Ví dụ “pháp luật” và “phap luat” được xem là cùng một đáp án.</p>
               <p>Nếu dữ liệu có nhiều nghĩa tách bằng dấu phẩy, bạn chỉ cần nhập một nghĩa đầy đủ.</p>`
            : `<p>Gõ chữ Hán bạn nhớ được. Hệ thống bỏ qua khoảng trắng và dấu câu khi so đáp án.</p>
               <p>Nếu sai do thiếu hoặc thừa chữ, app sẽ nhắc ở phần phản hồi.</p>`
        }
      </div>
    </details>
  `;
}

function renderNekoTutor(
  item: VocabItem,
  feedback: StudyFeedback | undefined,
  available: boolean,
  state: NekoTutorViewState | undefined,
  direction: StudyDirection,
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
  const recognition = direction === "zh-to-vi";
  const defaultQuestion = feedback.revealed
    ? "Giải thích ngắn gọn từ này và cho tôi một mẹo ghi nhớ."
    : feedback.correct
      ? recognition
        ? "Giải thích sắc thái nghĩa và cho tôi một ví dụ HSK4 ngắn."
        : "Giải thích cách dùng từ này và cho tôi một ví dụ HSK4 ngắn."
      : recognition
        ? "So sánh nghĩa tôi nhập với đáp án và chỉ ra chỗ chưa đúng."
        : "Chỉ ra lỗi trong câu trả lời của tôi và giải thích cách nhớ đáp án đúng.";

  return `
    <section class="neko-tutor" data-neko-tutor>
      <div class="neko-tutor-head">
        <span class="neko-tutor-icon">${icon("sparkles")}</span>
        <span>
          <strong>Neko AI</strong>
          <small>ACP local · hậu kiểm sau khi trả lời</small>
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

function renderReviewDetail(state: AppState, item: VocabItem, direction: StudyDirection): string {
  const review = reviewsForDirection(state, direction)[item.id];
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
