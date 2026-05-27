import type { AppVersionManifest } from "../../domain/app-version";

export type AppVersionStatus = "checking" | "current" | "available" | "offline" | "unknown";

export interface AppVersionCheck {
  status: AppVersionStatus;
  current: AppVersionManifest;
  latest?: AppVersionManifest;
  checkedAt?: string;
  message?: string;
}

export interface AppVersionChecker {
  current(): AppVersionManifest;
  check(): Promise<AppVersionCheck>;
}
