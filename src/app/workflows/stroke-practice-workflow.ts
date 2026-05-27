import type { VocabItem } from "../../domain/types";
import { extractHanziChars } from "../views/view-helpers";

export interface StrokeTrainerDriver {
  mount(
    target: HTMLElement,
    character: string,
    callbacks?: {
      onStatus?: (status: string, message: string) => void;
    },
  ): Promise<void>;
  animate(): Promise<void>;
  quiz(): Promise<void>;
  outlineOnly(): Promise<void>;
  showAnswer(): Promise<void>;
}

export class StrokePracticeWorkflow {
  constructor(private readonly trainer: StrokeTrainerDriver) {}

  async mount(root: HTMLElement, item: VocabItem | undefined, strokeCharIndex: number): Promise<void> {
    const target = root.querySelector<HTMLElement>("#stroke-target");
    if (!item || !target) {
      return;
    }

    const characters = extractHanziChars(item.hanzi);
    const character = characters[Math.min(strokeCharIndex, characters.length - 1)] ?? item.hanzi.charAt(0);
    if (!character) {
      return;
    }

    await this.trainer.mount(target, character, {
      onStatus: (status, message) => {
        const statusElement = root.querySelector<HTMLElement>("#stroke-status");
        if (statusElement) {
          statusElement.textContent = message;
          statusElement.dataset.status = status;
        }
      },
    });
  }

  async run(action: string): Promise<void> {
    if (action === "animate") {
      await this.trainer.animate();
    }
    if (action === "quiz") {
      await this.trainer.quiz();
    }
    if (action === "outline") {
      await this.trainer.outlineOnly();
    }
    if (action === "show") {
      await this.trainer.showAnswer();
    }
  }
}
