import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/server-api", () => {
  class HttpError extends Error {
    status: number;
    body?: { message?: string; error?: string };
    constructor(status: number, message: string, body?: { message?: string; error?: string }) {
      super(message);
      this.status = status;
      this.body = body;
    }
  }
  return {
    HttpError,
    serverApi: {
      get: vi.fn(),
      post: vi.fn(),
    },
  };
});

import { serverApi, HttpError } from "@/lib/server-api";
import { joinLivestream } from "./join-livestream";

afterEach(() => {
  vi.clearAllMocks();
});

/**
 * I4 (review vòng 2 web PR #18): test `joinLivestream` map 403 -> forbiddenCode
 * — đúng đề xuất §3 của review. Tách khỏi `page.tsx` để không phải import cả
 * Server Component (kéo theo RoomClient.tsx nặng LiveKit).
 */
describe("joinLivestream (I4)", () => {
  it("join thành công trả token/server_url, không có forbiddenCode", async () => {
    (serverApi.get as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "u1", username: "hs1", full_name: "Học Sinh" });
    (serverApi.post as ReturnType<typeof vi.fn>).mockResolvedValue({ token: "tok", server_url: "wss://x", room_name: "r1" });

    const attempt = await joinLivestream("session-1");

    expect(serverApi.post).toHaveBeenCalledWith("/livestream/session-1/join", { name: "Học Sinh" });
    expect(attempt.result).toEqual({ token: "tok", server_url: "wss://x", room_name: "r1" });
    expect(attempt.forbiddenCode).toBeUndefined();
  });

  it("map lỗi 403 KICKED sang forbiddenCode='KICKED'", async () => {
    (serverApi.get as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "u1", username: "hs1" });
    (serverApi.post as ReturnType<typeof vi.fn>).mockRejectedValue(
      new HttpError(403, "API Error: 403", { message: "KICKED", error: "forbidden: kicked" })
    );

    const attempt = await joinLivestream("session-1");

    expect(attempt.result).toBeNull();
    expect(attempt.forbiddenCode).toBe("KICKED");
  });

  it("map lỗi 403 NOT_SESSION_MEMBER sang forbiddenCode tương ứng", async () => {
    (serverApi.get as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "u1", username: "hs1" });
    (serverApi.post as ReturnType<typeof vi.fn>).mockRejectedValue(
      new HttpError(403, "API Error: 403", { message: "NOT_SESSION_MEMBER", error: "forbidden" })
    );

    const attempt = await joinLivestream("session-1");

    expect(attempt.forbiddenCode).toBe("NOT_SESSION_MEMBER");
  });

  it("lỗi không phải 403 (vd 401 chưa đăng nhập) -> forbiddenCode undefined", async () => {
    (serverApi.get as ReturnType<typeof vi.fn>).mockRejectedValue(new HttpError(401, "API Error: 401"));

    const attempt = await joinLivestream("session-1");

    expect(attempt.result).toBeNull();
    expect(attempt.forbiddenCode).toBeUndefined();
  });
});
