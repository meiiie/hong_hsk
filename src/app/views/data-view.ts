import { countDraftVietnameseMeanings, isDraftVietnameseMeaning } from "../../application/vocab/data-enrichment";
import { HSK4_TARGETS } from "../../domain/hsk4/hsk4-targets";
import type { AppState } from "../../domain/types";
import { labelWithIcon } from "../../presentation/icons";
import type { DataHealth } from "../app-types";
import { escapeHtml, metric } from "./view-helpers";

export function renderDataView(state: AppState): string {
  return `
    <section class="data-layout">
      <article class="data-card">
        <h2>Nhập dữ liệu chuẩn</h2>
        <p>
          App ưu tiên file Excel/CSV bạn tự kiểm chứng theo giáo trình chuẩn HSK4 上/下.
          Header được nhận: Bài, Từ Hán, Pinyin, Nghĩa Việt, Ví dụ Hán, Ví dụ Việt, Nghĩa Anh dự phòng.
        </p>
        <div class="file-box">
          <label class="file-picker" for="file-import">${labelWithIcon("fileText", "Chọn file Excel/CSV")}</label>
          <input id="file-import" class="sr-only" type="file" accept=".xlsx,.csv" />
          <span class="file-name" data-file-name>Chưa chọn file</span>
          <button class="primary-button" data-import-file>${labelWithIcon("upload", "Nhập file")}</button>
        </div>
        <label class="toggle-row">
          <input type="checkbox" data-setting="useEnglishFallback" ${state.settings.useEnglishFallback ? "checked" : ""} />
          <span>Dùng nghĩa tiếng Anh làm dự phòng khi từ chưa có nghĩa tiếng Việt</span>
        </label>
        <div class="button-grid">
          <button class="ghost-button" data-template-csv>${labelWithIcon("fileText", "Tải mẫu CSV")}</button>
          <button class="ghost-button" data-load-reference>${labelWithIcon("database", "Nạp bộ 20 bài từ Excel")}</button>
        </div>
        <p class="fine-print">
          Bộ mặc định được đóng gói từ file Excel ôn 20 bài, gồm nghĩa tiếng Việt và ví dụ đã biên soạn cho người học Việt.
          Bạn vẫn có thể nhập file riêng để thay thế dữ liệu này.
        </p>
      </article>

      <article class="data-card">
        <h2>Sao lưu và xuất file</h2>
        <p>Xuất lại toàn bộ từ vựng, log chấm, trạng thái ôn và lịch 30 ngày để gửi qua Excel.</p>
        <div class="button-grid">
          <button class="primary-button" data-export-xlsx>${labelWithIcon("fileSpreadsheet", "Xuất file Excel")}</button>
          <button class="ghost-button" data-export-csv>${labelWithIcon("download", "Xuất từ vựng CSV")}</button>
          <button class="ghost-button" data-export-json>${labelWithIcon("databaseBackup", "Sao lưu JSON")}</button>
          <button class="danger-button" data-reset-app>${labelWithIcon("trash", "Xóa dữ liệu hiện tại")}</button>
        </div>
      </article>

      <article class="data-card wide">
        <h2>Thông số dữ liệu hiện tại</h2>
        ${renderDataHealth(state)}
      </article>
    </section>
  `;
}

function renderDataHealth(state: AppState): string {
  const health = getDataHealthStats(state);
  const byLesson = Array.from({ length: 20 }, (_, index) => {
    const lesson = index + 1;
    return state.items.filter((item) => item.lesson === lesson).length;
  });

  return `
    <div class="health-grid">
      ${metric("Bộ 4A/4B", `${Math.min(health.courseItems, HSK4_TARGETS.standardCourse4ReferenceItems)}/${HSK4_TARGETS.standardCourse4ReferenceItems}`, "Mục tiêu theo giáo trình chuẩn")}
      ${metric("Chuẩn thi HSK4 cũ", `${health.total}/${HSK4_TARGETS.oldExamCumulativeWords}`, "Cần 1.200 từ tích lũy")}
      ${metric("Thiếu nghĩa Việt", health.missingVi.toString(), "Nên bổ sung trước khi học thật")}
      ${metric("Nghĩa cần duyệt", health.draftVi.toString(), "Tự bổ sung, chưa tính là bản cuối")}
      ${metric("Thiếu ví dụ", health.missingExamples.toString(), "Không bắt buộc, nhưng rất tốt cho bài khóa")}
      ${metric("HSK1-3 nền", health.examReady ? "Đủ số lượng" : `${HSK4_TARGETS.foundationHsk1To3Words} từ`, "Cần xác nhận nếu mục tiêu là thi HSK4")}
    </div>
    ${translationQaBlock(state)}
    <div class="lesson-bars">
      ${byLesson
        .map(
          (count, index) => `
            <div>
              <span>B${index + 1}</span>
              <meter min="0" max="45" value="${count}"></meter>
              <small>${count}</small>
            </div>
          `,
        )
        .join("")}
    </div>
  `;
}

export function getDataHealthStats(state: AppState): DataHealth {
  const total = state.items.length;
  const courseItems = state.items.filter((item) => item.book === "4A" || item.book === "4B").length;
  const missingVi = state.items.filter((item) => !item.meaningVi.trim()).length;
  const draftVi = countDraftVietnameseMeanings(state.items);
  return {
    total,
    courseItems,
    missingVi,
    missingExamples: state.items.filter((item) => !item.exampleHan.trim()).length,
    draftVi,
    courseReady: courseItems >= HSK4_TARGETS.standardCourse4ReferenceItems && missingVi === 0,
    examReady: total >= HSK4_TARGETS.oldExamCumulativeWords && missingVi === 0,
    qualityReady: missingVi === 0 && draftVi === 0,
  };
}

function translationQaBlock(state: AppState): string {
  const draftItems = state.items.filter(isDraftVietnameseMeaning).slice(0, 8);
  const missingItems = state.items.filter((item) => !item.meaningVi.trim()).slice(0, 8);
  if (!draftItems.length && !missingItems.length) {
    return `
      <div class="qa-panel good">
        <strong>Nghĩa tiếng Việt đã qua cổng chất lượng</strong>
        <p>Không còn mục thiếu nghĩa hoặc nghĩa tự bổ sung bị đánh dấu cần duyệt.</p>
      </div>
    `;
  }

  const samples = [...missingItems, ...draftItems].slice(0, 8);
  return `
    <div class="qa-panel warning">
      <strong>Cổng chất lượng nghĩa tiếng Việt đang chặn học thật</strong>
      <p>
        Các mục dưới đây cần được duyệt lại bằng tiếng Việt tự nhiên, ngắn, đúng sắc thái HSK4.
        Mình không coi dịch máy là bản cuối cho tới khi cờ này được xử lý.
      </p>
      <ul>
        ${samples
          .map(
            (item) => `
              <li>
                <span class="hanzi-cell">${escapeHtml(item.hanzi)}</span>
                <small>Bài ${item.lesson} - ${escapeHtml(item.meaningVi || item.meaningEn || "Thiếu nghĩa")}</small>
              </li>
            `,
          )
          .join("")}
      </ul>
    </div>
  `;
}
