import HanziWriter from "hanzi-writer";
import type { QuizOptions } from "hanzi-writer";

type WriterStatus = "idle" | "loading" | "ready" | "animating" | "quiz" | "error";

export interface StrokeTrainerCallbacks {
  onStatus?: (status: WriterStatus, message: string) => void;
}

export class HanziStrokeTrainer {
  private writer: HanziWriter | undefined;
  private character = "";
  private callbacks: StrokeTrainerCallbacks = {};

  async mount(
    target: HTMLElement,
    character: string,
    callbacks: StrokeTrainerCallbacks = {},
  ): Promise<void> {
    this.callbacks = callbacks;
    this.character = character;
    this.setStatus("loading", `Đang tải dữ liệu nét cho ${character}`);
    target.replaceChildren();

    try {
      this.writer?.cancelQuiz();
      this.writer = HanziWriter.create(target, character, {
        width: 240,
        height: 240,
        padding: 12,
        renderer: "svg",
        showOutline: true,
        showCharacter: false,
        strokeAnimationSpeed: 1.25,
        delayBetweenStrokes: 120,
        strokeFadeDuration: 220,
        strokeHighlightSpeed: 1.8,
        drawingFadeDuration: 180,
        drawingWidth: 28,
        outlineWidth: 2,
        strokeColor: "#111827",
        radicalColor: "#2458d3",
        outlineColor: "#d9e2ef",
        highlightColor: "#f59e0b",
        drawingColor: "#2458d3",
        onLoadCharDataError: () => {
          this.setStatus("error", `Chưa có dữ liệu nét cho ${character}`);
        },
      });
      await this.writer.showOutline({ duration: 0 });
      await this.writer.hideCharacter({ duration: 0 });
      this.setStatus("ready", `Sẵn sàng luyện chữ ${character}`);
    } catch {
      this.setStatus("error", `Không tải được animation cho ${character}`);
    }
  }

  async animate(): Promise<void> {
    if (!this.writer) {
      return;
    }
    this.setStatus("animating", `Đang chạy nét mẫu cho ${this.character}`);
    this.writer.cancelQuiz();
    await this.writer.hideCharacter({ duration: 0 });
    await this.writer.animateCharacter();
    this.setStatus("ready", `Đã xem xong nét mẫu ${this.character}`);
  }

  async showAnswer(): Promise<void> {
    if (!this.writer) {
      return;
    }
    this.writer.cancelQuiz();
    await this.writer.showCharacter({ duration: 160 });
    this.setStatus("ready", `Đang hiện đầy đủ chữ ${this.character}`);
  }

  async outlineOnly(): Promise<void> {
    if (!this.writer) {
      return;
    }
    this.writer.cancelQuiz();
    await this.writer.showOutline({ duration: 100 });
    await this.writer.hideCharacter({ duration: 100 });
    this.setStatus("ready", `Chỉ hiện khung chữ ${this.character}`);
  }

  async quiz(): Promise<void> {
    if (!this.writer) {
      return;
    }
    this.setStatus("quiz", `Hãy viết đúng thứ tự nét của ${this.character}`);
    const quizOptions: Partial<QuizOptions> = {
      leniency: 1.15,
      showHintAfterMisses: 2,
      highlightOnComplete: true,
      markStrokeCorrectAfterMisses: 4,
      onMistake: (stroke) => {
        this.setStatus(
          "quiz",
          `Nét ${stroke.strokeNum + 1} chưa khớp, còn ${stroke.strokesRemaining} nét`,
        );
      },
      onCorrectStroke: (stroke) => {
        this.setStatus(
          "quiz",
          `Đúng nét ${stroke.strokeNum + 1}, còn ${stroke.strokesRemaining} nét`,
        );
      },
      onComplete: (summary) => {
        this.setStatus(
          "ready",
          summary.totalMistakes
            ? `Hoàn thành với ${summary.totalMistakes} lần sai`
            : `Hoàn thành không sai nét nào`,
        );
      },
    };
    await this.writer.hideCharacter({ duration: 0 });
    await this.writer.quiz(quizOptions);
  }

  private setStatus(status: WriterStatus, message: string): void {
    this.callbacks.onStatus?.(status, message);
  }
}
