import type { View } from "../app-types";
import type { AppVersionCheck } from "../../application/ports/app-version-checker";
import type { AppState, DashboardStats } from "../../domain/types";
import { versionLabel } from "../../domain/app-version";
import { icon, labelWithIcon, type IconName } from "../../presentation/icons";
import { escapeHtml } from "./view-helpers";

interface AppShellViewModel {
  activeView: View;
  sidebarCollapsed: boolean;
  mobileMoreOpen: boolean;
  accountMenuOpen: boolean;
  state: AppState;
  stats: DashboardStats;
  versionCheck?: AppVersionCheck;
  content: string;
}

export function renderAppShell({
  activeView,
  sidebarCollapsed,
  mobileMoreOpen,
  accountMenuOpen,
  state,
  stats,
  versionCheck,
  content,
}: AppShellViewModel): string {
  const learnedPercent = stats.totalItems > 0 ? Math.min(100, Math.round((stats.learned / stats.totalItems) * 100)) : 0;
  const overflowActive = isMobileOverflowView(activeView);
  const moreActive = mobileMoreOpen || overflowActive;
  const displayName = state.settings.displayName || "Hồng";
  const avatarInitial = state.settings.avatarInitial || "H";

  return `
    <div class="app-shell view-${activeView} ${sidebarCollapsed ? "sidebar-collapsed" : ""}">
      <header class="mobile-brand-bar" aria-label="Hồng HSK4 Studio">
        <div class="mobile-brand-lockup">
          <div class="mobile-brand-mark">红</div>
          <div>
            <strong>Hồng HSK4 Studio</strong>
            <span>HSK4 4A/4B</span>
          </div>
        </div>
      </header>
      <aside class="sidebar" aria-label="Không gian học HSK4">
        <div class="sidebar-inner">
          <div class="brand" data-motion="sidebar-brand">
            <div class="brand-mark">红</div>
            <div class="brand-copy">
              <strong>Hồng HSK4</strong>
              <span>Studio 4A/4B</span>
            </div>
            <button
              class="sidebar-toggle"
              data-sidebar-toggle
              type="button"
              aria-label="${sidebarCollapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}"
              aria-expanded="${sidebarCollapsed ? "false" : "true"}"
              title="${sidebarCollapsed ? "Mở rộng" : "Thu gọn"}"
            >
              ${icon(sidebarCollapsed ? "chevronRight" : "chevronLeft")}
            </button>
          </div>
          <nav class="nav" aria-label="Điều hướng" data-motion="sidebar-nav">
            <div class="nav-section nav-section-primary" aria-label="Luyện tập">
              <span class="nav-section-label">Luyện tập</span>
              ${navButton(activeView, "dashboard", "Tổng quan", "layout", "primary")}
              ${navButton(activeView, "study", "Học tập", "keyboard", "primary")}
              ${navButton(activeView, "lessons", "Theo bài", "book", "primary")}
              ${navButton(activeView, "mock", "Thi thử", "clipboardList", "primary")}
            </div>
            <div class="nav-section nav-section-tools" aria-label="Công cụ">
              <span class="nav-section-label">Công cụ</span>
              ${navButton(activeView, "wrong", "Từ sai", "rotate", "overflow")}
              ${navButton(activeView, "plan", "Lịch 30 ngày", "calendar", "overflow")}
            </div>
            <button
              class="mobile-more-trigger ${moreActive ? "active" : ""}"
              type="button"
              data-mobile-more-toggle
              data-motion="sidebar-nav-item"
              ${moreActive ? 'data-motion-active="true"' : ""}
              aria-label="Mở công cụ khác"
              aria-expanded="${mobileMoreOpen ? "true" : "false"}"
              aria-haspopup="dialog"
              title="Thêm"
            >
              ${icon("ellipsis")}
              <span data-mobile-label="Thêm">Thêm</span>
            </button>
          </nav>
          <div class="sidebar-card ${activeView === "settings" || activeView === "data" ? "active" : ""}" data-motion="sidebar-footer">
            <button
              class="sidebar-account-trigger"
              type="button"
              data-account-menu-toggle
              aria-haspopup="menu"
              aria-expanded="${accountMenuOpen ? "true" : "false"}"
              title="Tài khoản học"
            >
              <span class="sidebar-user">
                <span class="sidebar-avatar">${escapeHtml(avatarInitial)}</span>
                <span class="sidebar-user-copy">
                  <span class="sidebar-user-name">${escapeHtml(displayName)}</span>
                  <small>HSK4 4A/4B</small>
                </span>
              </span>
              <strong class="sidebar-account-stat">${stats.learned}/${stats.totalItems}</strong>
              <span class="sidebar-account-caret">${icon("chevronRight")}</span>
            </button>
            ${renderAccountMenu(accountMenuOpen)}
            <div class="sidebar-progress" aria-label="Đã học ${learnedPercent}%" data-motion="sidebar-progress">
              <span style="--progress: ${learnedPercent}%"></span>
            </div>
            <div class="sidebar-card-meta">
              <span>Ngày ${stats.planDay}/30</span>
              <span>${stats.dueToday} cần ôn</span>
              <span>Chuỗi ${stats.streak}</span>
            </div>
            <button class="sidebar-cta" data-study-mode="today" data-motion="sidebar-start">${labelWithIcon("playCircle", "Ôn ngay")}</button>
          </div>
        </div>
      </aside>
      ${renderMobileMoreMenu(activeView, mobileMoreOpen)}
      <main class="main view-${activeView}">
        <header class="topbar">
          <div class="topbar-title">
            <h1>${titleForView(activeView)}</h1>
            ${activeView === "dashboard" ? `<span class="topbar-date">${icon("calendar")} ${escapeHtml(formatTodayDate())}</span>` : ""}
          </div>
        </header>
        ${renderUpdateBanner(versionCheck)}
        ${content}
      </main>
    </div>
  `;
}

