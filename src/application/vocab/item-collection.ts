import type { VocabItem } from "../../domain/types";
import { HSK4_EXCEL_SOURCE } from "../../domain/hsk4/hsk4-excel-vocab";

export function removeStarterItems(items: VocabItem[]): VocabItem[] {
  return items.filter(
    (item) =>
      !item.source.startsWith("Starter demo") && !item.source.startsWith(HSK4_EXCEL_SOURCE),
  );
}

export function mergeItems(existing: VocabItem[], incoming: VocabItem[]): VocabItem[] {
  const map = new Map(existing.map((item) => [item.id, item]));
  incoming.forEach((item) => map.set(item.id, item));
  return Array.from(map.values()).sort((left, right) => {
    if (left.lesson !== right.lesson) {
      return left.lesson - right.lesson;
    }
    return left.order - right.order;
  });
}
