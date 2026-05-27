import type { View } from "../app-types";
import type { StudyMode } from "../../domain/types";

export interface AppEventHandlers {
  navigate(view: View): void;
  toggleSidebar(): void;
  toggleAccountMenu(): void;
  closeAccountMenu(): void;
  toggleMobileMore(): void;
  closeMobileMore(): void;
  startStudy(mode: StudyMode): void;
  selectLesson(lesson: number): void | Promise<void>;
  submitAnswer(): void | Promise<void>;
  nextCard(): void;
  revealAnswer(): void;
  hideAnswer(): void;
  selectStrokeChar(index: number): void;
  runStrokeAction(action: string): void | Promise<void>;
  updateSetting(input: HTMLInputElement | HTMLSelectElement): void | Promise<void>;
  fileSelected(fileName: string): void;
  importFile(): void | Promise<void>;
  loadReference(): void | Promise<void>;
  exportTemplateCsv(): void;
  exportWorkbook(): void | Promise<void>;
  exportCsv(): void;
  exportJson(): void;
  resetApp(): void | Promise<void>;
  selectMockSet(setId: string): void;
  startMockExam(): void;
  resetMockExam(): void;
  submitMockExam(): void;
  previousExamQuestion(): void;
  nextExamQuestion(): void;
  chooseExamAnswer(answer: string): void;
  saveExamAnswer(answer: string): void;
  appendExamFragment(currentValue: string, fragment: string): string;
  clearExamAnswer(): void;
  playAudio(text: string): void;
}

export function bindAppEvents(root: HTMLElement, handlers: AppEventHandlers): void {
  bindNavigation(root, handlers);
  bindStudy(root, handlers);
  bindSettings(root, handlers);
  bindData(root, handlers);
  bindMockExam(root, handlers);
  bindAudio(root, handlers);
}

function bindNavigation(root: HTMLElement, handlers: AppEventHandlers): void {
  root.querySelector<HTMLButtonElement>("[data-sidebar-toggle]")?.addEventListener("click", () => {
    handlers.toggleSidebar();
  });

  root.querySelector<HTMLButtonElement>("[data-account-menu-toggle]")?.addEventListener("click", () => {
    handlers.toggleAccountMenu();
  });

  const accountMenu = root.querySelector<HTMLElement>("[data-account-menu]:not([hidden])");
  accountMenu?.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      handlers.closeAccountMenu();
    }
  });

  root.querySelector<HTMLButtonElement>("[data-mobile-more-toggle]")?.addEventListener("click", () => {
    handlers.toggleMobileMore();
  });

  root.querySelectorAll<HTMLButtonElement>("[data-mobile-more-close]").forEach((button) => {
    button.addEventListener("click", () => {
      handlers.closeMobileMore();
    });
  });

  const mobileMoreSheet = root.querySelector<HTMLElement>(".mobile-more-sheet:not([hidden])");
  mobileMoreSheet?.focus({ preventScroll: true });
  mobileMoreSheet?.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      handlers.closeMobileMore();
    }
  });
  if (mobileMoreSheet) {
    bindMobileMoreDrag(mobileMoreSheet, handlers);
  }

  root.querySelectorAll<HTMLButtonElement>("[data-view]").forEach((button) => {
    button.addEventListener("click", () => {
      handlers.navigate(button.dataset.view as View);
    });
  });

  root.querySelectorAll<HTMLButtonElement>("[data-study-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      handlers.startStudy(button.dataset.studyMode as StudyMode);
    });
  });
}

function bindMobileMoreDrag(sheet: HTMLElement, handlers: AppEventHandlers): void {
  const handle = sheet.querySelector<HTMLElement>("[data-mobile-more-drag]");
  if (!handle) {
    return;
  }

  let dragging = false;
  let startY = 0;
  let currentY = 0;

  const resetSheet = () => {
    sheet.style.transform = "";
    sheet.style.transition = "";
  };

  const finishDrag = () => {
    if (!dragging) {
      return;
    }
    dragging = false;
    if (currentY > 64) {
      handlers.closeMobileMore();
      return;
    }
    resetSheet();
  };

  handle.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }
    dragging = true;
    startY = event.clientY;
    currentY = 0;
    sheet.style.transition = "none";
    sheet.getAnimations().forEach((animation) => animation.cancel());
    handle.setPointerCapture(event.pointerId);
  });

  handle.addEventListener("pointermove", (event) => {
    if (!dragging) {
      return;
    }
    currentY = Math.max(0, event.clientY - startY);
    sheet.style.transform = `translateY(${Math.min(currentY, 160)}px)`;
  });

  handle.addEventListener("pointerup", finishDrag);
  handle.addEventListener("pointercancel", finishDrag);
}

