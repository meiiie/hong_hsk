import { describe, expect, it } from "vitest";
import { migrateState } from "../../src/infrastructure/storage/indexeddb-state-store";
import type { AppState } from "../../src/domain/types";
import { makeAppState, makeAttempt } from "./factories";

describe("IndexedDB state migration", () => {
  it("preserves legacy progress while initializing the recognition schema", () => {
    const current = makeAppState({ attempts: [makeAttempt()] });
    const { recognitionReviews: _recognitionReviews, ...withoutRecognition } = current;
    const {
      studyDirection: _studyDirection,
      alternateStudyDirections: _alternateStudyDirections,
      lastStudySessionDirection: _lastStudySessionDirection,
      ...legacySettings
    } = current.settings;
    const legacyAttempts = current.attempts.map(({ direction: _direction, ...attempt }) => attempt);
    const legacy = {
      ...withoutRecognition,
      version: 1,
      attempts: legacyAttempts,
      settings: legacySettings,
    } as unknown as AppState;

    const migrated = migrateState(legacy);

    expect(migrated.version).toBe(4);
    expect(migrated.settings.studyDirection).toBe("vi-to-zh");
    expect(migrated.settings.alternateStudyDirections).toBe(true);
    expect(migrated.settings.lastStudySessionDirection).toBeUndefined();
    expect(migrated.attempts[0].direction).toBe("vi-to-zh");
    expect(migrated.recognitionReviews).toEqual({});
  });

  it("maps the schema 3 balance preference to strict session alternation", () => {
    const current = makeAppState();
    const { alternateStudyDirections: _alternateStudyDirections, ...schema3Settings } = current.settings;
    const schema3 = {
      ...current,
      version: 3,
      settings: {
        ...schema3Settings,
        balanceStudyDirections: false,
      },
    } as unknown as AppState;

    const migrated = migrateState(schema3);

    expect(migrated.version).toBe(4);
    expect(migrated.settings.alternateStudyDirections).toBe(false);
    expect("balanceStudyDirections" in migrated.settings).toBe(false);
  });
});
