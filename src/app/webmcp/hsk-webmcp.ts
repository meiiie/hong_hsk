import type { AiTutorAction } from "../../application/ports/ai-tutor-client";
import type { StudyMode } from "../../domain/types";
import type { View } from "../app-types";

type WebMcpToolHandler = (input?: unknown) => unknown | Promise<unknown>;

interface WebMcpToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  execute: WebMcpToolHandler;
}

interface WebMcpRegistry {
  registerTool?: (tool: WebMcpToolDefinition) => unknown;
  register?: (tool: WebMcpToolDefinition) => unknown;
  addTool?: (tool: WebMcpToolDefinition) => unknown;
  setContext?: (context: Record<string, unknown>) => unknown;
  updateContext?: (context: Record<string, unknown>) => unknown;
}

interface HskWebMcpHandlers {
  navigate(view: View): void;
  startStudy(mode: StudyMode): void;
  askAiTutor(action: AiTutorAction, question?: string): void | Promise<void>;
}

interface HskWebMcpState {
  activeView: View;
  currentItem?: {
    id: string;
    hanzi: string;
    pinyin: string;
    meaningVi: string;
    book: string;
    lesson: number;
  };
  aiUnlocked: boolean;
  dueToday: number;
  wrongOpen: number;
  selectedLesson: number;
}

declare global {
  interface Navigator {
    modelContext?: WebMcpRegistry;
  }

  interface Window {
    modelContext?: WebMcpRegistry;
    webMCP?: WebMcpRegistry;
  }
}

let registered = false;
let latestHandlers: HskWebMcpHandlers | undefined;
let latestState: HskWebMcpState | undefined;

export function registerHskWebMcpTools(handlers: HskWebMcpHandlers, state: HskWebMcpState): void {
  latestHandlers = handlers;
  latestState = state;

  const registry = resolveRegistry();
  if (!registry) {
    return;
  }

  updateModelContext(registry, state);

  if (registered) {
    return;
  }

  const register = registry.registerTool ?? registry.register ?? registry.addTool;
  if (typeof register !== "function") {
    return;
  }

  for (const tool of createToolDefinitions()) {
    register.call(registry, tool);
  }
  registered = true;
}

function resolveRegistry(): WebMcpRegistry | undefined {
  return window.modelContext ?? window.webMCP ?? navigator.modelContext;
}

function updateModelContext(registry: WebMcpRegistry, state: HskWebMcpState): void {
  const updater = registry.updateContext ?? registry.setContext;
  if (typeof updater !== "function") {
    return;
  }

  updater.call(registry, {
    app: "Hong HSK4 Studio",
    activeView: state.activeView,
    currentItem: state.currentItem,
    aiTutorAvailable: state.aiUnlocked,
    dueToday: state.dueToday,
    wrongOpen: state.wrongOpen,
    selectedLesson: state.selectedLesson,
  });
}

function createToolDefinitions(): WebMcpToolDefinition[] {
  return [
    {
      name: "hsk_open_view",
      description: "Open a Hồng HSK4 Studio app view for the learner.",
      inputSchema: {
        type: "object",
        properties: {
          view: {
            type: "string",
            enum: ["dashboard", "study", "lessons", "wrong", "mock", "plan", "data", "settings"],
          },
        },
        required: ["view"],
      },
      execute: (input) => {
        const view = readString(input, "view") as View;
        if (!isView(view) || !latestHandlers) {
          return { ok: false, reason: "view_not_available" };
        }
        latestHandlers.navigate(view);
        return { ok: true, view };
      },
    },
    {
      name: "hsk_start_review",
      description: "Start a study queue in Hồng HSK4 Studio.",
      inputSchema: {
        type: "object",
        properties: {
          mode: {
            type: "string",
            enum: ["today", "lesson", "wrong", "all"],
          },
        },
        required: ["mode"],
      },
      execute: (input) => {
        const mode = readString(input, "mode") as StudyMode;
        if (!isStudyMode(mode) || !latestHandlers) {
          return { ok: false, reason: "mode_not_available" };
        }
        latestHandlers.startStudy(mode);
        return { ok: true, mode };
      },
    },
    {
      name: "hsk_ask_tutor",
      description: "Ask the AI tutor about the current HSK4 card after the learner has checked the answer.",
      inputSchema: {
        type: "object",
        properties: {
          action: {
            type: "string",
            enum: ["explain", "examples", "why_wrong", "memory_tip", "ask"],
          },
          question: {
            type: "string",
            maxLength: 400,
          },
        },
        required: ["action"],
      },
      execute: async (input) => {
        const action = readString(input, "action") as AiTutorAction;
        const question = readString(input, "question");
        if (!isAiAction(action) || !latestHandlers) {
          return { ok: false, reason: "action_not_available" };
        }
        if (!latestState?.aiUnlocked) {
          return { ok: false, reason: "answer_not_checked_yet" };
        }
        await latestHandlers.askAiTutor(action, question || undefined);
        return { ok: true, action };
      },
    },
  ];
}

function readString(input: unknown, key: string): string {
  if (!input || typeof input !== "object") {
    return "";
  }
  const rawRecord = input as Record<string, unknown>;
  const source =
    rawRecord.arguments && typeof rawRecord.arguments === "object"
      ? (rawRecord.arguments as Record<string, unknown>)
      : rawRecord;
  if (!(key in source)) {
    return "";
  }
  const value = source[key];
  return typeof value === "string" ? value.trim() : "";
}

function isView(value: string): value is View {
  return ["dashboard", "study", "lessons", "wrong", "mock", "plan", "data", "settings"].includes(value);
}

function isStudyMode(value: string): value is StudyMode {
  return ["today", "lesson", "wrong", "all"].includes(value);
}

function isAiAction(value: string): value is AiTutorAction {
  return ["explain", "examples", "why_wrong", "memory_tip", "ask"].includes(value);
}
