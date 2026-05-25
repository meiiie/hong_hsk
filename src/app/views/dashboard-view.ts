import { LESSON_TITLES } from "../../application/bootstrap/initial-state";
import { HSK4_TARGETS } from "../../domain/hsk4/hsk4-targets";
import type { AppState } from "../../domain/types";
import { computeStats, dueItems, newItemsForLesson, wrongItems } from "../../domain/review/review-service";
import { icon, labelWithIcon } from "../../presentation/icons";
import type { DataHealth } from "../app-types";
import { escapeHtml, metric, percent, queuePreview } from "./view-helpers";

export function renderDashboardView(state: AppState, dataHealth: DataHealth): string {
  const stats = computeStats(state);
  const todayLesson = Math.min(20, stats.planDay);
  const newCards = newItemsForLesson(state, todayLesson);
  const due = dueItems(state);
  const wrong = wrongItems(state);
  const learnedProgress = percent(stats.learned, stats.totalItems);
  const planProgress = percent(Math.min(stats.planDay, 30), 30);
  const meaningQualityGaps = dataHealth.missingVi + dataHealth.draftVi;

  return `
    ${renderReadinessBanner(dataHealth)}

    <section class="metrics-grid">
      ${metric("Bộ 4A/4B", `${Math.min(dataHealth.courseItems, HSK4_TARGETS.standardCourse4ReferenceItems)}/${HSK4_TARGETS.standardCourse4ReferenceItems}`, "Khung theo giáo trình chuẩn Thượng/Hạ")}
      ${metric("Chuẩn thi HSK4 cũ", `${stats.totalItems}/${HSK4_TARGETS.oldExamCumulativeWords}`, "Mục tiêu thi là 1.200 từ tích lũy")}
      ${metric("Cần duyệt nghĩa", meaningQualityGaps.toString(), "Thiếu nghĩa hoặc còn nghĩa nháp")}
      ${metric("Đến hạn hôm nay", stats.dueToday.toString(), "Ưu tiên ôn trước từ mới")}
      ${metric("Đang sai", stats.wrongOpen.toString(), "Sẽ được kéo vào vòng ôn gần")}
      ${metric("Độ chính xác", `${stats.accuracy}%`, "Tính theo log đã chấm")}
    </section>

    <section class="progress-strip" aria-label="Tiến độ ôn tập">
      <div>
        <span>Tiến độ từ vựng</span>
        <strong>${stats.learned}/${stats.totalItems}</strong>
        <div class="progress-track"><span style="width: ${learnedProgress}%"></span></div>
      </div>
      <div>
        <span>Lộ trình 30 ngày</span>
        <strong>Ngày ${stats.planDay}</strong>
        <div class="progress-track"><span style="width: ${planProgress}%"></span></div>
      </div>
      <div>
        <span>Ưu tiên trước khi học mới</span>
        <strong>${due.length + wrong.length}</strong>
        <small>từ đến hạn hoặc vừa sai</small>
      </div>
    </section>

    <section class="workbench">
      <article class="focus-panel">
        <div class="section-title">
          <p class="eyebrow">Hôm nay</p>
          <h2>Bài ${todayLesson}: ${escapeHtml(LESSON_TITLES[todayLesson] ?? "")}</h2>
        </div>
        <p class="lead">
          Quy trình khuyến nghị: ôn từ đến hạn, xử lý từ sai hôm qua, rồi mới học từ mới của bài hôm nay.
          Mỗi đáp án đều được lưu vào log để ngày sau app tự gọi lại.
        </p>
        <div class="today-checklist" aria-label="Thứ tự học hôm nay">
          ${todayChecklist(due.length, wrong.length, newCards.length)}
        </div>
        <div class="action-row">
          <button class="primary-button" data-study-mode="today">${labelWithIcon("calendarCheck", "Ôn theo lịch hôm nay")}</button>
          <button class="ghost-button" data-study-mode="wrong">${labelWithIcon("rotate", "Ôn từ sai")}</button>
          <button class="ghost-button" data-study-mode="lesson">${labelWithIcon("book", "Học bài đang chọn")}</button>
        </div>
      </article>

      <article class="queue-panel">
        <h3>Hàng đợi</h3>
        ${queuePreview("Đến hạn", due, "Chưa có từ đến hạn. Hãy học bài mới trước.")}
        ${queuePreview("Từ sai", wrong, "Chưa có từ sai mở.")}
        ${queuePreview("Từ mới bài hôm nay", newCards, "Bài hôm nay đã hết từ mới hoặc chưa có dữ liệu.")}
      </article>
    </section>
  `;
}

