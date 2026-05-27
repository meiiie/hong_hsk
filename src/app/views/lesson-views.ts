import { LESSON_TITLES } from "../../application/bootstrap/initial-state";
import {
  getLessonListeningTracks,
  type LessonListeningTrack,
} from "../../domain/hsk4/lesson-listening";
import { progressForLesson, wrongItems } from "../../domain/review/review-service";
import type { AppState, VocabItem } from "../../domain/types";
import { icon, labelWithIcon } from "../../presentation/icons";
import { toDateKey } from "../../shared/date-utils";
import { emptyBlock, escapeAttribute, escapeHtml, percent, vocabTable } from "./view-helpers";

export interface LessonListeningViewState {
  trackId?: string;
  audioUrl?: string;
  loadingTrackId?: string;
  error?: string;
  playbackRate: number;
  transcriptTrackId?: string;
  transcripts: Record<string, string>;
}

export function renderLessonsView(state: AppState, listening?: LessonListeningViewState): string {
  const selected = state.settings.selectedLesson;
  const items = state.items
    .filter((item) => item.lesson === selected)
    .sort((left, right) => left.order - right.order);
  const progress = progressForLesson(state, selected);
  const learnedPercent = percent(progress.learned, progress.total);
  const bookLabel = selected <= 10 ? "Quyển Thượng" : "Quyển Hạ";

  return `
    <section class="page-stack lessons-page">
      <section class="page-hero lesson-hero">
        <div class="page-hero-copy">
          <p class="eyebrow">Theo giáo trình chuẩn 4A/4B</p>
          <h2>Bài ${selected}: ${escapeHtml(LESSON_TITLES[selected] ?? "")}</h2>
          <p>Chọn đúng bài khóa để học từ mới, xem nghĩa tiếng Việt và theo dõi phần đã nhớ trước khi chuyển bài.</p>
        </div>
        <div class="page-hero-actions">
          <button class="primary-button" data-study-mode="lesson">${labelWithIcon("book", "Học bài này")}</button>
          <button class="ghost-button" data-view="study">${labelWithIcon("keyboard", "Gõ chữ Hán")}</button>
        </div>
      </section>

      <section class="lesson-workspace">
        <aside class="lesson-picker-panel" aria-label="Danh sách bài học">
          <div class="panel-kicker">
            <strong>20 bài</strong>
            <small>4A · 4B</small>
          </div>
          <div class="lesson-picker">
            ${Array.from({ length: 20 }, (_, index) => lessonButton(state, selected, index + 1)).join("")}
          </div>
        </aside>

        <article class="table-panel lesson-detail-panel">
          <div class="table-head lesson-detail-head">
            <div>
              <p class="eyebrow">${bookLabel}</p>
              <h2>${escapeHtml(LESSON_TITLES[selected] ?? `Bài ${selected}`)}</h2>
            </div>
            <span class="lesson-progress-badge">${progress.learned}/${progress.total || 0}</span>
          </div>

          <div class="lesson-progress-card">
            <div>
              <span>Tiến độ bài ${selected}</span>
              <strong>${learnedPercent}%</strong>
            </div>
            <div class="progress-track lesson-progress-track">
              <span style="width: ${learnedPercent}%"></span>
            </div>
          </div>

          <div class="lesson-stat-row">
            ${lessonStat("Đã học", progress.learned, "book")}
            ${lessonStat("Đang sai", progress.wrong, "rotate")}
            ${lessonStat("Đã vững", progress.mastered, "check")}
          </div>

          ${vocabTable(items, state)}
          ${renderLessonListening(selected, listening)}
        </article>
      </section>
    </section>
  `;
}

