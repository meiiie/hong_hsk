import type { AppState, Attempt, ReviewState, VocabItem } from "../../src/domain/types";

export function makeVocabItem(overrides: Partial<VocabItem> = {}): VocabItem {
  const lesson = overrides.lesson ?? 1;
  const hanzi = overrides.hanzi ?? "爱情";

  return {
    id: overrides.id ?? `item-${lesson}-${hanzi}`,
    book: overrides.book ?? (lesson <= 10 ? "4A" : "4B"),
    lesson,
    lessonTitle: overrides.lessonTitle ?? `Lesson ${lesson}`,
    order: overrides.order ?? 1,
    hanzi,
    pinyin: overrides.pinyin ?? "aiqing",
    meaningVi: overrides.meaningVi ?? "tinh yeu",
    meaningEn: overrides.meaningEn ?? "love",
    partOfSpeech: overrides.partOfSpeech ?? "n.",
    exampleHan: overrides.exampleHan ?? `我觉得${hanzi}非常重要。`,
    examplePinyin: overrides.examplePinyin ?? "Wo juede hen zhongyao.",
    exampleVi: overrides.exampleVi ?? "Toi thay dieu nay rat quan trong.",
    source: overrides.source ?? "unit-test",
    note: overrides.note ?? "",
    type: overrides.type ?? "New Word",
  };
}

export function makeReviewState(overrides: Partial<ReviewState> = {}): ReviewState {
  return {
    itemId: overrides.itemId ?? "item-1",
    status: overrides.status ?? "review",
    firstSeen: overrides.firstSeen ?? "2026-05-20",
    lastReviewed: overrides.lastReviewed ?? "2026-05-24",
    nextReviewDate: overrides.nextReviewDate ?? "2026-05-25",
    intervalDays: overrides.intervalDays ?? 2,
    ease: overrides.ease ?? 2.3,
    totalAttempts: overrides.totalAttempts ?? 2,
    correctAttempts: overrides.correctAttempts ?? 2,
    wrongCount: overrides.wrongCount ?? 0,
    correctStreak: overrides.correctStreak ?? 2,
    lastInput: overrides.lastInput ?? "爱情",
    lastCorrect: overrides.lastCorrect ?? true,
  };
}

export function makeAttempt(overrides: Partial<Attempt> = {}): Attempt {
  return {
    id: overrides.id ?? "attempt-1",
    itemId: overrides.itemId ?? "item-1",
    lesson: overrides.lesson ?? 1,
    mode: overrides.mode ?? "today",
    at: overrides.at ?? "2026-05-25T08:00:00.000Z",
    expected: overrides.expected ?? "爱情",
    input: overrides.input ?? "爱情",
    correct: overrides.correct ?? true,
    quality: overrides.quality ?? (overrides.correct === false ? "again" : "good"),
    latencyMs: overrides.latencyMs ?? 4_000,
  };
}

export function makeAppState(overrides: Partial<AppState> = {}): AppState {
  return {
    version: overrides.version ?? 1,
    items: overrides.items ?? [makeVocabItem()],
    attempts: overrides.attempts ?? [],
    reviews: overrides.reviews ?? {},
    settings: overrides.settings ?? {
      displayName: "Hồng",
      avatarInitial: "H",
      startDate: "2026-05-25",
      dailyNewTarget: 30,
      dailyReviewTarget: 80,
      selectedLesson: 1,
      locale: "vi",
      revealPinyin: true,
      revealMeaning: true,
      useEnglishFallback: false,
    },
    updatedAt: overrides.updatedAt ?? "2026-05-25T08:00:00.000Z",
  };
}
