import type { VocabItem } from "../../domain/types";
import { HanziStrokeTrainer } from "../../infrastructure/hanzi/hanzi-stroke-trainer";
import { extractHanziChars } from "../views/view-helpers";

export class StrokePracticeWorkflow {
  private readonly trainer = new HanziStrokeTrainer();

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
