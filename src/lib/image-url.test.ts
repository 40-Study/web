import { describe, expect, it } from "vitest";
import { isOptimizableImageUrl } from "./image-url";

describe("isOptimizableImageUrl (khớp images.remotePatterns của next.config.mjs)", () => {
  it.each([
    "https://cdn.example.com/a.png",
    "https://172.18.0.4/a.png",
    "http://localhost/a.png",
    "/uploads/a.png",
    "blob:http://localhost:3000/abc",
    "data:image/png;base64,AAAA",
  ])("%s -> tối ưu hoá được", (url) => {
    expect(isOptimizableImageUrl(url)).toBe(true);
  });

  it.each([
    // Q3-01: URL MinIO nội bộ làm next/image ném "hostname is not configured".
    "http://172.18.0.4:9000/bucket/a.png",
    "http://minio:9000/a.png",
    "http://localhost:9000/a.png", // pattern localhost không khai báo cổng
    "http://example.com/a.png",
    "//cdn.example.com/a.png",
    "not a url",
    "",
    null,
    undefined,
  ])("%s -> KHÔNG tối ưu hoá được", (url) => {
    expect(isOptimizableImageUrl(url as string | null | undefined)).toBe(false);
  });
});
