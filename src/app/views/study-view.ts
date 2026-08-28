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
import type { NekoTutorSessionState, NekoTutorViewState, StudyFeedback } from "../app-types";
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
  nekoTutorEnabled: boolean;
  nekoTutor: NekoTutorViewState | undefined;
  nekoSession: NekoTutorSessionState | undefined;
  nekoPanelOpen: boolean;
  nekoClearConfirming: boolean;
  nekoNotice: string | undefined;
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
    nekoTutorEnabled,
    nekoTutor,
    nekoSession,
    nekoPanelOpen,
    nekoClearConfirming,
    nekoNotice,
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
      ${renderNekoTutor({
        item,
        feedback,
        available: nekoTutorAvailable,
        enabled: nekoTutorEnabled,
        panelOpen: nekoPanelOpen,
        viewState: nekoTutor,
        session: nekoSession,
        clearConfirming: nekoClearConfirming,
        notice: nekoNotice,
        direction: studyDirection,
      })}
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

interface NekoTutorRenderModel {
  item: VocabItem;
  feedback: StudyFeedback | undefined;
  available: boolean;
  enabled: boolean;
  panelOpen: boolean;
  viewState: NekoTutorViewState | undefined;
  session: NekoTutorSessionState | undefined;
  clearConfirming: boolean;
  notice: string | undefined;
  direction: StudyDirection;
}

function renderNekoTutor(model: NekoTutorRenderModel): string {
  const {
    item,
    feedback,
    available,
    enabled,
    panelOpen,
    viewState,
    session,
    clearConfirming,
    notice,
    direction,
  } = model;
  if (!available) {
    return "";
  }
  const current = viewState?.itemId === item.id ? viewState : undefined;
  const recognition = direction === "zh-to-vi";
  const defaultQuestion = feedback?.revealed
    ? "Giải thích ngắn gọn từ này và cho tôi một mẹo ghi nhớ."
    : feedback?.correct
      ? recognition
        ? "Giải thích sắc thái nghĩa và cho tôi một ví dụ HSK4 ngắn."
        : "Giải thích cách dùng từ này và cho tôi một ví dụ HSK4 ngắn."
      : recognition
        ? "So sánh nghĩa tôi nhập với đáp án và chỉ ra chỗ chưa đúng."
        : "Chỉ ra lỗi trong câu trả lời của tôi và giải thích cách nhớ đáp án đúng.";

  const panelContent = !enabled
    ? renderNekoDisabled()
    : !feedback
      ? renderNekoLocked()
      : renderNekoConversation(item, current, session, clearConfirming, notice, defaultQuestion);
  const visibleSession = feedback ? session : undefined;

  return `
    <div class="neko-shell ${panelOpen ? "is-open" : ""}" data-neko-shell>
      ${
        panelOpen
          ? `<button type="button" class="neko-panel-scrim" data-neko-close aria-label="Đóng Neko"></button>
            <aside class="neko-panel" id="neko-panel" data-neko-panel data-neko-tutor tabindex="-1" aria-label="Trợ giảng Neko">
              ${renderNekoPanelHeader(item, visibleSession, enabled)}
              ${panelContent}
            </aside>`
          : ""
      }
      <button
        type="button"
        class="neko-launcher"
        ${panelOpen ? "data-neko-close" : "data-neko-open"}
        data-label="${panelOpen ? "Đóng Neko" : "Mở Neko"}"
        aria-label="${panelOpen ? "Đóng trợ giảng Neko" : "Mở trợ giảng Neko"}"
        aria-controls="neko-panel"
        aria-expanded="${panelOpen}"
      >
        ${icon(panelOpen ? "x" : "sparkles")}
        ${feedback && !panelOpen ? `<span class="neko-launcher-dot"><span class="sr-only">Neko đã sẵn sàng</span></span>` : ""}
      </button>
    </div>
  `;
}

