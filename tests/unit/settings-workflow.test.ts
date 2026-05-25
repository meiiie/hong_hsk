import { describe, expect, it } from "vitest";
import { applySettingInput } from "../../src/app/workflows/settings-workflow";
import { makeAppState } from "./factories";

describe("settings workflow", () => {
  it("bounds numeric study settings and normalizes locale toggles", () => {
    const settings = { ...makeAppState().settings };

    applySettingInput(settings, { dataset: { setting: "dailyNewTarget" }, value: "999" } as HTMLInputElement);
    applySettingInput(settings, { dataset: { setting: "dailyReviewTarget" }, value: "0" } as HTMLInputElement);
    applySettingInput(settings, { dataset: { setting: "locale" }, value: "en" } as HTMLSelectElement);
    applySettingInput(settings, {
      dataset: { setting: "useEnglishFallback" },
      value: "",
      checked: true,
    } as HTMLInputElement);

    expect(settings.dailyNewTarget).toBe(80);
    expect(settings.dailyReviewTarget).toBe(20);
    expect(settings.locale).toBe("en");
    expect(settings.useEnglishFallback).toBe(true);
  });
});
