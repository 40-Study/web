/**
 * Wave-2 W2-2 (contract-be4 §2): `ip_address` không bao giờ được backend gửi và `device_name` là chuỗi client
 * hardcode ("Chrome Browser"), nên nhãn thiết bị phải dựng ở web từ `user_agent` (trình duyệt + hệ điều hành).
 */
import { describe, expect, it } from "vitest";
import { describeDevice, parseUserAgent } from "./device-label";

const UA = {
  chromeMac:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36",
  chromeWin:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36",
  edgeWin:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0",
  firefoxLinux: "Mozilla/5.0 (X11; Linux x86_64; rv:130.0) Gecko/20100101 Firefox/130.0",
  safariMac:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
  safariIphone:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
  chromeIos:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/126.0.0.0 Mobile/15E148 Safari/604.1",
  chromeAndroid:
    "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36",
  chromeAndroidTablet:
    "Mozilla/5.0 (Linux; Android 14; SM-X710) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36",
  operaWin:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/120.0.0.0",
  ipad: "Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
};

describe("parseUserAgent", () => {
  it.each([
    [UA.chromeMac, "Chrome", "macOS", "desktop"],
    [UA.chromeWin, "Chrome", "Windows", "desktop"],
    [UA.edgeWin, "Edge", "Windows", "desktop"],
    [UA.firefoxLinux, "Firefox", "Linux", "desktop"],
    [UA.safariMac, "Safari", "macOS", "desktop"],
    [UA.safariIphone, "Safari", "iOS", "mobile"],
    [UA.chromeIos, "Chrome", "iOS", "mobile"],
    [UA.chromeAndroid, "Chrome", "Android", "mobile"],
    [UA.chromeAndroidTablet, "Chrome", "Android", "tablet"],
    [UA.operaWin, "Opera", "Windows", "desktop"],
    [UA.ipad, "Safari", "iPadOS", "tablet"],
  ])("%s", (ua, browser, os, kind) => {
    expect(parseUserAgent(ua)).toEqual({ browser, os, kind });
  });

  it("chuỗi rỗng/không nhận ra -> null (để nơi gọi dùng device_name)", () => {
    expect(parseUserAgent("")).toBeNull();
    expect(parseUserAgent(undefined)).toBeNull();
    expect(parseUserAgent("curl/8.4.0")).toBeNull();
  });
});

describe("describeDevice", () => {
  const base = { device_id: "d1", device_name: "Chrome Browser", logged_in_at: "2026-10-13T10:23:29+07:00" };

  it("dựng 'Chrome trên macOS' từ user_agent thay vì 'Chrome Browser' hardcode", () => {
    expect(describeDevice({ ...base, user_agent: UA.chromeMac }).label).toBe("Chrome trên macOS");
  });

  it("thiếu user_agent (app mobile): giữ device_name", () => {
    const d = describeDevice({ ...base, device_name: "Fortex App", user_agent: "" });
    expect(d.label).toBe("Fortex App");
    expect(d.kind).toBe("desktop");
  });

  it("kind lấy từ user_agent; không có UA thì đoán từ device_name như cũ", () => {
    expect(describeDevice({ ...base, user_agent: UA.safariIphone }).kind).toBe("mobile");
    expect(describeDevice({ ...base, device_name: "Mobile Browser" }).kind).toBe("mobile");
    expect(describeDevice({ ...base, device_name: "iPad của tôi" }).kind).toBe("tablet");
  });

  it("session_count > 1 -> '3 phiên'; 1 hoặc thiếu -> không hiện", () => {
    expect(describeDevice({ ...base, session_count: 3 }).sessionLabel).toBe("3 phiên");
    expect(describeDevice({ ...base, session_count: 1 }).sessionLabel).toBeNull();
    expect(describeDevice(base).sessionLabel).toBeNull();
  });
});
