import { afterEach, describe, expect, it, vi } from "vitest";

// `serverFetch` gọi `cookies()` từ `next/headers` — chỉ chạy được trong Server
// Component/Route Handler thật. Mock tối thiểu để test chạy trên Node/jsdom.
vi.mock("next/headers", () => ({
  cookies: async () => ({ toString: () => "session=abc" }),
}));

afterEach(() => {
  vi.unstubAllGlobals();
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
