import { HSK4_VI_GLOSSARY } from "./hsk4-vi-glossary";
import type { VocabItem } from "./types";

export const VI_TRANSLATION_QA_NOTE = "Nghĩa Việt nháp tự bổ sung, cần kiểm chứng với giáo trình.";

export function enrichVietnameseMeanings(items: VocabItem[]): VocabItem[] {
  let changed = false;
  const enriched = items.map((item) => {
    const existingMeaning = item.meaningVi.trim();
    const isDraft = item.note.includes(VI_TRANSLATION_QA_NOTE);
    if (existingMeaning && !isDraft) {
      return item;
    }

    const draftMeaning = HSK4_VI_GLOSSARY[item.hanzi]?.trim();
    if (!draftMeaning) {
      return item;
    }

    if (existingMeaning === draftMeaning && isDraft) {
      return item;
    }

    changed = true;
    return {
      ...item,
      meaningVi: draftMeaning,
      note: mergeNote(item.note, VI_TRANSLATION_QA_NOTE),
    };
  });

  return changed ? enriched : items;
}

export function countDraftVietnameseMeanings(items: VocabItem[]): number {
  return items.filter(isDraftVietnameseMeaning).length;
}

export function isDraftVietnameseMeaning(item: VocabItem): boolean {
  return item.meaningVi.trim().length > 0 && item.note.includes(VI_TRANSLATION_QA_NOTE);
}

function mergeNote(note: string, addition: string): string {
  if (note.includes(addition)) {
    return note;
  }
  return note ? `${note} ${addition}` : addition;
}
