import type { LocaleCode } from "./types";

export const DEFAULT_LOCALE: LocaleCode = "vi";

export function normalizeLocale(value: unknown): LocaleCode {
  return value === "en" ? "en" : DEFAULT_LOCALE;
}
