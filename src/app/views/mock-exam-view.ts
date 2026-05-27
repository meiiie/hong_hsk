import {
  HSK4_MOCK_BLUEPRINT,
  HSK4_MOCK_SETS,
  HSK4_MOCK_SPEC,
  formatExamTime,
  scoreMockExam,
  type MockExamQuestion,
  type MockExamSet,
  type MockExamSession,
} from "../../domain/exam/mock-exam";
import { icon, labelWithIcon } from "../../presentation/icons";
import type { DataHealth } from "../app-types";
import { emptyBlock, escapeAttribute, escapeHtml, metric, percent } from "./view-helpers";

export function renderMockExamIntro(health: DataHealth, selectedSet: MockExamSet): string {
  const blueprintItems = HSK4_MOCK_BLUEPRINT.map(
    (item) => `
      <li>
        <strong>${escapeHtml(item.part)}</strong>
        <span>${item.count} câu</span>
        <small>${escapeHtml(item.shape)}</small>
      </li>
    `,
  ).join("");
  return `
    <section class="exam-intro">
      <article class="exam-hero">
        <p class="eyebrow">Mô phỏng cấu trúc HSK4 cũ</p>
        <h2>100 câu trong ${HSK4_MOCK_SPEC.durationMinutes} phút</h2>
        <p>
          Bài thi thử dùng blueprint sát HSK4 cũ: Nghe ${HSK4_MOCK_SPEC.listening} câu, Đọc ${HSK4_MOCK_SPEC.reading} câu,
          Viết ${HSK4_MOCK_SPEC.writing} câu. Nội dung là đề mô phỏng tự sinh từ bộ từ vựng 4A/4B đã nạp; không chép đề
          hoặc audio chính thức có bản quyền.
        </p>
        <div class="action-row">
          <button class="primary-button" data-start-mock>${labelWithIcon("clipboardList", "Bắt đầu thi thử")}</button>
          <button class="ghost-button" data-view="data">${labelWithIcon("database", "Kiểm tra dữ liệu")}</button>
        </div>
        <div class="exam-set-grid" aria-label="Chọn mã đề thi thử">
          ${HSK4_MOCK_SETS.map((set) => renderMockSetCard(set, selectedSet.id === set.id)).join("")}
        </div>
        <div class="exam-spec-grid">
          ${metric("Nghe", `${HSK4_MOCK_SPEC.listening} câu`, "Đúng/Sai, hội thoại ngắn, đoạn dài")}
          ${metric("Đọc", `${HSK4_MOCK_SPEC.reading} câu`, "Điền từ, sắp xếp câu, đọc đoạn")}
          ${metric("Viết", `${HSK4_MOCK_SPEC.writing} câu`, "Sắp câu và viết câu theo gợi ý")}
          ${metric("Dữ liệu hiện có", `${health.total} từ`, health.examReady ? "Đủ mốc số lượng" : "Nên bổ sung đủ 1.200 từ")}
        </div>
        <div class="exam-source-note">
          <strong>Mức sát đề hiện tại</strong>
          <p>
            Cấu trúc, số câu và thời lượng bám theo HSK4 cũ. Phần nghe dùng giọng đọc tổng hợp của trình duyệt,
            phù hợp luyện phản xạ nhưng vẫn nên luyện thêm audio chính thức/licensed trước ngày thi.
          </p>
        </div>
      </article>
      <article class="exam-note">
        <h3>Blueprint 7 phần của bài thi</h3>
        <ul class="exam-blueprint">
          ${blueprintItems}
        </ul>
      </article>
      <article class="exam-note">
        <h3>Chuẩn hóa cho người học trên điện thoại</h3>
        <p>
          Mỗi câu hiển thị một màn hình, nút chọn lớn, có điều hướng trước/sau và thanh tiến độ.
          Khi thi thật trên máy tính, người học đã quen việc đọc nhanh, chọn nhanh và gõ chữ Hán.
        </p>
      </article>
    </section>
  `;
}

function renderMockSetCard(set: MockExamSet, active: boolean): string {
  return `
    <button class="exam-set-card ${active ? "active" : ""}" data-mock-set="${escapeAttribute(set.id)}" type="button">
      <span>${escapeHtml(set.focus)}</span>
      <strong>${escapeHtml(set.title)}</strong>
      <small>${escapeHtml(set.description)}</small>
    </button>
  `;
}

export function renderMockExamRunner(session: MockExamSession, questionIndex: number, remainingMs: number): string {
  const question = session.questions[questionIndex];
  if (!question) {
    return emptyBlock("Chưa có dữ liệu để tạo đề thi thử. Hãy nạp bộ từ 4A/4B trước.");
  }

  const answered = Object.values(session.answers).filter((answer) => answer.trim()).length;
  const progress = percent(questionIndex + 1, session.questions.length);
  const remaining = remainingMs;

  return `
    <section class="exam-runner">
      <header class="exam-status">
        <div>
          <p class="eyebrow">Thi thử HSK4 · ${escapeHtml(session.setTitle)}</p>
          <h2>Câu ${question.number}/${session.questions.length}</h2>
        </div>
        <div class="exam-clock" data-exam-clock>${icon("clock")}<span>${formatExamTime(remaining)}</span></div>
      </header>
      <div class="exam-progress">
        <div class="progress-track"><span style="width: ${progress}%"></span></div>
        <span>${answered}/${session.questions.length} câu đã trả lời</span>
      </div>
      ${renderMockQuestion(question, session.answers[question.id] ?? "")}
      <div class="exam-nav">
        <button class="ghost-button" data-exam-prev ${questionIndex === 0 ? "disabled" : ""}>
          ${labelWithIcon("chevronLeft", "Trước")}
        </button>
        <button class="ghost-button" data-exam-next ${questionIndex >= session.questions.length - 1 ? "disabled" : ""}>
          ${labelWithIcon("chevronRight", "Sau")}
        </button>
        <button class="primary-button" data-submit-mock>${labelWithIcon("check", "Kết thúc và chấm")}</button>
      </div>
    </section>
  `;
}

