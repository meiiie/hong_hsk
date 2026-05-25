import type { View } from "../app-types";
import type { AppState, DashboardStats } from "../../domain/types";
import { icon, labelWithIcon, type IconName } from "../../presentation/icons";
import { escapeHtml } from "./view-helpers";

interface AppShellViewModel {
  activeView: View;
  sidebarCollapsed: boolean;
  state: AppState;
  stats: DashboardStats;
  content: string;
}

export function renderAppShell({ activeView, sidebarCollapsed, state, stats, content }: AppShellViewModel): string {
  const learnedPercent = stats.totalItems > 0 ? Math.min(100, Math.round((stats.learned / stats.totalItems) * 100)) : 0;

  return `
    <div class="app-shell ${sidebarCollapsed ? "sidebar-collapsed" : ""}">
      <aside class="sidebar" aria-label="Không gian học HSK4">
        <div class="sidebar-inner">
          <div class="brand">
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
          <span class="sidebar-kicker">Luyện tập</span>
          <nav class="nav" aria-label="Điều hướng">
            ${navButton(activeView, "dashboard", "Tổng quan", "layout")}
            ${navButton(activeView, "study", "Học hôm nay", "keyboard")}
            ${navButton(activeView, "lessons", "Theo bài", "book")}
            ${navButton(activeView, "wrong", "Từ sai", "rotate")}
            ${navButton(activeView, "mock", "Thi thử", "clipboardList")}
            ${navButton(activeView, "plan", "Lịch 30 ngày", "calendar")}
            ${navButton(activeView, "data", "Dữ liệu", "database")}
          </nav>
          <div class="sidebar-card">
            <div class="sidebar-card-head">
              <span>Ngày ${stats.planDay}/30</span>
              <strong>${stats.learned}/${stats.totalItems}</strong>
            </div>
            <div class="sidebar-progress" aria-label="Đã học ${learnedPercent}%">
              <span style="--progress: ${learnedPercent}%"></span>
            </div>
            <div class="sidebar-stats">
              <span><b>${stats.learned}</b><small>đã học</small></span>
              <span><b>${stats.dueToday}</b><small>cần ôn</small></span>
              <span><b>${stats.streak}</b><small>chuỗi ngày</small></span>
            </div>
            <button class="sidebar-cta" data-study-mode="today">${labelWithIcon("playCircle", "Bắt đầu ôn")}</button>
          </div>
        </div>
      </aside>
      <main class="main view-${activeView}">
        <header class="topbar">
          <div>
            <h1>${titleForView(activeView)}</h1>
          </div>
          <div class="top-actions">
            <button class="ghost-button" data-study-mode="today">${labelWithIcon("playCircle", "Bắt đầu ôn")}</button>
            <button class="primary-button" data-view="data">${labelWithIcon("upload", "Nhập Excel")}</button>
            <label class="language-switcher">
              <span>Ngôn ngữ</span>
              <select data-setting="locale" aria-label="Ngôn ngữ giao diện">
                <option value="vi" ${state.settings.locale === "vi" ? "selected" : ""}>Tiếng Việt</option>
                <option value="en" ${state.settings.locale === "en" ? "selected" : ""}>English</option>
              </select>
            </label>
          </div>
        </header>
        ${content}
      </main>
    </div>
  `;
}

function navButton(activeView: View, view: View, label: string, iconName: IconName): string {
  const isActive = activeView === view;

  return `
    <button class="${isActive ? "active" : ""}" data-view="${view}" aria-label="${escapeHtml(label)}" title="${escapeHtml(label)}" ${isActive ? 'aria-current="page"' : ""}>
      ${icon(iconName)}
      <span>${escapeHtml(label)}</span>
    </button>
  `;
}

function titleForView(view: View): string {
  const titles: Record<View, string> = {
    dashboard: "Tổng quan hôm nay",
    study: "Học hôm nay",
    lessons: "Theo bài",
    wrong: "Từ cần sửa",
    mock: "Thi thử HSK4",
    plan: "Lịch ôn 30 ngày",
    data: "Dữ liệu học",
  };
  return titles[view];
}
