import "./presentation/styles.css";
import { mountHskApp } from "./app/hsk-app";
import { StrokePracticeWorkflow } from "./app/workflows/stroke-practice-workflow";
import {
  exportCsv,
  exportJson,
  exportTemplateCsv,
  exportWorkbook,
  importStandardCourseReference,
  importVocabFile,
} from "./infrastructure/import-export/workbook-io";
import { HanziStrokeTrainer } from "./infrastructure/hanzi/hanzi-stroke-trainer";
import { HttpNekoTutor } from "./infrastructure/neko/http-neko-tutor";
import { speakChinese } from "./infrastructure/speech/chinese-speech";
import { loadState, resetState, saveState } from "./infrastructure/storage/indexeddb-state-store";
import { checkAppVersion, currentAppVersion } from "./infrastructure/version/http-version-checker";

mountHskApp({
  stateStore: {
    load: loadState,
    save: saveState,
    reset: resetState,
  },
  vocabularyImporter: {
    importFile: importVocabFile,
    loadReference: importStandardCourseReference,
  },
  dataExporter: {
    exportTemplateCsv,
    exportWorkbook,
    exportCsv,
    exportJson,
  },
  speechPlayer: {
    play: speakChinese,
  },
  strokePractice: new StrokePracticeWorkflow(new HanziStrokeTrainer()),
  versionChecker: {
    current: currentAppVersion,
    check: checkAppVersion,
  },
  nekoTutor: import.meta.env.DEV ? new HttpNekoTutor() : undefined,
});