function renderMockQuestion(question: MockExamQuestion, answer: string): string {
  const optionBlock = question.options?.length
    ? `
      <div class="exam-options">
        ${question.options
          .map(
            (option) => `
              <button class="${answer === option ? "selected" : ""}" data-exam-answer="${escapeAttribute(option)}">
                ${escapeHtml(option)}
              </button>
            `,
          )
          .join("")}
      </div>
    `
    : "";

  const audioBlock = question.audioText
    ? `<button class="ghost-button audio-button" data-play-audio="${escapeAttribute(question.audioText)}">${labelWithIcon("volume", "Nghe lại")}</button>`
    : "";

  if (question.type === "read-order") {
    return `
      <article class="exam-question">
        <div class="exam-question-head">
          <span>${escapeHtml(question.part)}</span>
        </div>
        <h3>${escapeHtml(question.promptVi)}</h3>
        <div class="exam-order-lines">
          ${question.fragments?.map((fragment) => `<p>${escapeHtml(fragment)}</p>`).join("") ?? ""}
        </div>
        ${optionBlock}
      </article>
    `;
  }

  if (question.type === "order-sentence") {
    return `
      <article class="exam-question">
        <div class="exam-question-head">
          <span>${escapeHtml(question.part)}</span>
          ${audioBlock}
        </div>
        <h3>${escapeHtml(question.promptVi)}</h3>
        <div class="fragment-bank">
          ${question.fragments
            ?.map(
              (fragment) => `
                <button class="ghost-button" data-exam-fragment="${escapeAttribute(fragment)}">${escapeHtml(fragment)}</button>
              `,
            )
            .join("") ?? ""}
        </div>
        <label class="exam-text-answer">
          Câu trả lời
          <input data-exam-text value="${escapeAttribute(answer)}" placeholder="Gõ hoặc chạm các cụm để tạo câu..." />
        </label>
        <button class="ghost-button compact-button" data-exam-clear>${labelWithIcon("rotate", "Xóa câu")}</button>
      </article>
    `;
  }

  if (question.type === "write-sentence") {
    return `
      <article class="exam-question">
        <div class="exam-question-head"><span>${escapeHtml(question.part)}</span></div>
        <h3>${escapeHtml(question.promptVi)}</h3>
        ${question.promptHan ? `<p class="exam-cue">${escapeHtml(question.promptHan)}</p>` : ""}
        <label class="exam-text-answer">
          Gõ câu tiếng Trung
          <textarea data-exam-text rows="4" placeholder="Ví dụ: ${escapeAttribute(question.expectedHan ?? "")}">${escapeHtml(answer)}</textarea>
        </label>
        <p class="answer-hint">Chấm tự động ước lượng: câu cần chứa từ mục tiêu và có ít nhất 6 chữ Hán.</p>
      </article>
    `;
  }

  const promptClass =
    question.type === "listen-true-false" || question.type === "read-blank" ? "exam-statement" : "exam-hanzi";

  return `
    <article class="exam-question">
      <div class="exam-question-head">
        <span>${escapeHtml(question.part)}</span>
        ${audioBlock}
      </div>
      <h3>${escapeHtml(question.promptVi)}</h3>
      ${question.promptHan ? `<p class="${promptClass}">${escapeHtml(question.promptHan)}</p>` : ""}
      ${question.passageHan ? `<div class="exam-passage">${escapeHtml(question.passageHan)}</div>` : ""}
      ${question.questionHan ? `<p class="exam-question-line">${escapeHtml(question.questionHan)}</p>` : ""}
      ${optionBlock}
    </article>
  `;
}

export function renderMockExamResults(session: MockExamSession): string {
  const score = scoreMockExam(session);
  return `
    <section class="exam-results">
      <article class="result-card">
        <p class="eyebrow">Kết quả thi thử · ${escapeHtml(session.setTitle)}</p>
        <h2>${score.correct}/${score.total} câu</h2>
        <strong>${score.percent}%</strong>
        <div class="exam-score-line">
          <span>Điểm mô phỏng HSK</span>
          <b>${score.points}/${score.maxPoints}</b>
          <em>${score.passed ? "Đạt ngưỡng 180" : "Chưa đạt ngưỡng 180"}</em>
        </div>
        <p>Điểm viết câu là chấm tự động ước lượng. Với bài thi thật, phần viết nên được giáo viên/người có chuyên môn rà lại.</p>
        <div class="exam-source-note">
          <strong>Nguồn và giới hạn</strong>
          <p>${escapeHtml(session.sourceNote)}</p>
        </div>
        <div class="exam-spec-grid">
          ${score.sections
            .map((section) => metric(section.label, `${section.points}/100`, `${section.correct}/${section.total} câu đúng`))
            .join("")}
        </div>
        <div class="action-row">
          <button class="primary-button" data-start-mock>${labelWithIcon("clipboardList", "Làm đề mới")}</button>
          <button class="ghost-button" data-reset-mock>${labelWithIcon("rotate", "Về màn hình thi thử")}</button>
        </div>
      </article>
    </section>
  `;
}
