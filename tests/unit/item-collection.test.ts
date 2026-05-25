import { describe, expect, it } from "vitest";
import { removeStarterItems } from "../../src/application/vocab/item-collection";
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
});
