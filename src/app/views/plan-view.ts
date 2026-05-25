import { LESSON_TITLES } from "../../application/bootstrap/initial-state";
import { HSK4_REVIEW_POLICY } from "../../domain/review/review-policy";
import type { AppState } from "../../domain/types";
import { addDays, formatDateVi, toDateKey } from "../../shared/date-utils";
import { escapeAttribute, escapeHtml } from "./view-helpers";

export function renderPlanView(state: AppState): string {
  const start = state.settings.startDate;
  return `
    <section class="plan-rationale">
      <article>
        <span>1</span>
        <strong>Bám bài khóa 4A/4B</strong>
        <p>20 ngày đầu đi đúng Bài 1-20 của giáo trình Thượng/Hạ, không xếp từ theo alphabet.</p>
      </article>
      <article>
        <span>2</span>
        <strong>Không bỏ nền HSK1-3</strong>
        <p>HSK4 cũ là mục tiêu 1.200 từ tích lũy; bộ 4A/4B cần đi kèm phần kiểm tra lại khoảng 600 từ nền.</p>
      </article>
      <article>
        <span>3</span>
        <strong>Gõ để nhớ chủ động</strong>
        <p>Mỗi thẻ yêu cầu tự gõ chữ Hán, vì thi máy tính cần phản xạ nhập liệu chứ không chỉ nhận mặt chữ.</p>
      </article>
      <article>
        <span>4</span>
        <strong>Ôn giãn cách</strong>
        <p>Sai ôn lại sau ${HSK4_REVIEW_POLICY.recoveryDays} ngày; đúng tăng khoảng ôn ${HSK4_REVIEW_POLICY.firstRecallDays}-${HSK4_REVIEW_POLICY.thirdRecallEasyDays}+ ngày, 3 ngày cuối chuyển sang mô phỏng thi.</p>
      </article>
    </section>
    <section class="plan-panel">
      <div class="settings-card">
        <h2>Thiết lập lộ trình</h2>
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
      </div>
      <div class="timeline">
        ${Array.from({ length: 30 }, (_, index) => planRow(state, index + 1)).join("")}
      </div>
    </section>
  `;
}

function planRow(state: AppState, day: number): string {
  const date = addDays(state.settings.startDate, day - 1);
  const isToday = date === toDateKey();
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
      ? "Bài khóa 4A/4B + ôn từ đến hạn + gõ chữ Hán"
      : day <= 24
        ? "Ôn vòng 2, từ sai và kiểm tra lại nền HSK1-3"
        : day <= 27
          ? "Trộn bài 1-20, đọc lại ngữ cảnh"
          : "Luyện tốc độ, kiểm tra tâm lý phòng thi";

  return `
    <div class="timeline-row ${isToday ? "today" : ""}">
      <span>Ngày ${day}</span>
      <strong>${escapeHtml(title)}</strong>
      <small>${formatDateVi(date)} - ${escapeHtml(detail)}</small>
    </div>
  `;
}
