import type { AppState } from "../../domain/types";

export interface AppStateStore {
  load(): Promise<AppState>;
  save(state: AppState): Promise<void>;
  reset(): Promise<AppState>;
}
