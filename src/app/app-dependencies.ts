import type { AppStateStore } from "../application/ports/app-state-store";
import type { AppVersionChecker } from "../application/ports/app-version-checker";
import type { ChineseSpeechPlayer } from "../application/ports/speech-player";
import type { StudyDataExporter, VocabularyImporter } from "../application/ports/vocabulary-io";
import type { VocabItem } from "../domain/types";

export interface StrokePracticeController {
  mount(root: HTMLElement, item: VocabItem | undefined, strokeCharIndex: number): Promise<void>;
  run(action: string): Promise<void>;
}

export interface HskAppDependencies {
  stateStore: AppStateStore;
  vocabularyImporter: VocabularyImporter;
  dataExporter: StudyDataExporter;
  speechPlayer: ChineseSpeechPlayer;
  strokePractice: StrokePracticeController;
  versionChecker: AppVersionChecker;
}
