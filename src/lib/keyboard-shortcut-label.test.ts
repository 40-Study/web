/**
 * Test nhãn phím tắt theo OS (contract §7).
 */

import { describe, expect, it } from "vitest";
import {
  detectPlatform,
  keyLabel,
  modifierLabel,
  shortcutHint,
  shortcutTable,
} from "./keyboard-shortcut-label";

describe("modifierLabel / keyLabel", () => {
  it("macOS hiển thị ⌘, nền tảng khác hiển thị Ctrl", () => {
    expect(modifierLabel("mac")).toBe("⌘");
    expect(modifierLabel("other")).toBe("Ctrl");
  });

  it("phím đơn giữ nguyên ký tự", () => {
    expect(keyLabel("B", "mac")).toBe("B");
    expect(keyLabel("B", "other")).toBe("B");
  });

  it("Mod đổi nhãn theo nền tảng", () => {
    expect(keyLabel("Mod", "mac")).toBe("⌘");
    expect(keyLabel("Mod", "other")).toBe("Ctrl");
  });
});

describe("detectPlatform", () => {
  it("nhận macOS từ platform", () => {
    expect(detectPlatform({ platform: "MacIntel", userAgent: "" })).toBe("mac");
  });

  it("nhận iPad từ userAgent", () => {
    expect(detectPlatform({ platform: "iPad", userAgent: "" })).toBe("mac");
  });

  it("Windows/Linux → other", () => {
    expect(detectPlatform({ platform: "Win32", userAgent: "Mozilla/5.0 (Windows NT 10.0)" })).toBe(
      "other"
    );
    expect(detectPlatform({ platform: "Linux x86_64", userAgent: "" })).toBe("other");
  });

  it("không có navigator (SSR) → other, không ném lỗi", () => {
    expect(detectPlatform(undefined)).toBe("other");
  });
});

describe("shortcutTable", () => {
  it("có đủ 13 phím của contract §7", () => {
    expect(shortcutTable("other")).toHaveLength(13);
  });

  it("mô tả đúng hành động cho từng phím theo contract", () => {
    const table = shortcutTable("other");
    const byLabel = new Map(table.map((row) => [row.keys[row.keys.length - 1], row.description]));

    expect(byLabel.get("Space")).toBe("Phát / tạm dừng");
    expect(byLabel.get("←")).toBe("Tua lùi 5 giây");
    expect(byLabel.get("→")).toBe("Tua tới 5 giây");
    expect(byLabel.get("J")).toBe("Tua lùi 10 giây");
    expect(byLabel.get("L")).toBe("Tua tới 10 giây");
    expect(byLabel.get("↑")).toBe("Tăng âm lượng");
    expect(byLabel.get("↓")).toBe("Giảm âm lượng");
    expect(byLabel.get("B")).toBe("Thêm ghi chú tại giây hiện tại");
    expect(byLabel.get("N")).toBe("Mở / đóng panel ghi chú");
    expect(byLabel.get("C")).toBe("Bật / tắt phụ đề");
    expect(byLabel.get("?")).toBe("Mở bảng phím tắt");
  });

  it("có phím tốc độ phát (< và >)", () => {
    const labels = shortcutTable("other").flatMap((row) => row.keys);
    expect(labels).toContain(",");
    expect(labels).toContain(".");
  });
});

describe("shortcutHint", () => {
  it("trả nhãn phím theo mã phím", () => {
    expect(shortcutHint("KeyB", "other")).toBe("B");
  });

  it("mã phím lạ → chuỗi rỗng, không ném lỗi", () => {
    expect(shortcutHint("KeyZzz", "other")).toBe("");
  });
});