export function renderWrongView(state: AppState): string {
  const items = wrongItems(state);
  const today = toDateKey();
  const dueNow = items.filter((item) => state.reviews[item.id]?.nextReviewDate <= today).length;
  const maxWrong = items.reduce((max, item) => Math.max(max, state.reviews[item.id]?.wrongCount ?? 0), 0);
  const preview = items.slice(0, 3);

  return `
    <section class="page-stack wrong-page">
      <section class="page-hero recovery-hero">
        <div class="page-hero-copy">
          <p class="eyebrow">Sửa lỗi trước khi học mới</p>
          <h2>Từ sai lần gần nhất</h2>
          <p>${items.length ? "Ưu tiên các từ vừa gõ sai để khóa lại ký ức đúng, tránh để lỗi kéo dài sang bài mới." : "Khi Hồng gõ sai, app sẽ tự đưa từ vào đây để ôn lại đúng nhịp."}</p>
        </div>
        <div class="page-hero-actions">
          ${
            items.length
              ? `<button class="primary-button" data-study-mode="wrong">${labelWithIcon("rotate", "Ôn nhóm này")}</button>
                 <button class="ghost-button" data-study-mode="today">${labelWithIcon("calendarCheck", "Về hàng đợi")}</button>`
              : `<button class="primary-button" data-study-mode="today">${labelWithIcon("calendarCheck", "Ôn hôm nay")}</button>
                 <button class="ghost-button" data-view="lessons">${labelWithIcon("book", "Xem theo bài")}</button>`
          }
        </div>
      </section>

      <section class="recovery-summary-grid">
        ${recoveryMetric("Đang sai", items.length, "từ cần sửa", "rotate")}
        ${recoveryMetric("Đến hạn", dueNow, "nên làm trước", "calendarCheck")}
        ${recoveryMetric("Sai nhiều nhất", maxWrong, "lần trên một từ", "alert")}
      </section>

      ${
        preview.length
          ? `<section class="recovery-preview" aria-label="Từ sai nổi bật">
              ${preview.map((item) => recoveryPreviewItem(item, state)).join("")}
            </section>`
          : ""
      }

      <article class="table-panel recovery-table-panel">
        ${items.length ? vocabTable(items, state) : emptyBlock("Chưa có từ sai. Hãy học hoặc ôn hôm nay, từ gõ sai sẽ tự được đưa về đây.")}
      </article>
    </section>
  `;
}

function lessonButton(state: AppState, selected: number, lesson: number): string {
  const itemProgress = progressForLesson(state, lesson);
  const lessonPercent = percent(itemProgress.learned, itemProgress.total);
  const isActive = selected === lesson;

  return `
    <button class="${isActive ? "active" : ""}" data-lesson="${lesson}" aria-label="Bài ${lesson}">
      <span>
        <strong>${lesson}</strong>
        <small>${lesson <= 10 ? "4A" : "4B"}</small>
      </span>
      <span class="lesson-button-progress" aria-hidden="true">
        <span style="width: ${lessonPercent}%"></span>
      </span>
      <em>${itemProgress.learned}/${itemProgress.total || 0}</em>
    </button>
  `;
}

function lessonStat(label: string, value: number, iconName: "book" | "rotate" | "check"): string {
  return `
    <div class="lesson-stat">
      <span>${icon(iconName)}</span>
      <strong>${value}</strong>
      <small>${escapeHtml(label)}</small>
    </div>
  `;
}

function renderLessonListening(lesson: number, listening?: LessonListeningViewState): string {
  const tracks = getLessonListeningTracks(lesson);
  if (!tracks.length) {
    return "";
  }
  const viewState = listening ?? { playbackRate: 1, transcripts: {} };

  return `
    <section class="lesson-listening" aria-labelledby="lesson-listening-title">
      <div class="lesson-listening-head">
        <div>
          <p class="eyebrow">Nghe bài khóa</p>
          <h3 id="lesson-listening-title">Bài ${lesson}: nghe rồi chép lại</h3>
        </div>
        <a class="ghost-button lesson-source-link" href="${escapeAttribute(tracks[0].seriesUrl)}" target="_blank" rel="noreferrer">
          ${labelWithIcon("fileText", "Nguồn BLCUP")}
        </a>
      </div>
      <div class="lesson-track-list">
        ${tracks.map((track) => renderLessonTrack(track, viewState)).join("")}
      </div>
    </section>
  `;
}

