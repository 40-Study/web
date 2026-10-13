import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * QA vòng 2 (F-01): .env.example là thứ dev copy thành .env.local. Trỏ `127.0.0.1` làm cookie phiên
 * (host `localhost`) không đi kèm WebSocket -> 401; trỏ cổng 5000 trên macOS đụng AirPlay Receiver (403).
 * Khóa giá trị mẫu để lỗi cấu hình này không quay lại.
 */
const lines = fs
  .readFileSync(path.join(__dirname, "..", "..", ".env.example"), "utf8")
  .split("\n")
  .filter((l) => l.trim() && !l.trim().startsWith("#"));

const valueOf = (key: string) => lines.find((l) => l.startsWith(`${key}=`))?.slice(key.length + 1);

describe(".env.example — dev backend", () => {
  it("API, proxy và WebSocket đều trỏ localhost:5001, không dùng 127.0.0.1 hay cổng 5000", () => {
    expect(valueOf("NEXT_PUBLIC_API_URL")).toBe("http://localhost:5001/api");
    expect(valueOf("BACKEND_URL")).toBe("http://localhost:5001");
    expect(valueOf("NEXT_PUBLIC_WS_URL")).toBe("ws://localhost:5001/api/ws");
    for (const line of lines) {
      expect(line).not.toContain("127.0.0.1");
      expect(line).not.toMatch(/:5000(?!\d)/);
    }
  });
});
