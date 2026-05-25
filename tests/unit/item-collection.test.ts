import { describe, expect, it } from "vitest";
import { mergeItems, removeStarterItems } from "../../src/application/vocab/item-collection";
import { HSK4_EXCEL_SOURCE } from "../../src/domain/hsk4/hsk4-excel-vocab";
import { makeVocabItem } from "./factories";

describe("item collection helpers", () => {
  it("removes starter and bundled reference items before replacing vocabulary", () => {
    const custom = makeVocabItem({ id: "custom", source: "friend workbook" });
    const items = [
      makeVocabItem({ id: "starter", source: "Starter demo seed" }),
      makeVocabItem({ id: "reference", source: HSK4_EXCEL_SOURCE }),
      custom,
    ];

    expect(removeStarterItems(items)).toEqual([custom]);
  });

  it("merges by id and preserves lesson order", () => {
    const existing = [
      makeVocabItem({ id: "old", lesson: 2, order: 1, hanzi: "旧" }),
      makeVocabItem({ id: "same", lesson: 1, order: 2, hanzi: "旧词" }),
    ];
    const incoming = [makeVocabItem({ id: "same", lesson: 1, order: 1, hanzi: "新词" })];

    expect(mergeItems(existing, incoming).map((item) => [item.id, item.hanzi])).toEqual([
      ["same", "新词"],
      ["old", "旧"],
    ]);
  });
});
