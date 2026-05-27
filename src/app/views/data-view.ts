import { countDraftVietnameseMeanings, isDraftVietnameseMeaning } from "../../application/vocab/data-enrichment";
import { HSK4_TARGETS } from "../../domain/hsk4/hsk4-targets";
import type { AppState } from "../../domain/types";
import { icon, labelWithIcon } from "../../presentation/icons";
import type { DataHealth } from "../app-types";
import { escapeHtml, metric, percent } from "./view-helpers";

export function renderDataView(state: AppState): string {
  const health = getDataHealthStats(state);
  const coursePercent = percent(health.courseItems, HSK4_TARGETS.standardCourse4ReferenceItems);
  const examPercent = percent(health.total, HSK4_TARGETS.oldExamCumulativeWords);

  return `
    <section class="page-stack data-page">
      <section class="page-hero data-hero">
        <div class="page-hero-copy">
          <p class="eyebrow">Kho dữ liệu học</p>
          <h2>Kho từ của Hồng</h2>
          <p>Quản lý bộ từ HSK4 4A/4B, kiểm tra nghĩa tiếng Việt và sao lưu tiến độ học trong trình duyệt này.</p>
        </div>
        <div class="data-hero-score" aria-label="Độ phủ dữ liệu">
          <span>Bộ 4A/4B</span>
          <strong>${Math.min(health.courseItems, HSK4_TARGETS.standardCourse4ReferenceItems)}/${HSK4_TARGETS.standardCourse4ReferenceItems}</strong>
          <div class="progress-track"><span style="width: ${coursePercent}%"></span></div>
        </div>
      </section>

      <section class="data-command-grid">
        <article class="data-card data-import-card">
          <div class="data-card-head">
            <span>${icon("upload")}</span>
            <div>
              <h2>Nhập dữ liệu chuẩn</h2>
              <p>Excel/CSV theo các cột: Bài, Từ Hán, Pinyin, Nghĩa Việt, Ví dụ Hán, Ví dụ Việt, Nghĩa Anh dự phòng.</p>
            </div>
          </div>
          <div class="file-box">
            <label class="file-picker" for="file-import">${labelWithIcon("fileText", "Chọn file")}</label>
            <input id="file-import" class="sr-only" type="file" accept=".xlsx,.csv" />
            <span class="file-name" data-file-name>Chưa chọn file</span>
            <button class="primary-button" data-import-file>${labelWithIcon("upload", "Nhập")}</button>
          </div>
          <label class="toggle-row">
            <input type="checkbox" data-setting="useEnglishFallback" ${state.settings.useEnglishFallback ? "checked" : ""} />
            <span>Dùng nghĩa tiếng Anh làm dự phòng khi từ chưa có nghĩa tiếng Việt.</span>
          </label>
          <div class="button-grid">
            <button class="ghost-button" data-template-csv>${labelWithIcon("fileText", "Mẫu CSV")}</button>
            <button class="ghost-button" data-load-reference>${labelWithIcon("database", "Nạp bộ 20 bài")}</button>
          </div>
        </article>

        <article class="data-card data-export-card">
          <div class="data-card-head">
            <span>${icon("databaseBackup")}</span>
            <div>
              <h2>Sao lưu và xuất file</h2>
              <p>Xuất từ vựng, log chấm, trạng thái ôn và lộ trình để cất giữ hoặc gửi qua Excel.</p>
            </div>
          </div>
          <div class="button-grid export-grid">
            <button class="primary-button" data-export-xlsx>${labelWithIcon("fileSpreadsheet", "Xuất Excel")}</button>
            <button class="ghost-button" data-export-csv>${labelWithIcon("download", "Xuất CSV")}</button>
            <button class="ghost-button" data-export-json>${labelWithIcon("databaseBackup", "Sao lưu JSON")}</button>
            <button class="danger-button" data-reset-app>${labelWithIcon("trash", "Xóa dữ liệu")}</button>
          </div>
          <p class="fine-print">Dữ liệu học đang lưu cục bộ bằng IndexedDB. Hãy xuất JSON/Excel trước khi đổi máy hoặc xóa trình duyệt.</p>
        </article>
      </section>

      <article class="data-card data-quality-card">
        <div class="data-quality-head">
          <div>
            <p class="eyebrow">Chất lượng dữ liệu</p>
            <h2>Tình trạng bộ từ hiện tại</h2>
          </div>
          <span class="data-quality-badge">${examPercent}% mốc HSK4 cũ</span>
        </div>
        ${renderDataHealth(state, health)}
      </article>
    </section>
  `;
}

function renderDataHealth(state: AppState, health = getDataHealthStats(state)): string {
  const byLesson = Array.from({ length: 20 }, (_, index) => {
    const lesson = index + 1;
    return state.items.filter((item) => item.lesson === lesson).length;
  });

  return `
    <div class="health-grid">
      ${metric("Bộ 4A/4B", `${Math.min(health.courseItems, HSK4_TARGETS.standardCourse4ReferenceItems)}/${HSK4_TARGETS.standardCourse4ReferenceItems}`, "Khung theo giáo trình chuẩn")}
      ${metric("Chuẩn thi HSK4 cũ", `${health.total}/${HSK4_TARGETS.oldExamCumulativeWords}`, "Mục tiêu 1.200 từ tích lũy")}
      ${metric("Thiếu nghĩa Việt", health.missingVi.toString(), "Cần bổ sung trước khi học thật")}
      ${metric("Nghĩa cần duyệt", health.draftVi.toString(), "Chưa tính là bản cuối")}
      ${metric("Thiếu ví dụ", health.missingExamples.toString(), "Tốt cho đọc lại bài khóa")}
      ${metric("HSK1-3 nền", health.examReady ? "Đủ số lượng" : `${HSK4_TARGETS.foundationHsk1To3Words} từ`, "Cần xác nhận nếu thi HSK4")}
    </div>
    ${translationQaBlock(state)}
    <div class="lesson-bars" aria-label="Số từ theo từng bài">
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
        <span>${icon("check")}</span>
        <div>
          <strong>Nghĩa tiếng Việt đã qua cổng chất lượng</strong>
          <p>Không còn mục thiếu nghĩa hoặc nghĩa tự bổ sung bị đánh dấu cần duyệt.</p>
        </div>
      </div>
    `;
  }

  const samples = [...missingItems, ...draftItems].slice(0, 8);
  return `
    <div class="qa-panel warning">
      <span>${icon("alert")}</span>
      <div>
        <strong>Cần duyệt lại nghĩa tiếng Việt</strong>
        <p>Ưu tiên sửa các mục dưới đây bằng tiếng Việt tự nhiên, ngắn và đúng sắc thái HSK4 trước khi coi dữ liệu là bản cuối.</p>
        <ul>
          ${samples
            .map(
              (item) => `
                <li>
                  <span class="hanzi-cell">${escapeHtml(item.hanzi)}</span>
                  <small>Bài ${item.lesson} · ${escapeHtml(item.meaningVi || item.meaningEn || "Thiếu nghĩa")}</small>
                </li>
              `,
            )
            .join("")}
        </ul>
      </div>
    </div>
  `;
}
