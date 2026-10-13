/**
 * F-08 (QA2 261013): URL khoá học / bài học / quiz không tồn tại trả HTTP 200 kèm chữ
 * "không tìm thấy" (soft 404). `notFound()` gọi trong trang KHÔNG đổi được status vì các
 * `loading.tsx` bọc phía trên đã flush shell 200 từ trước -> chỉ middleware (chạy trước khi
 * render) đặt được 404 thật. Test này khoá phần quyết định "tài nguyên có thật không".
 */
import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";
import {
  MISSING_RESOURCE_REWRITE_PATH,
  isMissingResource,
} from "./missing-resource-probe";

const API = "http://api.test/api";

function documentRequest(path: string, headers: Record<string, string> = {}) {
  return new NextRequest(new URL(path, "http://localhost:3000"), { headers });
}

function fakeFetch(status: number) {
  return vi.fn(async () => new Response("{}", { status }));
}

describe("isMissingResource — khoá học công khai", () => {
  it("backend 404 cho slug -> thiếu", async () => {
    const fetchImpl = fakeFetch(404);
    const missing = await isMissingResource(documentRequest("/courses/khong-co"), { fetchImpl, apiBaseUrl: API });
    expect(missing).toBe(true);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(String(fetchImpl.mock.calls[0]?.[0])).toBe(`${API}/courses/slug/khong-co`);
  });

  it("backend 200 -> có thật", async () => {
    const missing = await isMissingResource(documentRequest("/courses/react"), {
      fetchImpl: fakeFetch(200),
      apiBaseUrl: API,
    });
    expect(missing).toBe(false);
  });

  it("backend 500 KHÔNG được coi là 'không tồn tại' (không biến sự cố thành 404 vĩnh viễn)", async () => {
    const missing = await isMissingResource(documentRequest("/courses/react"), {
      fetchImpl: fakeFetch(500),
      apiBaseUrl: API,
    });
    expect(missing).toBe(false);
  });

  it("backend chết (fetch ném lỗi) -> không chặn trang, có cảnh báo", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const missing = await isMissingResource(documentRequest("/courses/react"), {
      fetchImpl: vi.fn(async () => {
        throw new Error("ECONNREFUSED");
      }),
      apiBaseUrl: API,
    });
    expect(missing).toBe(false);
    expect(warn).toHaveBeenCalled();
  });

  it("slug có ký tự đặc biệt được encode khi gọi backend", async () => {
    const fetchImpl = fakeFetch(404);
    await isMissingResource(documentRequest("/courses/a%20b"), { fetchImpl, apiBaseUrl: API });
    expect(String(fetchImpl.mock.calls[0]?.[0])).toBe(`${API}/courses/slug/a%20b`);
  });
});

describe("isMissingResource — trang học (/learn/<slug>/<bài>)", () => {
  it("khoá học không tồn tại -> thiếu", async () => {
    const fetchImpl = fakeFetch(404);
    const missing = await isMissingResource(documentRequest("/learn/does-not-exist-course/abc"), {
      fetchImpl,
      apiBaseUrl: API,
    });
    expect(missing).toBe(true);
    expect(String(fetchImpl.mock.calls[0]?.[0])).toBe(`${API}/courses/slug/does-not-exist-course`);
  });
});

describe("isMissingResource — quiz (cần đăng nhập)", () => {
  const id = "00000000-0000-0000-0000-000000000000";

  it("chuyển tiếp cookie phiên sang backend và 404 -> thiếu", async () => {
    const fetchImpl = fakeFetch(404);
    const request = documentRequest(`/quizzes/${id}`, { cookie: "accessToken=abc; rfToken=def" });
    const missing = await isMissingResource(request, { fetchImpl, apiBaseUrl: API });
    expect(missing).toBe(true);
    const init = fetchImpl.mock.calls[0]?.[1] as RequestInit;
    expect((init.headers as Record<string, string>).cookie).toBe("accessToken=abc; rfToken=def");
  });

  it("id sai định dạng (backend 400) cũng là không tìm thấy", async () => {
    const missing = await isMissingResource(documentRequest("/quizzes/abc", { cookie: "accessToken=x" }), {
      fetchImpl: fakeFetch(400),
      apiBaseUrl: API,
    });
    expect(missing).toBe(true);
  });

  it("401/403 (hết phiên, không có quyền) KHÔNG được coi là thiếu", async () => {
    for (const status of [401, 403]) {
      const missing = await isMissingResource(documentRequest(`/quizzes/${id}`, { cookie: "accessToken=x" }), {
        fetchImpl: fakeFetch(status),
        apiBaseUrl: API,
      });
      expect(missing, `status ${status}`).toBe(false);
    }
  });

  it("không có cookie phiên thì không gọi backend", async () => {
    const fetchImpl = fakeFetch(404);
    const missing = await isMissingResource(documentRequest(`/quizzes/${id}`), { fetchImpl, apiBaseUrl: API });
    expect(missing).toBe(false);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

describe("isMissingResource — không đụng tới route khác", () => {
  it.each([
    "/courses",
    "/courses/react/learn",
    "/courses/react/exercises",
    "/home",
    "/quizzes/abc/result",
    "/learn",
    "/contests/thi-git",
  ])("%s -> không gọi backend", async (path) => {
    const fetchImpl = fakeFetch(404);
    const missing = await isMissingResource(documentRequest(path, { cookie: "accessToken=x" }), {
      fetchImpl,
      apiBaseUrl: API,
    });
    expect(missing).toBe(false);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("request RSC / prefetch của <Link> không bị dò (tránh N lần gọi backend mỗi trang danh mục)", async () => {
    for (const headers of [{ rsc: "1" }, { "next-router-prefetch": "1" }]) {
      const fetchImpl = fakeFetch(404);
      const missing = await isMissingResource(documentRequest("/courses/react", headers), {
        fetchImpl,
        apiBaseUrl: API,
      });
      expect(missing).toBe(false);
      expect(fetchImpl).not.toHaveBeenCalled();
    }
  });
});

describe("MISSING_RESOURCE_REWRITE_PATH", () => {
  it("không trùng route thật nào (để Next render app/not-found.tsx với status 404)", () => {
    expect(MISSING_RESOURCE_REWRITE_PATH.startsWith("/")).toBe(true);
    expect(MISSING_RESOURCE_REWRITE_PATH).not.toMatch(/^\/(courses|learn|quizzes|home)/);
  });
});
