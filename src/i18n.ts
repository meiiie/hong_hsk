import type { LocaleCode, ReviewStatus, StudyMode } from "./types";

export const DEFAULT_LOCALE: LocaleCode = "vi";

const STUDY_MODE_LABELS: Record<LocaleCode, Record<StudyMode, string>> = {
  vi: {
    today: "Hàng đợi hôm nay",
    lesson: "Theo bài đang chọn",
    wrong: "Sửa từ sai",
    all: "Trộn toàn bộ",
  },
  en: {
    today: "Today's queue",
    lesson: "Selected lesson",
    wrong: "Mistake recovery",
    all: "Mixed deck",
  },
};

const REVIEW_STATUS_LABELS: Record<LocaleCode, Record<ReviewStatus, string>> = {
  vi: {
    new: "Mới",
    learning: "Đang học",
    review: "Đang ôn",
    mastered: "Đã vững",
  },
  en: {
    new: "New",
    learning: "Learning",
    review: "Review",
    mastered: "Mastered",
  },
};

const BOOK_LABELS: Record<LocaleCode, Record<string, string>> = {
  vi: {
    "4A": "Quyển Thượng",
    "4B": "Quyển Hạ",
    Custom: "Tự nhập",
  },
  en: {
    "4A": "Book 4A",
    "4B": "Book 4B",
    Custom: "Custom",
  },
};

export function normalizeLocale(value: unknown): LocaleCode {
  return value === "en" ? "en" : DEFAULT_LOCALE;
}

export function studyModeLabel(mode: StudyMode, locale: LocaleCode): string {
  return STUDY_MODE_LABELS[normalizeLocale(locale)][mode];
}

export function reviewStatusLabel(status: ReviewStatus, locale: LocaleCode): string {
  return REVIEW_STATUS_LABELS[normalizeLocale(locale)][status];
}

export function bookLabel(book: string, locale: LocaleCode): string {
  return BOOK_LABELS[normalizeLocale(locale)][book] ?? book;
}
