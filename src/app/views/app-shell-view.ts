import type { View } from "../app-types";
import type { AppState, DashboardStats } from "../../domain/types";
import { icon, labelWithIcon, type IconName } from "../../presentation/icons";
import { escapeHtml } from "./view-helpers";

interface AppShellViewModel {
  activeView: View;
  state: AppState;
  stats: DashboardStats;
  content: string;
}

export function renderAppShell({ activeView, state, stats, content }: AppShellViewModel): string {
  return `
    <div class="app-shell">
      <aside class="sidebar">
        <div class="brand">
          <div class="brand-mark">红</div>
          <div>
            <strong>Hồng HSK4 Studio</strong>
            <span>Luyện Hán tự 4A/4B</span>
          </div>
        </div>
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
          <span>Ngày ${stats.planDay}/30</span>
          <strong>${stats.learned}/${stats.totalItems}</strong>
          <small>từ đã chạm ít nhất một lần</small>
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
  return `
    <button class="${activeView === view ? "active" : ""}" data-view="${view}">
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