function bindStudy(root: HTMLElement, handlers: AppEventHandlers): void {
  root.querySelectorAll<HTMLButtonElement>("[data-lesson]").forEach((button) => {
    button.addEventListener("click", () => {
      void handlers.selectLesson(Number(button.dataset.lesson));
    });
  });

  root.querySelector<HTMLFormElement>("[data-answer-form]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    void handlers.submitAnswer();
  });

  root.querySelector<HTMLButtonElement>("[data-next-card]")?.addEventListener("click", () => {
    handlers.nextCard();
  });

  root.querySelector<HTMLButtonElement>("[data-reveal-answer]")?.addEventListener("click", () => {
    handlers.revealAnswer();
  });

  root.querySelector<HTMLButtonElement>("[data-hide-answer]")?.addEventListener("click", () => {
    handlers.hideAnswer();
  });

  root.querySelectorAll<HTMLButtonElement>("[data-stroke-char]").forEach((button) => {
    button.addEventListener("click", () => {
      handlers.selectStrokeChar(Number(button.dataset.strokeChar) || 0);
    });
  });

  root.querySelectorAll<HTMLButtonElement>("[data-stroke-action]").forEach((button) => {
    button.addEventListener("click", () => {
      void handlers.runStrokeAction(button.dataset.strokeAction ?? "");
    });
  });
}

function bindSettings(root: HTMLElement, handlers: AppEventHandlers): void {
  root.querySelectorAll<HTMLInputElement | HTMLSelectElement>("[data-setting]").forEach((input) => {
    input.addEventListener("change", () => {
      void handlers.updateSetting(input);
    });
  });
}

function bindData(root: HTMLElement, handlers: AppEventHandlers): void {
  const fileInput = root.querySelector<HTMLInputElement>("#file-import");
  fileInput?.addEventListener("change", () => {
    handlers.fileSelected(fileInput.files?.[0]?.name ?? "Chưa chọn file");
  });

  root.querySelector<HTMLButtonElement>("[data-import-file]")?.addEventListener("click", () => {
    void handlers.importFile();
  });
  root.querySelector<HTMLButtonElement>("[data-load-reference]")?.addEventListener("click", () => {
    void handlers.loadReference();
  });
  root.querySelector<HTMLButtonElement>("[data-template-csv]")?.addEventListener("click", () => {
    handlers.exportTemplateCsv();
  });
  root.querySelector<HTMLButtonElement>("[data-export-xlsx]")?.addEventListener("click", () => {
    void handlers.exportWorkbook();
  });
  root.querySelectorAll<HTMLButtonElement>("[data-export-csv]").forEach((button) => {
    button.addEventListener("click", () => {
      handlers.exportCsv();
    });
  });
  root.querySelector<HTMLButtonElement>("[data-export-json]")?.addEventListener("click", () => {
    handlers.exportJson();
  });
  root.querySelector<HTMLButtonElement>("[data-reset-app]")?.addEventListener("click", () => {
    void handlers.resetApp();
  });
}

function bindMockExam(root: HTMLElement, handlers: AppEventHandlers): void {
  root.querySelectorAll<HTMLButtonElement>("[data-mock-set]").forEach((button) => {
    button.addEventListener("click", () => {
      handlers.selectMockSet(button.dataset.mockSet ?? "");
    });
  });

  root.querySelector<HTMLButtonElement>("[data-start-mock]")?.addEventListener("click", () => {
    handlers.startMockExam();
  });

  root.querySelector<HTMLButtonElement>("[data-reset-mock]")?.addEventListener("click", () => {
    handlers.resetMockExam();
  });

  root.querySelector<HTMLButtonElement>("[data-submit-mock]")?.addEventListener("click", () => {
    handlers.submitMockExam();
  });

  root.querySelector<HTMLButtonElement>("[data-exam-prev]")?.addEventListener("click", () => {
    handlers.previousExamQuestion();
  });

  root.querySelector<HTMLButtonElement>("[data-exam-next]")?.addEventListener("click", () => {
    handlers.nextExamQuestion();
  });

  root.querySelectorAll<HTMLButtonElement>("[data-exam-answer]").forEach((button) => {
    button.addEventListener("click", () => {
      handlers.chooseExamAnswer(button.dataset.examAnswer ?? "");
    });
  });

  root.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("[data-exam-text]").forEach((input) => {
    input.addEventListener("input", () => {
      handlers.saveExamAnswer(input.value);
    });
  });

  root.querySelectorAll<HTMLButtonElement>("[data-exam-fragment]").forEach((button) => {
    button.addEventListener("click", () => {
      const input = root.querySelector<HTMLInputElement>("[data-exam-text]");
      if (!input) {
        return;
      }
      input.value = handlers.appendExamFragment(input.value, button.dataset.examFragment ?? "");
      input.focus();
    });
  });

  root.querySelector<HTMLButtonElement>("[data-exam-clear]")?.addEventListener("click", () => {
    handlers.clearExamAnswer();
  });
}

function bindAudio(root: HTMLElement, handlers: AppEventHandlers): void {
  root.querySelectorAll<HTMLButtonElement>("[data-play-audio]").forEach((button) => {
    button.addEventListener("click", () => {
      handlers.playAudio(button.dataset.playAudio ?? "");
    });
  });
}
