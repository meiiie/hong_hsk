import type { StudySettings } from "../../domain/types";
import { clamp } from "../../shared/number-utils";
import { toDateKey } from "../../shared/date-utils";

export function applySettingInput(
  settings: StudySettings,
  input: HTMLInputElement | HTMLSelectElement,
): void {
  const key = input.dataset.setting;
  if (key === "displayName") {
    settings.displayName = input.value.trim().slice(0, 40) || "Hồng";
  }
  if (key === "avatarInitial") {
    settings.avatarInitial = input.value.trim().slice(0, 2).toUpperCase() || "H";
  }
  if (key === "startDate") {
    settings.startDate = input.value || toDateKey();
  }
  if (key === "dailyNewTarget") {
    settings.dailyNewTarget = clamp(Number(input.value), 5, 80);
  }
  if (key === "dailyReviewTarget") {
    settings.dailyReviewTarget = clamp(Number(input.value), 20, 240);
  }
  if (key === "locale") {
    settings.locale = input.value === "en" ? "en" : "vi";
  }
  if (key === "useEnglishFallback") {
    settings.useEnglishFallback = "checked" in input ? Boolean(input.checked) : false;
  }
}
