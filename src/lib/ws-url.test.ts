import { describe, it, expect, vi, afterEach } from "vitest";
import { deriveWsUrlFromApi, getWsUrl } from "./ws-url";

/**
 * QA S2/P1: fallback cũ hardcode `ws://localhost:5000` khiến realtime chết ở dev
 * (backend dev chạy 5001; cổng 5000 trên macOS là AirTunes, trả 403). Giờ URL WS
 * phải SUY TỪ `NEXT_PUBLIC_API_URL` để luôn bám theo backend.
 */
describe("deriveWsUrlFromApi", () => {
  it("URL tuyệt đối http -> ws, giữ host:port, thêm /ws", () => {
    expect(deriveWsUrlFromApi("http://127.0.0.1:5001/api")).toBe("ws://127.0.0.1:5001/api/ws");
  });

  it("URL tuyệt đối https -> wss", () => {
    expect(deriveWsUrlFromApi("https://api.fortex.ai.vn/api")).toBe("wss://api.fortex.ai.vn/api/ws");
  });

  it("bỏ dấu / cuối, không sinh //api/ws", () => {
    expect(deriveWsUrlFromApi("http://127.0.0.1:5001/api/")).toBe("ws://127.0.0.1:5001/api/ws");
  });

  it("URL tương đối same-origin ghép với origin đang mở trang (ws khi http)", () => {
    expect(deriveWsUrlFromApi("/api", { protocol: "http:", host: "localhost:3000" })).toBe(
      "ws://localhost:3000/api/ws"
    );
  });

  it("URL tương đối trên trang https -> wss", () => {
    expect(deriveWsUrlFromApi("/api", { protocol: "https:", host: "fortex.ai.vn" })).toBe(
      "wss://fortex.ai.vn/api/ws"
    );
  });

  it("URL tương đối nhưng KHÔNG có location -> null (không đoán bừa)", () => {
    expect(deriveWsUrlFromApi("/api", null)).toBeNull();
  });

  it("env rỗng/không hợp lệ -> null", () => {
    expect(deriveWsUrlFromApi("")).toBeNull();
    expect(deriveWsUrlFromApi("   ")).toBeNull();
    expect(deriveWsUrlFromApi(undefined)).toBeNull();
    expect(deriveWsUrlFromApi("không-phải-url")).toBeNull();
    expect(deriveWsUrlFromApi("ftp://example.com/api")).toBeNull();
  });
});

describe("getWsUrl", () => {
  const originalWs = process.env.NEXT_PUBLIC_WS_URL;
  const originalApi = process.env.NEXT_PUBLIC_API_URL;

  afterEach(() => {
    process.env.NEXT_PUBLIC_WS_URL = originalWs;
    process.env.NEXT_PUBLIC_API_URL = originalApi;
    vi.unstubAllGlobals();
  });

  it("ưu tiên NEXT_PUBLIC_WS_URL khi được đặt", () => {
    process.env.NEXT_PUBLIC_WS_URL = "wss://explicit.example/ws";
    vi.stubGlobal("window", { location: { protocol: "http:", host: "localhost:3000" } });
    expect(getWsUrl()).toBe("wss://explicit.example/ws");
  });

  it("không có WS env -> suy từ NEXT_PUBLIC_API_URL (không còn fallback port 5000)", () => {
    delete process.env.NEXT_PUBLIC_WS_URL;
    process.env.NEXT_PUBLIC_API_URL = "http://127.0.0.1:5001/api";
    vi.stubGlobal("window", { location: { protocol: "http:", host: "localhost:3000" } });
    expect(getWsUrl()).toBe("ws://127.0.0.1:5001/api/ws");
  });

  it("thiếu cả hai env -> chuỗi rỗng và log lỗi rõ ràng (không im lặng dùng port 5000)", () => {
    delete process.env.NEXT_PUBLIC_WS_URL;
    delete process.env.NEXT_PUBLIC_API_URL;
    vi.stubGlobal("window", { location: { protocol: "http:", host: "localhost:3000" } });
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(getWsUrl()).toBe("");
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it("server-side (không có window) -> chuỗi rỗng", () => {
    vi.stubGlobal("window", undefined);
    expect(getWsUrl()).toBe("");
  });
});
