import { afterEach, describe, expect, it, vi } from "vitest";
import { listPublishedCoursesServer } from "../course";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("listPublishedCoursesServer", () => {
  it("phân trang theo giới hạn 100 của backend để không bỏ sót sitemap", async () => {
    const firstPage = Array.from({ length: 100 }, (_, index) => ({
      id: String(index + 1),
      slug: `course-${index + 1}`,
      title: `Course ${index + 1}`,
      status: "published",
    }));

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { courses: firstPage, total: 101, page: 1, page_size: 100 },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            courses: [
              {
                id: "101",
                slug: "course-101",
                title: "Course 101",
                status: "published",
              },
            ],
            total: 101,
            page: 2,
            page_size: 100,
          },
        }),
      });
    vi.stubGlobal("fetch", fetchMock);

    const courses = await listPublishedCoursesServer();

    expect(courses).toHaveLength(101);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain(
      "status=published&page=1&page_size=100"
    );
    expect(String(fetchMock.mock.calls[1]?.[0])).toContain(
      "status=published&page=2&page_size=100"
    );
  });
});
