import type { AppVersionCheck } from "../../application/ports/app-version-checker";
import {
  APP_DATA_SCHEMA_VERSION,
  INDEXEDDB_SCHEMA_VERSION,
  shortBuildSha,
  versionLabel,
} from "../../domain/app-version";
import type { AppState } from "../../domain/types";
import { icon } from "../../presentation/icons";
import { escapeAttribute, escapeHtml } from "./view-helpers";

export function renderSettingsView(state: AppState, versionCheck?: AppVersionCheck): string {
  const { settings } = state;
  const displayName = settings.displayName || "Hồng";
  const avatarInitial = settings.avatarInitial || "H";
  const currentLesson = Math.min(20, Math.max(1, settings.selectedLesson || 1));

  return `
    <section class="settings-layout account-settings-layout" aria-label="Thiết lập tài khoản học">
      <article class="settings-card account-hero-card">
        <div class="account-hero-main">
          <span class="settings-avatar-preview account-hero-avatar">${escapeHtml(avatarInitial)}</span>
          <div>
            <p class="eyebrow">Tài khoản học</p>
            <h2>${escapeHtml(displayName)}</h2>
            <p>HSK4 4A/4B · dữ liệu lưu trong trình duyệt này.</p>
          </div>
          <span class="settings-save-state">${icon("check")} Tự lưu</span>
        </div>
        <div class="account-hero-stats" aria-label="Tóm tắt nhịp học">
          ${accountStat("Bài đang học", `Bài ${currentLesson}`, "Theo giáo trình 4A/4B")}
          ${accountStat("Từ mới/ngày", String(settings.dailyNewTarget), "Mục tiêu học mới")}
          ${accountStat("Ôn tối đa", String(settings.dailyReviewTarget), "Thẻ ôn mỗi ngày")}
        </div>
      </article>

      <article class="settings-card profile-settings-card">
        <div class="settings-card-head">
          <div>
            <p class="eyebrow">Hồ sơ</p>
            <h2>Thông tin hiển thị</h2>
          </div>
          <span class="settings-card-icon">${icon("user")}</span>
        </div>
        <div class="settings-form-grid">
          <label class="settings-field">
            <span>Tên hiển thị</span>
            <input type="text" maxlength="40" value="${escapeAttribute(displayName)}" data-setting="displayName" autocomplete="name" />
          </label>
          <label class="settings-field settings-field-short">
            <span>Ký hiệu avatar</span>
            <input type="text" maxlength="2" value="${escapeAttribute(avatarInitial)}" data-setting="avatarInitial" aria-label="Ký hiệu avatar" />
          </label>
        </div>
        <p class="settings-helper">Tên và avatar chỉ dùng trong giao diện học của bạn.</p>
      </article>

      <article class="settings-card language-settings-card">
        <div class="settings-card-head">
          <div>
            <p class="eyebrow">Ngôn ngữ</p>
            <h2>Ưu tiên nội dung</h2>
          </div>
          <span class="settings-card-icon">${icon("book")}</span>
        </div>
        <label class="settings-field">
          <span>Ngôn ngữ ứng dụng</span>
          <select data-setting="locale" aria-label="Ngôn ngữ giao diện">
            <option value="vi" ${settings.locale === "vi" ? "selected" : ""}>Tiếng Việt</option>
            <option value="en" ${settings.locale === "en" ? "selected" : ""}>English</option>
          </select>
        </label>
        <label class="toggle-row settings-toggle-row">
          <input type="checkbox" data-setting="useEnglishFallback" ${settings.useEnglishFallback ? "checked" : ""} />
          <span>
            <strong>Dùng nghĩa tiếng Anh dự phòng</strong>
            <small>Chỉ hiện khi một từ chưa có nghĩa tiếng Việt đã duyệt.</small>
          </span>
        </label>
      </article>

      <article class="settings-card settings-rhythm-card">
        <div class="settings-card-head">
          <div>
            <p class="eyebrow">Nhịp học</p>
            <h2>Lịch ôn của Hồng</h2>
          </div>
          <span class="settings-card-icon">${icon("calendar")}</span>
        </div>
        <div class="settings-form-grid settings-form-grid-three">
          <label class="settings-field">
            <span>Từ mới/ngày</span>
            <input type="number" min="5" max="80" value="${settings.dailyNewTarget}" data-setting="dailyNewTarget" />
          </label>
          <label class="settings-field">
            <span>Ôn tối đa/ngày</span>
            <input type="number" min="20" max="240" value="${settings.dailyReviewTarget}" data-setting="dailyReviewTarget" />
          </label>
          <label class="settings-field">
            <span>Ngày bắt đầu</span>
            <input type="date" value="${escapeAttribute(settings.startDate)}" data-setting="startDate" />
          </label>
        </div>
        <p class="settings-helper">Giữ mục tiêu vừa sức để app ưu tiên từ đến hạn và từ sai trước khi thêm từ mới.</p>
      </article>

      <article class="settings-card account-data-card">
        <div class="settings-card-head">
          <div>
            <p class="eyebrow">Dữ liệu</p>
            <h2>Bộ từ và sao lưu</h2>
          </div>
          <span class="settings-card-icon">${icon("database")}</span>
        </div>
        <p class="settings-helper">Nhập Excel, xuất dữ liệu hoặc kiểm tra chất lượng bộ từ ở trang Dữ liệu.</p>
        <button class="ghost-button settings-wide-action" type="button" data-view="data">
          ${icon("database")} Mở Dữ liệu
        </button>
      </article>

      ${renderVersionSettings(versionCheck)}
    </section>
  `;
}

