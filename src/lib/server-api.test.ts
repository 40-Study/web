import { afterEach, describe, expect, it, vi } from "vitest";

// `serverFetch` gọi `cookies()` từ `next/headers` — chỉ chạy được trong Server
// Component/Route Handler thật. Mock tối thiểu để test chạy trên Node/jsdom.
vi.mock("next/headers", () => ({
  cookies: async () => ({ toString: () => "session=abc" }),
}));

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("serverFetch base URL (Q1: 'Tiếp tục học' sập vì NEXT_PUBLIC_API_URL=/api)", () => {
  it("không đưa URL tương đối '/api' cho Node fetch", async () => {
    vi.stubEnv("BACKEND_URL", "");
    vi.stubEnv("NEXT_PUBLIC_API_URL", "/api");
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: { ok: 1 } }) });
    vi.stubGlobal("fetch", fetchMock);

    const { serverFetch } = await import("./server-api");
    await serverFetch("/courses/slug/abc");

    expect(fetchMock.mock.calls[0][0]).toBe("http://localhost:5001/api/courses/slug/abc");
  });

  it("ưu tiên BACKEND_URL đặt lúc chạy, không đóng băng lúc nạp module", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "/api");
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: {} }) });
    vi.stubGlobal("fetch", fetchMock);

    const { serverFetch } = await import("./server-api");
    vi.stubEnv("BACKEND_URL", "http://127.0.0.1:5001");
    await serverFetch("/courses/slug/abc");

    expect(fetchMock.mock.calls[0][0]).toBe("http://127.0.0.1:5001/api/courses/slug/abc");
  });
});

describe("serverFetch / HttpError.body (I4, review vòng 2 web PR #18)", () => {
  it("HttpError.body giữ nguyên envelope {message, error} của lỗi 403 uy quyền", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        statusText: "Forbidden",
        json: async () => ({ message: "KICKED", error: "forbidden: kicked" }),
      })
    );

    const { serverFetch, HttpError } = await import("./server-api");

    let caught: unknown;
    try {
      await serverFetch("/livestream/x/join", { method: "POST" });
    } catch (err) {
      caught = err;
    }

    expect(caught).toBeInstanceOf(HttpError);
    expect((caught as InstanceType<typeof HttpError>).status).toBe(403);
    expect((caught as InstanceType<typeof HttpError>).body).toEqual({
      message: "KICKED",
      error: "forbidden: kicked",
    });
    // `.message` (property Error chuẩn) KHÔNG đổi format cũ — nơi khác đang
    // hiển thị thẳng err.message không được đổi hành vi.
    expect((caught as Error).message).toBe("API Error: 403 Forbidden");
  });

  it("body không parse được JSON => HttpError.body = undefined, không throw lỗi khác", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        json: async () => {
          throw new Error("not json");
        },
      })
    );

    const { serverFetch, HttpError } = await import("./server-api");

    let caught: unknown;
    try {
      await serverFetch("/whatever");
    } catch (err) {
      caught = err;
    }

    expect(caught).toBeInstanceOf(HttpError);
    expect((caught as InstanceType<typeof HttpError>).body).toBeUndefined();
  });
});
