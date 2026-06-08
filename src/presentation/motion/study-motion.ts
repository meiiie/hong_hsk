import { runWithAnime } from "./anime-runtime";
import { prefersReducedMotion } from "./motion-preferences";
import { motionDurations, motionEases } from "./motion-tokens";

export type StudyFeedbackKind = "none" | "correct" | "wrong" | "revealed";

export interface StudyMotionState {
  activeView: string;
  itemId: string | undefined;
  feedbackKind: StudyFeedbackKind;
  strokeUnlocked: boolean;
  aiUnlocked: boolean;
  aiStatus: string;
}

export function hydrateStudyMotion(
  root: ParentNode,
  current: StudyMotionState,
  previous: StudyMotionState | undefined,
): void {
  if (prefersReducedMotion() || current.activeView !== "study") {
    return;
  }

  const enteredStudy = previous?.activeView !== "study";
  const cardChanged = previous?.itemId !== current.itemId;
  const feedbackChanged = previous?.feedbackKind !== current.feedbackKind && current.feedbackKind !== "none";
  const strokeUnlocked = current.strokeUnlocked && previous?.strokeUnlocked !== true;
  const aiUnlocked = current.aiUnlocked && previous?.aiUnlocked !== true;
  const aiStatusChanged = previous?.aiStatus !== current.aiStatus && current.aiStatus !== "idle";

  if (enteredStudy || cardChanged) {
    void animateStudyCard(root);
  }
  if (feedbackChanged) {
    void animateStudyFeedback(root, current.feedbackKind);
  }
  if (strokeUnlocked) {
    void animateStrokeUnlock(root);
  }
  if (aiUnlocked) {
    void animateAiTutorUnlock(root);
  }
  if (aiStatusChanged) {
    void animateAiTutorResponse(root);
  }
}

async function animateStudyCard(root: ParentNode): Promise<void> {
  await runWithAnime(async ({ animate }) => {
    const card = root.querySelector<HTMLElement>('[data-motion="study-card"]');
    if (!card) {
      return;
    }

    animate(card, {
      opacity: [0, 1],
      translateY: [10, 0],
      duration: motionDurations.medium,
      ease: motionEases.emphasized,
    });
  });
}

async function animateStudyFeedback(root: ParentNode, feedbackKind: StudyFeedbackKind): Promise<void> {
  await runWithAnime(async ({ animate }) => {
    const feedback = root.querySelector<HTMLElement>('[data-motion="study-feedback"]');
    if (feedback) {
      animate(feedback, {
        opacity: [0, 1],
        translateY: [6, 0],
        scale: [0.985, 1],
        duration: motionDurations.medium,
        ease: motionEases.emphasized,
      });
    }

    const input = root.querySelector<HTMLElement>('[data-motion="study-input"]');
    if (!input) {
      return;
    }

    if (feedbackKind === "wrong") {
      animate(input, {
        translateX: [0, -4, 4, -3, 0],
        duration: motionDurations.slow,
        ease: motionEases.standard,
      });
      return;
    }

    if (feedbackKind === "correct") {
      animate(input, {
        scale: [1, 1.01, 1],
        duration: motionDurations.medium,
        ease: motionEases.emphasized,
      });
    }
  });
}

async function animateStrokeUnlock(root: ParentNode): Promise<void> {
  await runWithAnime(async ({ animate }) => {
    const strokeLab = root.querySelector<HTMLElement>('[data-motion="stroke-lab"]:not(.stroke-locked)');
    if (!strokeLab) {
      return;
    }

    animate(strokeLab, {
      opacity: [0, 1],
      translateY: [8, 0],
      duration: motionDurations.medium,
      ease: motionEases.emphasized,
    });
  });
}

async function animateAiTutorUnlock(root: ParentNode): Promise<void> {
  await runWithAnime(async ({ animate }) => {
    const panel = root.querySelector<HTMLElement>('[data-motion="study-ai"]');
    if (!panel) {
      return;
    }

    animate(panel, {
      opacity: [0, 1],
      translateY: [8, 0],
      duration: motionDurations.medium,
      ease: motionEases.emphasized,
    });
  });
}

async function animateAiTutorResponse(root: ParentNode): Promise<void> {
  await runWithAnime(async ({ animate }) => {
    const response = root.querySelector<HTMLElement>('[data-motion="study-ai-response"]');
    if (!response) {
      return;
    }

    animate(response, {
      opacity: [0, 1],
      translateY: [6, 0],
      duration: motionDurations.medium,
      ease: motionEases.emphasized,
    });
  });
}
