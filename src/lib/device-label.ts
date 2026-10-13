/**
 * Nhãn hiển thị cho thiết bị đăng nhập (contract-be4 §2). Backend không parse user agent và không gửi IP;
 * `device_name` là chuỗi client hardcode ("Chrome Browser"), nên nhãn "Chrome trên macOS" dựng ở web.
 */

export type DeviceKind = "desktop" | "mobile" | "tablet";

export interface ParsedUserAgent {
  browser: string;
  os: string;
  kind: DeviceKind;
}

export interface DeviceLike {
  device_name: string;
  user_agent?: string | null;
  session_count?: number | null;
}

export interface DeviceDescription {
  label: string;
  kind: DeviceKind;
  /** "3 phiên" khi dòng này gộp nhiều phiên, ngược lại null. */
  sessionLabel: string | null;
}

// Thứ tự QUAN TRỌNG: Edge/Opera/Samsung/Cốc Cốc đều chứa "Chrome", Chrome chứa "Safari".
const BROWSERS: ReadonlyArray<readonly [RegExp, string]> = [
  [/\b(?:Edg|EdgA|EdgiOS|Edge)\//, "Edge"],
  [/\b(?:OPR|OPiOS)\/|\bOpera\b/, "Opera"],
  [/SamsungBrowser\//, "Samsung Internet"],
  [/coc_coc_browser\//, "Cốc Cốc"],
  [/\b(?:Firefox|FxiOS)\//, "Firefox"],
  [/\b(?:Chrome|CriOS)\//, "Chrome"],
  [/\bSafari\//, "Safari"],
];

function detectOs(ua: string): { os: string; kind: DeviceKind } | null {
  if (/\biPad\b/.test(ua)) return { os: "iPadOS", kind: "tablet" };
  if (/\b(?:iPhone|iPod)\b/.test(ua)) return { os: "iOS", kind: "mobile" };
  if (/\bAndroid\b/.test(ua)) return { os: "Android", kind: /\bMobile\b/.test(ua) ? "mobile" : "tablet" };
  if (/\bWindows\b/.test(ua)) return { os: "Windows", kind: "desktop" };
  if (/\bCrOS\b/.test(ua)) return { os: "ChromeOS", kind: "desktop" };
  if (/\bMac OS X\b|\bMacintosh\b/.test(ua)) return { os: "macOS", kind: "desktop" };
  if (/\bLinux\b|\bX11\b/.test(ua)) return { os: "Linux", kind: "desktop" };
  return null;
}

/** Trả `null` khi không nhận ra cả trình duyệt lẫn hệ điều hành (curl, app native...). */
export function parseUserAgent(userAgent: string | null | undefined): ParsedUserAgent | null {
  const ua = (userAgent ?? "").trim();
  if (!ua) return null;
  const browser = BROWSERS.find(([pattern]) => pattern.test(ua))?.[1];
  const os = detectOs(ua);
  if (!browser || !os) return null;
  return { browser, os: os.os, kind: os.kind };
}

function kindFromName(name: string): DeviceKind {
  const lower = name.toLowerCase();
  if (/mobile|iphone|android/.test(lower)) return "mobile";
  if (/tablet|ipad/.test(lower)) return "tablet";
  return "desktop";
}

export function describeDevice(device: DeviceLike): DeviceDescription {
  const parsed = parseUserAgent(device.user_agent);
  const count = device.session_count ?? 1;
  return {
    label: parsed ? `${parsed.browser} trên ${parsed.os}` : device.device_name,
    kind: parsed?.kind ?? kindFromName(device.device_name),
    sessionLabel: count > 1 ? `${count} phiên` : null,
  };
}
