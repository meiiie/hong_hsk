import type { AppState, VocabItem } from "../../domain/types";

export interface VocabularyImporter {
  importFile(file: File): Promise<VocabItem[]>;
  loadReference(): Promise<VocabItem[]>;
}

export interface StudyDataExporter {
  exportTemplateCsv(): void;
  exportWorkbook(state: AppState): Promise<void>;
  exportCsv(state: AppState): void;
  exportJson(state: AppState): void;
}