function accountStat(label: string, value: string, hint: string): string {
  return `
    <span>
      <small>${escapeHtml(label)}</small>
      <strong>${escapeHtml(value)}</strong>
      <em>${escapeHtml(hint)}</em>
    </span>
  `;
}

function renderVersionSettings(versionCheck?: AppVersionCheck): string {
  const current = versionCheck?.current;
  const latest = versionCheck?.latest;
  const status = versionCheck?.status ?? "unknown";
  const statusLabel = versionStatusLabel(status);
  const statusClass = `version-status-${status}`;

  return `
    <article class="settings-card version-settings-card">
      <div class="settings-card-head">
        <div>
          <p class="eyebrow">Phiên bản</p>
          <h2>Trạng thái ứng dụng</h2>
        </div>
        <span class="settings-card-icon">${icon(status === "available" ? "alert" : "check")}</span>
      </div>
      <div class="version-summary">
        <div>
          <span class="version-status ${statusClass}">${escapeHtml(statusLabel)}</span>
          <strong>${escapeHtml(current ? versionLabel(current) : "Đang đọc phiên bản")}</strong>
          <small>${escapeHtml(current ? `Nhánh ${current.branch} · build ${shortBuildSha(current.buildSha)}` : "Chưa có metadata build")}</small>
        </div>
        <button class="ghost-button" type="button" data-version-check>${icon("rotate")} Kiểm tra</button>
      </div>
      ${
        latest && status === "available"
          ? `<div class="settings-note version-update-note">
              <span>${icon("alert")}</span>
              <p>Bản mới ${escapeHtml(versionLabel(latest))} đã sẵn sàng. Tải lại để nhận giao diện và logic mới nhất.</p>
              <button class="primary-button" type="button" data-app-reload>Tải lại</button>
            </div>`
          : ""
      }
      <div class="version-detail-grid">
        <span>
          <strong>Schema dữ liệu</strong>
          <small>${escapeHtml(String(current?.dataSchemaVersion ?? APP_DATA_SCHEMA_VERSION))}</small>
        </span>
        <span>
          <strong>IndexedDB</strong>
          <small>${escapeHtml(String(current?.storageSchemaVersion ?? INDEXEDDB_SCHEMA_VERSION))}</small>
        </span>
        <span>
          <strong>Kiểm tra lần cuối</strong>
          <small>${escapeHtml(formatCheckedAt(versionCheck?.checkedAt))}</small>
        </span>
      </div>
      ${versionCheck?.message ? `<p class="version-message">${escapeHtml(versionCheck.message)}</p>` : ""}
    </article>
  `;
}

function versionStatusLabel(status: string): string {
  if (status === "checking") {
    return "Đang kiểm tra";
  }
  if (status === "current") {
    return "Đang là bản mới nhất";
  }
  if (status === "available") {
    return "Có bản mới";
  }
  if (status === "offline") {
    return "Chưa kết nối";
  }
  return "Chưa rõ";
}

function formatCheckedAt(value: string | undefined): string {
  if (!value) {
    return "Chưa kiểm tra";
  }
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(value));
}
