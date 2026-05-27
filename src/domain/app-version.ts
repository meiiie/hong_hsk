export const APP_DATA_SCHEMA_VERSION = 1;
export const INDEXEDDB_SCHEMA_VERSION = 1;

export interface AppVersionManifest {
  version: string;
  buildSha: string;
  branch: string;
  buildTime: string;
  dataSchemaVersion: number;
  storageSchemaVersion: number;
}

export const APP_VERSION_MANIFEST: AppVersionManifest = Object.freeze({
  version: __APP_VERSION__,
  buildSha: __APP_BUILD_SHA__,
  branch: __APP_BRANCH__,
  buildTime: __APP_BUILD_TIME__,
  dataSchemaVersion: APP_DATA_SCHEMA_VERSION,
  storageSchemaVersion: INDEXEDDB_SCHEMA_VERSION,
});

export function versionLabel(manifest: AppVersionManifest = APP_VERSION_MANIFEST): string {
  return `v${manifest.version} (${shortBuildSha(manifest.buildSha)})`;
}

export function shortBuildSha(buildSha: string): string {
  return buildSha && buildSha !== "dev" ? buildSha.slice(0, 7) : "dev";
}

export function isDifferentBuild(
  latest: Pick<AppVersionManifest, "version" | "buildSha" | "buildTime">,
  current: Pick<AppVersionManifest, "version" | "buildSha" | "buildTime"> = APP_VERSION_MANIFEST,
): boolean {
  if (latest.version !== current.version) {
    return true;
  }
  if (latest.buildSha && latest.buildSha !== current.buildSha) {
    return true;
  }
  return Boolean(latest.buildTime && current.buildTime && latest.buildTime > current.buildTime);
}

export function normalizeVersionManifest(value: unknown): AppVersionManifest | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }
  const manifest = value as Partial<AppVersionManifest>;
  if (
    typeof manifest.version !== "string" ||
    typeof manifest.buildSha !== "string" ||
    typeof manifest.branch !== "string" ||
    typeof manifest.buildTime !== "string"
  ) {
    return undefined;
  }

  return {
    version: manifest.version,
    buildSha: manifest.buildSha,
    branch: manifest.branch,
    buildTime: manifest.buildTime,
    dataSchemaVersion: numberOrDefault(manifest.dataSchemaVersion, APP_DATA_SCHEMA_VERSION),
    storageSchemaVersion: numberOrDefault(manifest.storageSchemaVersion, INDEXEDDB_SCHEMA_VERSION),
  };
}

function numberOrDefault(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}
