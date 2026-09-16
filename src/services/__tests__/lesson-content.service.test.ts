/**
 * C-6 — tầng service phải bỏ hẳn khoá `duration` khi giá trị không phải số dương.
 *
 * Đây là lớp chặn cuối: dù một call site tương lai có truyền `duration: 0` (hay
 * `undefined`, `NaN`) thì body gửi lên backend vẫn không được chứa số 0 — vì backend
 * đọc `0` y hệt "chưa biết" và từ chối tính `watched_pct` (C-2), đúng khoảng trống
 * mà C-6 sinh ra để bịt.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

// Dùng chung mock với các test service khác — xem `@/test/mock-api`.
vi.mock("@/lib/api-client", async () => {
  const { mockApi } = await import("@/test/mock-api");
  return { api: mockApi };
});

import { lessonContentService } from "@/services/lesson-content.service";
import { envelope, mockApi, resetMockApi } from "@/test/mock-api";

/**
 * Lấy body mà `axios` thực sự gửi đi.
 *
 * Chuỗi hoá bằng `JSON.stringify` chứ không đọc thẳng object: axios dựng body đúng
 * bằng cách đó, và chỉ qua đó mới thấy được một khoá `undefined` có thật sự biến mất
 * hay không (`JSON.stringify({ a: undefined })` → `"{}"`).
 */
function sentBody(mock: ReturnType<typeof vi.fn>): Record<string, unknown> {
  const call = mock.mock.calls.at(-1);
  expect(call).toBeDefined();
  return JSON.parse(JSON.stringify(call![1] as Record<string, unknown>)) as Record<
    string,
    unknown
  >;
}

beforeEach(() => {
  resetMockApi();
  mockApi.post.mockResolvedValue(envelope({}));
  mockApi.put.mockResolvedValue(envelope({}));
});

describe("lessonContentService.createContent — thời lượng (C-6)", () => {
  it("truyền `duration` dương thì gửi nguyên giá trị", async () => {
    await lessonContentService.createContent("lesson-1", {
      type: "video",
      title: "Bài 1",
      video_url: "https://youtu.be/abc",
      duration: 750,
    });

    expect(sentBody(mockApi.post)).toEqual({
      type: "video",
      title: "Bài 1",
      video_url: "https://youtu.be/abc",
      duration: 750,
    });
  });

  it("`duration: 0` bị BỎ khỏi body, không gửi số 0", async () => {
    await lessonContentService.createContent("lesson-1", {
      type: "video",
      title: "Bài 1",
      video_url: "https://youtu.be/abc",
      duration: 0,
    });

    const body = sentBody(mockApi.post);
    expect("duration" in body).toBe(false);
  });

  it("`duration: undefined` (ô trống) bị bỏ khỏi body", async () => {
    await lessonContentService.createContent("lesson-1", {
      type: "video",
      title: "Bài 1",
      video_url: "https://youtu.be/abc",
      duration: undefined,
    });

    expect("duration" in sentBody(mockApi.post)).toBe(false);
  });

  it("`duration: NaN` bị bỏ khỏi body", async () => {
    await lessonContentService.createContent("lesson-1", {
      type: "video",
      title: "Bài 1",
      video_url: "https://youtu.be/abc",
      duration: Number.NaN,
    });

    expect("duration" in sentBody(mockApi.post)).toBe(false);
  });

  it("giá trị âm bị bỏ khỏi body", async () => {
    await lessonContentService.createContent("lesson-1", {
      type: "video",
      title: "Bài 1",
      video_url: "https://youtu.be/abc",
      duration: -10,
    });

    expect("duration" in sentBody(mockApi.post)).toBe(false);
  });

  it("livestream không bị thêm trường `duration`", async () => {
    await lessonContentService.createContent("lesson-1", {
      type: "livestream",
      title: "Buổi 1",
    });

    expect("duration" in sentBody(mockApi.post)).toBe(false);
  });
});

describe("lessonContentService.updateContent — thời lượng (C-6)", () => {
  it("sửa thời lượng thì gửi giá trị mới (giây)", async () => {
    await lessonContentService.updateContent("lesson-1", "content-1", {
      title: "Bài 1",
      duration: 300,
    });

    expect(sentBody(mockApi.put)).toEqual({ title: "Bài 1", duration: 300 });
  });

  it("`duration: 0` bị bỏ — không vô hiệu hoá thời lượng đang lưu", async () => {
    await lessonContentService.updateContent("lesson-1", "content-1", {
      title: "Bài 1",
      duration: 0,
    });

    const body = sentBody(mockApi.put);
    expect("duration" in body).toBe(false);
    expect(body.title).toBe("Bài 1");
  });

  it("chỉ sửa tiêu đề thì body không có `duration`", async () => {
    await lessonContentService.updateContent("lesson-1", "content-1", {
      title: "Bài 1 đổi tên",
    });

    expect(sentBody(mockApi.put)).toEqual({ title: "Bài 1 đổi tên" });
  });
});
