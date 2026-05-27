import { describe, expect, it } from "vitest";
import {
  APP_DATA_SCHEMA_VERSION,
  INDEXEDDB_SCHEMA_VERSION,
  isDifferentBuild,
  normalizeVersionManifest,
  shortBuildSha,
  versionLabel,
  type AppVersionManifest,
} from "../../src/domain/app-version";

const current: AppVersionManifest = {
  version: "0.1.0",
  buildSha: "abcdef123456",
  branch: "main",
  buildTime: "2026-05-27T08:00:00.000Z",
  dataSchemaVersion: APP_DATA_SCHEMA_VERSION,
  storageSchemaVersion: INDEXEDDB_SCHEMA_VERSION,
};

describe("app version metadata", () => {
  it("formats a compact version label", () => {
    expect(shortBuildSha(current.buildSha)).toBe("abcdef1");
    expect(versionLabel(current)).toBe("v0.1.0 (abcdef1)");
  });

  it("detects a newer remote build", () => {
    expect(
      isDifferentBuild(
        {
          ...current,
          buildSha: "999999999999",
        },
        current,
      ),
    ).toBe(true);

    expect(isDifferentBuild(current, current)).toBe(false);
  });

  it("normalizes remote manifests and fills schema defaults", () => {
    expect(
      normalizeVersionManifest({
        version: "0.1.0",
        buildSha: "abcdef123456",
        branch: "main",
        buildTime: "2026-05-27T08:00:00.000Z",
      }),
    ).toEqual(current);

    expect(normalizeVersionManifest({ version: "0.1.0" })).toBeUndefined();
  });
});
