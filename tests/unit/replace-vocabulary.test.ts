import { describe, expect, it } from "vitest";
import { replaceStarterVocabulary } from "../../src/application/vocab/replace-vocabulary";
import { makeAppState, makeVocabItem } from "./factories";

describe("replace vocabulary use case", () => {
  it("keeps custom items and merges incoming course data", () => {
    const custom = makeVocabItem({ id: "custom", hanzi: "自定义", source: "friend workbook", lesson: 9 });
    const incoming = makeVocabItem({ id: "incoming", hanzi: "新词", source: "new import", lesson: 1 });
    const state = makeAppState({
      items: [
        makeVocabItem({ id: "starter", source: "Starter demo seed" }),
        custom,
      ],
    });

    const next = replaceStarterVocabulary(state, [incoming]);

    expect(next.items.map((item) => item.id)).toEqual(["incoming", "custom"]);
    expect(next.attempts).toBe(state.attempts);
    expect(next.reviews).toBe(state.reviews);
  });
});
