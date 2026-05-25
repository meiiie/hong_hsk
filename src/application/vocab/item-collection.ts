import type { VocabItem } from "../../domain/types";
import { HSK4_EXCEL_SOURCE } from "../../domain/hsk4/hsk4-excel-vocab";

export function removeStarterItems(items: VocabItem[]): VocabItem[] {
  return items.filter(
    (item) =>
      !item.source.startsWith("Starter demo") && !item.source.startsWith(HSK4_EXCEL_SOURCE),
  );
}