function renderNekoPanelHeader(
  item: VocabItem,
  session: NekoTutorSessionState | undefined,
  enabled: boolean,
): string {
  return `
    <header class="neko-panel-head">
      <span class="neko-panel-brand">${icon("sparkles")}</span>
      <span class="neko-panel-title">
        <strong>Neko</strong>
        <small>Đang học · <span lang="zh-Hans">${escapeHtml(item.hanzi)}</span></small>
      </span>
      <div class="neko-panel-actions" aria-label="Điều khiển Neko">
        ${session ? `<button type="button" class="neko-icon-button" data-neko-clear-request title="Bắt đầu cuộc trò chuyện mới" aria-label="Bắt đầu cuộc trò chuyện mới">${icon("plus")}</button>` : ""}
        ${session?.messages.length ? `<button type="button" class="neko-icon-button" data-neko-export title="Xuất cuộc trò chuyện" aria-label="Xuất cuộc trò chuyện">${icon("download")}</button>` : ""}
        ${
          enabled
            ? `<details class="neko-panel-menu">
                <summary class="neko-icon-button" title="Tùy chọn Neko" aria-label="Tùy chọn Neko">${icon("ellipsis")}</summary>
                <div class="neko-panel-menu-popover">
                  <button type="button" data-neko-disable>${labelWithIcon("x", "Tắt Neko")}</button>
                </div>
              </details>`
            : ""
        }
        <button type="button" class="neko-icon-button" data-neko-close title="Đóng Neko" aria-label="Đóng Neko">${icon("x")}</button>
      </div>
    </header>
  `;
}

function renderNekoDisabled(): string {
  return `
    <div class="neko-panel-body neko-panel-state">
      <span class="neko-state-icon">${icon("sparkles")}</span>
      <strong>Neko đang tắt</strong>
      <p>Việc học và lịch ôn vẫn hoạt động bình thường. Bạn có thể bật lại khi cần giải thích.</p>
      <button type="button" class="primary-button" data-neko-enable>${labelWithIcon("sparkles", "Bật Neko")}</button>
    </div>
  `;
}

function renderNekoLocked(): string {
  return `
    <div class="neko-panel-body neko-panel-state neko-panel-locked">
      <span class="neko-state-icon">${icon("sparkles")}</span>
      <strong>Thử nhớ trước, hỏi Neko sau</strong>
      <p>Hãy chấm hoặc hiện đáp án trước. Neko sẽ không gợi ý trong lúc bạn đang tự nhớ.</p>
    </div>
  `;
}

function renderNekoConversation(
  item: VocabItem,
  current: NekoTutorViewState | undefined,
  session: NekoTutorSessionState | undefined,
  clearConfirming: boolean,
  notice: string | undefined,
  defaultQuestion: string,
): string {
  const loading = current?.status === "loading";
  return `
    <div class="neko-panel-body" data-neko-conversation>
      ${notice ? `<p class="neko-notice" role="status">${escapeHtml(notice)}</p>` : ""}
      ${renderNekoClearConfirmation(clearConfirming)}
      ${renderNekoThread(session)}
      ${
        !session?.messages.length && !loading
          ? `<div class="neko-empty">
              <span class="neko-empty-mark" lang="zh-Hans">${escapeHtml(item.hanzi)}</span>
              <strong>Hỏi Neko về từ này</strong>
              <p>Giải thích cách dùng, phân biệt từ dễ nhầm hoặc tạo một câu hỏi thử lại.</p>
            </div>`
          : ""
      }
      ${
        loading
          ? `<div class="neko-pending-question">
              <strong>Bạn · ${escapeHtml(item.hanzi)}</strong>
              <p>${escapeHtml(current.question)}</p>
            </div>
            <div
              class="neko-message neko-message-tutor neko-streaming-answer ${current.answer ? "" : "is-empty"}"
              data-neko-stream-message
              role="status"
              aria-live="polite"
              aria-atomic="false"
              aria-relevant="additions text"
            >
              <div><strong>Neko</strong><span>${escapeHtml(item.hanzi)}</span></div>
              <p data-neko-stream-answer>${escapeHtml(current.answer ?? "")}</p>
            </div>
            <div class="neko-loading" role="status">
              <span class="neko-pulse" aria-hidden="true"></span>
              <span data-neko-stream-status>${current.answer ? "Neko đang trả lời…" : "Neko đang suy nghĩ…"}</span>
              <button type="button" class="ghost-button compact-button" data-neko-cancel>${labelWithIcon("squareDashed", "Dừng")}</button>
            </div>`
          : ""
      }
      ${
        !loading && current?.answer && (current.status === "error" || current.status === "cancelled")
          ? `<div class="neko-message neko-message-tutor neko-streaming-answer">
              <div><strong>Neko</strong><span>${escapeHtml(item.hanzi)}</span></div>
              <p>${escapeHtml(current.answer)}</p>
            </div>`
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
      ${
        current?.status === "cancelled"
          ? `<div class="neko-cancelled" role="status">Lượt vừa rồi đã dừng. Bạn có thể hỏi lại bằng một câu ngắn hơn.</div>`
          : ""
      }
      ${!loading ? renderNekoSuggestions(defaultQuestion) : ""}
    </div>
    ${renderNekoComposer(item, loading)}
  `;
}