function renderLessonTrack(track: LessonListeningTrack, listening: LessonListeningViewState): string {
  const active = listening.trackId === track.id;
  const loading = listening.loadingTrackId === track.id;
  const transcriptOpen = listening.transcriptTrackId === track.id;
  const transcript = listening.transcripts[track.id]?.trim() ?? "";

  return `
    <article class="lesson-track ${active ? "active" : ""}">
      <div class="lesson-track-main">
        <div class="lesson-track-title">
          <strong>${escapeHtml(track.title)}</strong>
          <small>${escapeHtml(track.sourceTitle)}</small>
        </div>
        <div class="lesson-track-actions">
          <button type="button" class="primary-button" data-lesson-audio="${escapeAttribute(track.id)}" ${loading ? "disabled" : ""}>
            ${labelWithIcon(loading ? "clock" : "volume", loading ? "Đang mở" : active ? "Nghe lại" : "Nghe")}
          </button>
          <button type="button" class="ghost-button" data-transcript-toggle="${escapeAttribute(track.id)}">
            ${labelWithIcon(transcriptOpen ? "eyeOff" : "eye", transcriptOpen ? "Ẩn transcript" : "Xem transcript")}
          </button>
          <a class="ghost-button lesson-source-link" href="${escapeAttribute(track.resourceUrl)}" target="_blank" rel="noreferrer">
            ${labelWithIcon("fileText", "Nguồn")}
          </a>
        </div>
      </div>
      ${
        active
          ? `<div class="lesson-audio-panel">
              ${
                loading
                  ? `<p class="muted">Đang lấy audio từ BLCUP...</p>`
                  : listening.audioUrl
                    ? renderLessonAudioPlayer(track, listening)
                    : ""
              }
              ${listening.error ? `<p class="audio-error">${escapeHtml(listening.error)}</p>` : ""}
            </div>`
          : ""
      }
      ${transcriptOpen ? renderTranscriptPanel(track, transcript) : ""}
    </article>
  `;
}

function renderLessonAudioPlayer(track: LessonListeningTrack, listening: LessonListeningViewState): string {
  const rates = [0.75, 1, 1.25];
  return `
    <div class="lesson-audio-player">
      <audio
        controls
        preload="none"
        src="${escapeAttribute(listening.audioUrl ?? "")}"
        data-lesson-audio-player="${escapeAttribute(track.id)}"
      ></audio>
      <div class="speed-controls" aria-label="Tốc độ nghe">
        ${rates
          .map(
            (rate) => `
              <button
                type="button"
                class="${listening.playbackRate === rate ? "active" : ""}"
                data-lesson-audio-speed="${rate}"
              >${rate}x</button>
            `,
          )
          .join("")}
      </div>
    </div>
  `;
}

function renderTranscriptPanel(track: LessonListeningTrack, transcript: string): string {
  return `
    <div class="lesson-transcript-panel">
      ${
        transcript
          ? `<div class="lesson-transcript-text" lang="zh-Hans">${formatTranscript(transcript)}</div>`
          : `<p class="muted">Chưa có transcript chữ Hán cho đoạn này trong app.</p>`
      }
      <form class="transcript-form" data-transcript-form="${escapeAttribute(track.id)}">
        <label for="transcript-${escapeAttribute(track.id)}">Transcript chữ Hán</label>
        <textarea id="transcript-${escapeAttribute(track.id)}" rows="4" placeholder="Dán chữ Hán để lần sau bấm xem transcript...">${escapeHtml(transcript)}</textarea>
        <button type="submit" class="ghost-button">${labelWithIcon("check", "Lưu transcript")}</button>
      </form>
    </div>
  `;
}

function recoveryMetric(label: string, value: number, hint: string, iconName: "rotate" | "calendarCheck" | "alert"): string {
  return `
    <article class="recovery-metric">
      <span>${icon(iconName)}</span>
      <div>
        <strong>${value}</strong>
        <small>${escapeHtml(label)}</small>
      </div>
      <em>${escapeHtml(hint)}</em>
    </article>
  `;
}

function formatTranscript(value: string): string {
  return escapeHtml(value).replace(/\r?\n/g, "<br>");
}

function recoveryPreviewItem(item: VocabItem, state: AppState): string {
  const review = state.reviews[item.id];

  return `
    <article>
      <span class="hanzi-cell">${escapeHtml(item.hanzi)}</span>
      <div>
        <strong>${escapeHtml(item.meaningVi || item.meaningEn || "Thiếu nghĩa")}</strong>
        <small>Bài ${item.lesson} · sai ${review?.wrongCount ?? 0} lần · ôn tiếp ${escapeHtml(review?.nextReviewDate ?? "hôm nay")}</small>
      </div>
    </article>
  `;
}
