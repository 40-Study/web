import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { appearanceStorage, applyFontSize, fontSizeBootScript, FONT_SIZE_STORAGE_KEY } from "./appearance-storage";

/** QA6 S6-04: cỡ chữ chọn ở Cài đặt phải thực sự đổi cỡ chữ gốc của trang, kể cả sau khi tải lại. */
const rootSize = () => document.documentElement.style.fontSize;

beforeEach(() => {
  localStorage.clear();
  document.documentElement.style.fontSize = "";
});
afterEach(() => {
  document.documentElement.style.fontSize = "";
});

describe("applyFontSize", () => {
  it("đặt cỡ chữ gốc theo phần trăm", () => {
    applyFontSize(150);
    expect(rootSize()).toBe("150%");
  });

  it("100% gỡ style inline, giá trị ngoài thang bị kẹp", () => {
    applyFontSize(120);
    applyFontSize(100);
    expect(rootSize()).toBe("");
    applyFontSize(500);
    expect(rootSize()).toBe("150%");
    applyFontSize(10);
    expect(rootSize()).toBe("80%");
  });
});

describe("appearanceStorage.setFontSize", () => {
  it("lưu và áp ngay lên <html>", () => {
    appearanceStorage.setFontSize(130);
    expect(localStorage.getItem(FONT_SIZE_STORAGE_KEY)).toBe("130");
    expect(rootSize()).toBe("130%");
  });
});

describe("fontSizeBootScript (chạy trước hydrate)", () => {
  const run = () => new Function(fontSizeBootScript())();

  it("áp cỡ chữ đã lưu khi tải lại trang", () => {
    localStorage.setItem(FONT_SIZE_STORAGE_KEY, "120");
    run();
    expect(rootSize()).toBe("120%");
  });

  it("bỏ qua giá trị hỏng hoặc 0 (về mặc định)", () => {
    for (const bad of ["abc", "0", "", "120px"]) {
      localStorage.setItem(FONT_SIZE_STORAGE_KEY, bad);
      run();
      expect(rootSize()).toBe("");
    }
  });

  // Review #131: boot script và ThemeProvider (getFontSize + applyFontSize) phải ra cùng kết quả, không nhảy sau hydrate.
  it("giá trị ngoài thang bị kẹp như ThemeProvider", () => {
    for (const [stored, expected] of [["5000", "150%"], ["10", "80%"], ["-5", "80%"]] as const) {
      localStorage.setItem(FONT_SIZE_STORAGE_KEY, stored);
      run();
      const boot = rootSize();
      document.documentElement.style.fontSize = "";
      applyFontSize(appearanceStorage.getFontSize());
      expect(boot).toBe(expected);
      expect(rootSize()).toBe(boot);
      document.documentElement.style.fontSize = "";
    }
  });
});
