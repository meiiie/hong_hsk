import { describe, expect, it } from "vitest";
import { migrateState } from "../../src/infrastructure/storage/indexeddb-state-store";
import type { AppState } from "../../src/domain/types";
import { makeAppState, makeAttempt } from "./factories";

describe("IndexedDB state migration", () => {
  it("preserves legacy progress while initializing the recognition schema", () => {
    const current = makeAppState({ attempts: [makeAttempt()] });
    const { recognitionReviews: _recognitionReviews, ...withoutRecognition } = current;
    const { studyDirection: _studyDirection, ...legacySettings } = current.settings;
    const legacyAttempts = current.attempts.map(({ direction: _direction, ...attempt }) => attempt);
    const legacy = {
      ...withoutRecognition,
      version: 1,
      attempts: legacyAttempts,
      settings: legacySettings,
    } as unknown as AppState;

    const migrated = migrateState(legacy);

    expect(migrated.version).toBe(2);
    expect(migrated.settings.studyDirection).toBe("vi-to-zh");
    expect(migrated.attempts[0].direction).toBe("vi-to-zh");
    expect(migrated.recognitionReviews).toEqual({});
  });
});
