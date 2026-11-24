/** Q5-PG-10: link chia sẻ của /contests phải mang og:title/og:description riêng, không phải mặc định toàn site. */
import { describe, expect, it } from "vitest";
import { metadata } from "./layout";

describe("/contests layout metadata", () => {
  it("có openGraph riêng và canonical", () => {
    expect(metadata.openGraph?.title).toBe("Cuộc thi");
    expect(String(metadata.openGraph?.description)).toContain("cuộc thi học thuật");
    expect(metadata.alternates?.canonical).toBe("/contests");
  });

  it("giữ template tiêu đề cho trang con (QA-A-08)", () => {
    expect(metadata.title).toEqual({ default: "Cuộc thi", template: "%s | ForteX" });
  });
});
