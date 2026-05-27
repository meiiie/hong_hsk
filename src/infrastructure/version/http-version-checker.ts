import type { AppVersionCheck } from "../../application/ports/app-version-checker";
import {
  APP_VERSION_MANIFEST,
  isDifferentBuild,
  normalizeVersionManifest,
} from "../../domain/app-version";

export function currentAppVersion() {
  return APP_VERSION_MANIFEST;
}

export async function checkAppVersion(): Promise<AppVersionCheck> {
  const checkedAt = new Date().toISOString();

  try {
    const response = await fetch(`/version.json?t=${Date.now()}`, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return {
        status: "unknown",
        current: APP_VERSION_MANIFEST,
        checkedAt,
        message: "Chưa đọc được thông tin phiên bản mới nhất.",
      };
    }

    const latest = normalizeVersionManifest(await response.json());
    if (!latest) {
      return {
        status: "unknown",
        current: APP_VERSION_MANIFEST,
        checkedAt,
        message: "Tệp phiên bản không đúng định dạng.",
      };
    }

    return {
      status: isDifferentBuild(latest) ? "available" : "current",
      current: APP_VERSION_MANIFEST,
      latest,
      checkedAt,
    };
  } catch {
    return {
      status: "offline",
      current: APP_VERSION_MANIFEST,
      checkedAt,
      message: "Đang ngoại tuyến hoặc mạng không ổn định.",
    };
  }
}
