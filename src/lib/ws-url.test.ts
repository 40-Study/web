import { describe, it, expect, vi, afterEach } from "vitest";
import { alignLoopbackHost, deriveWsUrlFromApi, getWsUrl } from "./ws-url";

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

/**
 * QA vòng 2 (F-01): cookie `accessToken`/`rfToken` đặt cho host `localhost` nên WebSocket tới
 * `127.0.0.1:5001` không mang cookie -> handshake 401, thông báo và chat không bao giờ realtime.
 * Với hai bí danh loopback khác nhau (localhost / 127.0.0.1) phải căn host WS theo host của trang.
 */
describe("alignLoopbackHost", () => {
  it("API ở 127.0.0.1 nhưng trang ở localhost -> WS đổi sang localhost, giữ port và path", () => {
    expect(alignLoopbackHost("ws://127.0.0.1:5001/api/ws", "localhost")).toBe("ws://localhost:5001/api/ws");
  });

  it("chiều ngược lại: trang ở 127.0.0.1, WS ở localhost -> đổi sang 127.0.0.1", () => {
    expect(alignLoopbackHost("ws://localhost:5001/api/ws", "127.0.0.1")).toBe("ws://127.0.0.1:5001/api/ws");
  });

  it("cùng host thì giữ nguyên", () => {
    expect(alignLoopbackHost("ws://localhost:5001/api/ws", "localhost")).toBe("ws://localhost:5001/api/ws");
  });

  it("host WS không phải loopback (prod: api.fortex.ai.vn) thì KHÔNG đụng tới", () => {
    expect(alignLoopbackHost("wss://api.fortex.ai.vn/api/ws", "fortex.ai.vn")).toBe("wss://api.fortex.ai.vn/api/ws");
    expect(alignLoopbackHost("wss://api.fortex.ai.vn/api/ws", "localhost")).toBe("wss://api.fortex.ai.vn/api/ws");
  });

  it("trang không phải loopback (LAN IP, domain) thì KHÔNG đụng tới", () => {
    expect(alignLoopbackHost("ws://localhost:5001/api/ws", "192.168.1.10")).toBe("ws://localhost:5001/api/ws");
  });

  it("URL không hợp lệ thì trả nguyên", () => {
    expect(alignLoopbackHost("không-phải-url", "localhost")).toBe("không-phải-url");
  });
});

describe("getWsUrl — căn host loopback với trang", () => {
  const originalWs = process.env.NEXT_PUBLIC_WS_URL;
  const originalApi = process.env.NEXT_PUBLIC_API_URL;

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    if (originalWs === undefined) delete process.env.NEXT_PUBLIC_WS_URL;
    else process.env.NEXT_PUBLIC_WS_URL = originalWs;
    if (originalApi === undefined) delete process.env.NEXT_PUBLIC_API_URL;
    else process.env.NEXT_PUBLIC_API_URL = originalApi;
  });

  it("env trỏ 127.0.0.1 nhưng trang mở ở localhost -> dùng localhost và cảnh báo trong console", () => {
    delete process.env.NEXT_PUBLIC_WS_URL;
    process.env.NEXT_PUBLIC_API_URL = "http://127.0.0.1:5001/api";
    vi.stubGlobal("window", { location: { protocol: "http:", host: "localhost:3000", hostname: "localhost" } });
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    expect(getWsUrl()).toBe("ws://localhost:5001/api/ws");
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0][0])).toContain("127.0.0.1");
  });

  it("NEXT_PUBLIC_WS_URL tường minh cũng được căn host", () => {
    process.env.NEXT_PUBLIC_WS_URL = "ws://127.0.0.1:5001/api/ws";
    vi.stubGlobal("window", { location: { protocol: "http:", host: "localhost:3000", hostname: "localhost" } });
    vi.spyOn(console, "warn").mockImplementation(() => {});

    expect(getWsUrl()).toBe("ws://localhost:5001/api/ws");
  });

  it("host đã khớp thì không cảnh báo", () => {
    process.env.NEXT_PUBLIC_WS_URL = "ws://localhost:5001/api/ws";
    vi.stubGlobal("window", { location: { protocol: "http:", host: "localhost:3000", hostname: "localhost" } });
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    expect(getWsUrl()).toBe("ws://localhost:5001/api/ws");
    expect(warn).not.toHaveBeenCalled();
  });
});