function renderReadinessBanner(health: DataHealth): string {
  const ready = health.examReady && health.qualityReady;
  const statusClass = ready ? "ready" : "needs-work";
  let title = "Dữ liệu đã sẵn sàng để ôn thi HSK4";
  let message = "Bộ từ đã đạt mốc 1.200 từ tích lũy và không còn nghĩa Việt nháp/thiếu nghĩa. Bạn có thể tập trung vào lịch ôn.";

  if (!health.qualityReady) {
    title = "Chưa đạt chất lượng dữ liệu cuối cùng";
    message = `${health.missingVi} từ thiếu nghĩa Việt, ${health.draftVi} nghĩa Việt còn là bản nháp cần duyệt. App sẽ không coi bộ này là sẵn sàng cho học thật cho tới khi nghĩa được kiểm chứng.`;
  } else if (!health.courseReady) {
    title = "Chưa đủ bộ từ theo giáo trình chuẩn 4A/4B";
    message = `${health.courseItems}/${HSK4_TARGETS.standardCourse4ReferenceItems} mục 4A/4B hiện có. Nên nạp đủ bộ Bài 1-20 trước khi chạy lịch 30 ngày theo bài khóa.`;
  } else if (!health.examReady) {
    title = "Đủ khung 4A/4B, nhưng chưa đủ chuẩn thi HSK4 cũ";
    message = `Bộ hiện tại mới đạt ${health.total}/${HSK4_TARGETS.oldExamCumulativeWords} từ so với mục tiêu HSK4 cũ 1.200 từ tích lũy. Nếu nền HSK1-3 chưa chắc, cần bổ sung khoảng ${HSK4_TARGETS.foundationHsk1To3Words} từ nền để ôn thi nghiêm túc.`;
  }

  return `
    <section class="readiness-banner ${statusClass}">
      <div class="banner-icon">${icon(ready ? "check" : "alert")}</div>
      <div>
        <strong>${escapeHtml(title)}</strong>
        <p>${escapeHtml(message)}</p>
      </div>
      <button class="${ready ? "ghost-button" : "primary-button"}" data-view="data">
        ${labelWithIcon("upload", ready ? "Kiểm tra dữ liệu" : "Nhập dữ liệu")}
      </button>
    </section>
  `;
}

function todayChecklist(dueCount: number, wrongCount: number, newCount: number): string {
  const rows = [
    {
      iconName: "calendarCheck" as const,
      title: "Ôn từ đến hạn",
      value: `${dueCount} thẻ`,
      detail: "Làm trước để giữ nhịp spaced repetition.",
    },
    {
      iconName: "rotate" as const,
      title: "Sửa từ sai gần nhất",
      value: `${wrongCount} thẻ`,
      detail: "Từ sai được kéo lên sớm để tránh quên dai.",
    },
    {
      iconName: "book" as const,
      title: "Học từ mới theo bài khóa",
      value: `${newCount} thẻ`,
      detail: "Giữ đúng thứ tự bài 1-20 của quyển Thượng/Hạ.",
    },
  ];

  return rows
    .map(
      (row, index) => `
        <div class="checklist-row">
          <span class="check-index">${index + 1}</span>
          ${icon(row.iconName)}
          <div>
            <strong>${escapeHtml(row.title)}</strong>
            <small>${escapeHtml(row.detail)}</small>
          </div>
          <b>${escapeHtml(row.value)}</b>
        </div>
      `,
    )
    .join("");
}
