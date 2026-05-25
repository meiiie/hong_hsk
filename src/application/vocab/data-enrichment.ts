import type { VocabItem } from "../../domain/types";
import { HSK4_EXCEL_NOTE, HSK4_EXCEL_VI_MEANINGS } from "../../domain/hsk4/hsk4-excel-vocab";
import { HSK4_VI_GLOSSARY } from "../../domain/hsk4/hsk4-vi-glossary";

export const VI_TRANSLATION_QA_NOTE = "Nghĩa Việt nháp tự bổ sung, cần kiểm chứng với giáo trình.";
export const VI_WORKBOOK_NOTE = HSK4_EXCEL_NOTE;

export function enrichVietnameseMeanings(items: VocabItem[]): VocabItem[] {
  let changed = false;
  const enriched = items.map((item) => {
    const existingMeaning = item.meaningVi.trim();
    const isDraft = item.note.includes(VI_TRANSLATION_QA_NOTE);
    const workbookMeaning = HSK4_EXCEL_VI_MEANINGS[item.hanzi]?.trim();
    if (workbookMeaning && shouldApplyWorkbookMeaning(item, existingMeaning, isDraft)) {
      const note = mergeNote(removeNote(item.note, VI_TRANSLATION_QA_NOTE), VI_WORKBOOK_NOTE);
      if (existingMeaning === workbookMeaning && item.note === note) {
        return item;
      }

      changed = true;
      return {
        ...item,
        meaningVi: workbookMeaning,
        note,
      };
    }

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

function removeNote(note: string, target: string): string {
  return note.replace(target, "").replace(/\s+/g, " ").trim();
}

function shouldApplyWorkbookMeaning(
  item: VocabItem,
  existingMeaning: string,
  isDraft: boolean,
): boolean {
  if (!existingMeaning || isDraft) {
    return true;
  }

  return (
    item.source.startsWith("HSK Standard Course reference CSV") ||
    item.source.startsWith("Starter demo")
  );
}
