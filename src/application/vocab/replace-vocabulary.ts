import type { AppState, VocabItem } from "../../domain/types";
import { mergeItems, removeStarterItems } from "./item-collection";

export function replaceStarterVocabulary(state: AppState, incoming: VocabItem[]): AppState {
  return {
    ...state,
    items: mergeItems(removeStarterItems(state.items), incoming),
  };
}
