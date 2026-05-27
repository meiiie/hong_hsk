export type View = "dashboard" | "study" | "lessons" | "wrong" | "mock" | "plan" | "data" | "settings";

export interface DataHealth {
  total: number;
  courseItems: number;
  missingVi: number;
  missingExamples: number;
  draftVi: number;
  courseReady: boolean;
  examReady: boolean;
  qualityReady: boolean;
}

export interface StudyFeedback {
  itemId: string;
  input: string;
  correct: boolean;
  revealed?: boolean;
}
