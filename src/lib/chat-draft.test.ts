/** userId rỗng (chưa có user trong store): bỏ qua nháp, không dùng khoá `chat-draft::<conv>` dùng chung cho mọi người. */
import { beforeEach, describe, expect, it } from "vitest";
import { clearAllDrafts, readDraft, writeDraft } from "./chat-draft";

describe("chat-draft", () => {
  beforeEach(() => window.sessionStorage.clear());

  it("userId rỗng: không ghi gì vào storage", () => {
    writeDraft("", "c1", "chữ dở");
    expect(window.sessionStorage.length).toBe(0);
  });

  it("userId rỗng: không đọc nháp dù có khoá rỗng-user tồn tại", () => {
    window.sessionStorage.setItem("chat-draft::c1", "của người khác");
    expect(readDraft("", "c1")).toBe("");
  });

  it("có userId: ghi/đọc/xoá như bình thường, tách theo user", () => {
    writeDraft("a", "c1", "nháp a");
    expect(readDraft("a", "c1")).toBe("nháp a");
    expect(readDraft("b", "c1")).toBe("");
    clearAllDrafts();
    expect(readDraft("a", "c1")).toBe("");
  });
});