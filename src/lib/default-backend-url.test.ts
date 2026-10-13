/**
 * Wave-2 W2-1: mọi nơi cần URL backend mặc định (khi thiếu env) phải dùng MỘT hằng chung, cổng 5001.
 * Cổng 5000 trên macOS bị AirPlay Receiver chiếm (trả 403) và không phải cổng backend dev, nên các
 * fallback `localhost:5000` rải rác làm dev/proxy/SSR trỏ nhầm đích mà không báo lỗi.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { DEFAULT_API_BASE_URL, DEFAULT_BACKEND_ORIGIN } from "./default-backend-url";

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return sourceFiles(full);
    return /\.(ts|tsx)$/.test(name) && !/\.test\.(ts|tsx)$/.test(name) ? [full] : [];
  });
}

describe("default backend URL", () => {
  it("is localhost:5001 (+ /api for the API base)", () => {
    expect(DEFAULT_BACKEND_ORIGIN).toBe("http://localhost:5001");
    expect(DEFAULT_API_BASE_URL).toBe("http://localhost:5001/api");
  });

  it("no source file hardcodes a :5000 backend literal (comments excluded)", () => {
    const offenders = sourceFiles("src").filter((file) => {
      const code = readFileSync(file, "utf8")
        .split("\n")
        .filter((line) => !/^\s*(\*|\/\/|\/\*)/.test(line))
        .join("\n");
      return /(localhost|127\.0\.0\.1):5000/.test(code);
    });
    expect(offenders).toEqual([]);
  });

  it("only the shared module spells the default host:port", () => {
    const offenders = sourceFiles("src").filter(
      (file) =>
        !file.endsWith("default-backend-url.ts") &&
        /(localhost|127\.0\.0\.1):5001/.test(
          readFileSync(file, "utf8")
            .split("\n")
            .filter((line) => !/^\s*(\*|\/\/|\/\*)/.test(line))
            .join("\n")
        )
    );
    expect(offenders).toEqual([]);
  });
});