function renderNekoClearConfirmation(confirming: boolean): string {
  if (!confirming) {
    return "";
  }
  return `
    <div class="neko-clear-confirm" role="alertdialog" aria-labelledby="neko-clear-title">
      <strong id="neko-clear-title">Bắt đầu cuộc trò chuyện mới?</strong>
      <p>Neko sẽ đóng cuộc trò chuyện hiện tại. Tiến độ học và lịch ôn không thay đổi.</p>
      <div>
        <button type="button" class="primary-button" data-neko-clear-confirm>Bắt đầu mới</button>
        <button type="button" class="ghost-button" data-neko-clear-cancel>Quay lại</button>
      </div>
    </div>
  `;
}

function renderNekoThread(session: NekoTutorSessionState | undefined): string {
  if (!session?.messages.length) {
    return "";
  }
  return `
    <div class="neko-thread-wrap">
      <ol class="neko-thread" aria-label="Cuộc trò chuyện với Neko">
        ${session.messages.map((message) => `
          <li class="neko-message neko-message-${message.role} ${message.role === "tutor" ? "neko-answer" : ""}">
            <div><strong>${message.role === "tutor" ? "Neko" : "Bạn"}</strong><span>${escapeHtml(message.hanzi)}</span></div>
            <p>${escapeHtml(message.text).replaceAll("\n", "<br />")}</p>
          </li>
        `).join("")}
      </ol>
    </div>
  `;
}

function renderNekoSuggestions(defaultQuestion: string): string {
  const questions = [
    defaultQuestion,
    "Phân biệt từ này với một từ HSK4 dễ nhầm.",
    "Tạo một câu hỏi thử lại, chưa đưa đáp án.",
  ];
  return `
    <div class="neko-suggestions" aria-label="Câu hỏi gợi ý">
      ${questions.map((question, index) => `<button type="button" data-neko-question="${escapeAttribute(question)}">${index === 0 ? "Hỏi Neko về câu này" : escapeHtml(question)}</button>`).join("")}
    </div>
  `;
}

function renderNekoComposer(item: VocabItem, loading: boolean): string {
  return `
    <footer class="neko-composer">
      <form class="neko-question-form" data-neko-question-form>
        <label class="sr-only" for="neko-question-input">Hỏi Neko về ${escapeHtml(item.hanzi)}</label>
        <input
          id="neko-question-input"
          name="question"
          maxlength="600"
          autocomplete="off"
          placeholder="Hỏi về ${escapeAttribute(item.hanzi)}…"
          ${loading ? "disabled" : ""}
        />
        <button type="submit" class="neko-send-button" aria-label="Gửi câu hỏi" ${loading ? "disabled" : ""}>${icon("arrowRight")}</button>
      </form>
    </footer>
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