function renderUpdateBanner(versionCheck?: AppVersionCheck): string {
  if (versionCheck?.status !== "available" || !versionCheck.latest) {
    return "";
  }

  return `
    <section class="app-update-banner" role="status" aria-live="polite">
      <span>${icon("alert")}</span>
      <div>
        <strong>Có bản cập nhật mới</strong>
        <small>Đang dùng ${escapeHtml(versionLabel(versionCheck.current))}; bản mới ${escapeHtml(versionLabel(versionCheck.latest))} đã sẵn sàng.</small>
      </div>
      <button class="primary-button" type="button" data-app-reload>${labelWithIcon("rotate", "Tải lại")}</button>
    </section>
  `;
}

function renderAccountMenu(accountMenuOpen: boolean): string {
  const hidden = accountMenuOpen ? "" : "hidden";
  return `
    <div class="sidebar-account-menu" role="menu" data-account-menu ${hidden}>
      <button type="button" role="menuitem" data-view="settings">
        <span>${icon("settings")}</span>
        <span>
          <strong>Thiết lập tài khoản</strong>
          <small>Tên, avatar, ngôn ngữ</small>
        </span>
      </button>
      <button type="button" role="menuitem" data-view="data">
        <span>${icon("database")}</span>
        <span>
          <strong>Dữ liệu</strong>
          <small>Nhập, xuất, kiểm tra bộ từ</small>
        </span>
      </button>
    </div>
  `;
}

function navButton(activeView: View, view: View, label: string, iconName: IconName, mobileNav: "primary" | "overflow"): string {
  const isActive = activeView === view;

  return `
    <button class="${isActive ? "active" : ""}" data-view="${view}" data-mobile-nav="${mobileNav}" data-motion="sidebar-nav-item" aria-label="${escapeHtml(label)}" title="${escapeHtml(label)}" ${isActive ? 'aria-current="page" data-motion-active="true"' : ""}>
      ${icon(iconName)}
      <span data-mobile-label="${escapeHtml(shortLabelForView(view))}">${escapeHtml(label)}</span>
    </button>
  `;
}

function renderMobileMoreMenu(activeView: View, mobileMoreOpen: boolean): string {
  const hidden = mobileMoreOpen ? "" : "hidden";
  return `
    <button class="mobile-more-scrim" type="button" data-mobile-more-close aria-label="Đóng công cụ" ${hidden}></button>
    <div class="mobile-more-sheet" data-motion="mobile-more-sheet" role="dialog" aria-modal="true" aria-label="Công cụ" tabindex="-1" ${hidden}>
      <div class="mobile-more-handle" data-mobile-more-drag aria-hidden="true"></div>
      <div class="mobile-more-head">
        <strong>Công cụ</strong>
      </div>
      <div class="mobile-more-list">
        ${mobileMoreItem(activeView, "wrong", "Từ sai", "rotate")}
        ${mobileMoreItem(activeView, "plan", "Lịch 30 ngày", "calendar")}
        ${mobileMoreItem(activeView, "data", "Dữ liệu", "database")}
        ${mobileMoreItem(activeView, "settings", "Cài đặt", "settings")}
      </div>
      <button class="mobile-more-close-button" type="button" data-mobile-more-close>Đóng</button>
    </div>
  `;
}

function mobileMoreItem(activeView: View, view: View, label: string, iconName: IconName): string {
  const isActive = activeView === view;
  return `
    <button class="${isActive ? "active" : ""}" data-view="${view}" ${isActive ? 'aria-current="page"' : ""}>
      <span class="mobile-more-icon">${icon(iconName)}</span>
      <span>${escapeHtml(label)}</span>
      ${icon("chevronRight")}
    </button>
  `;
}

function isMobileOverflowView(view: View): boolean {
  return view === "wrong" || view === "plan" || view === "data" || view === "settings";
}

function shortLabelForView(view: View): string {
  const labels: Record<View, string> = {
    dashboard: "Ôn",
    study: "Học",
    lessons: "Bài",
    wrong: "Sai",
    mock: "Thi",
    plan: "Lịch",
    data: "Dữ liệu",
    settings: "Cài",
  };
  return labels[view];
}

function titleForView(view: View): string {
  const titles: Record<View, string> = {
    dashboard: "Hôm nay",
    study: "Học tập",
    lessons: "Theo bài",
    wrong: "Từ cần sửa",
    mock: "Thi thử HSK4",
    plan: "Lịch ôn 30 ngày",
    data: "Dữ liệu",
    settings: "Cài đặt",
  };
  return titles[view];
}

function formatTodayDate(): string {
  const now = new Date();
  const date = new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(now);
  const time = new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(now);

  return `${date}, ${time} (Việt Nam)`;
}
