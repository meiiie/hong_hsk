import type {
  AiTutorAction,
  AiTutorPanelState,
  AiTutorRequest,
  AiTutorResponse,
} from "../../application/ports/ai-tutor-client";
import type { AppState, StudyMode, VocabItem } from "../../domain/types";
import type { StudyFeedback } from "../app-types";

export class AiTutorWorkflow {
  private state: AiTutorPanelState = {
    status: "idle",
  };

  stateForItem(itemId: string | undefined): AiTutorPanelState {
    if (!itemId) {
      return { status: "idle" };
    }
    if (this.state.itemId !== itemId) {
      return {
        itemId,
        status: "idle",
      };
    }
    return this.state;
  }

  start(itemId: string, action: AiTutorAction, question?: string): void {
    this.state = {
      itemId,
      action,
      question,
      status: "loading",
    };
  }

  complete(response: AiTutorResponse): void {
    this.state = {
      itemId: this.state.itemId,
      action: response.action,
      question: this.state.question,
      response,
      status: "ready",
    };
  }

  fail(error: string): void {
    this.state = {
      itemId: this.state.itemId,
      action: this.state.action,
      question: this.state.question,
      error,
      status: "error",
    };
  }

  reset(): void {
    this.state = {
      status: "idle",
    };
  }
}

export function buildAiTutorRequest(
  state: AppState,
  item: VocabItem,
  studyMode: StudyMode,
  action: AiTutorAction,
  feedback: StudyFeedback | undefined,
  question?: string,
): AiTutorRequest {
  return {
    action,
    question,
    item: {
      id: item.id,
      book: item.book,
      lesson: item.lesson,
      lessonTitle: item.lessonTitle,
      hanzi: item.hanzi,
      pinyin: item.pinyin,
      meaningVi: item.meaningVi,
      meaningEn: item.meaningEn,
      partOfSpeech: item.partOfSpeech,
      exampleHan: item.exampleHan,
      examplePinyin: item.examplePinyin,
      exampleVi: item.exampleVi,
      note: item.note,
      source: item.source,
    },
    learner: {
      displayName: state.settings.displayName,
      locale: state.settings.locale,
      studyMode,
    },
    feedback: feedback
      ? {
          input: feedback.input,
          correct: feedback.correct,
          revealed: feedback.revealed,
        }
      : undefined,
  };
}
