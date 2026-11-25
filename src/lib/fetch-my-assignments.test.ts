/** QA7 S7-09 (C16): một request /me/assignments; chỉ 404 (backend cũ) mới rơi về cách gọi từng buổi. */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/errors";

const getMine = vi.hoisted(() => vi.fn());
const listSessions = vi.hoisted(() => vi.fn());
const getAssignments = vi.hoisted(() => vi.fn());

vi.mock("@/services/assignment.service", () => ({ assignmentService: { getMine } }));
vi.mock("@/services/livestream-classroom.service", () => ({
  livestreamClassroomService: { listSessions, getAssignments },
}));

import { fetchMyAssignments } from "./fetch-my-assignments";

const row = (id: string) => ({ id });

beforeEach(() => {
  getMine.mockReset();
  listSessions.mockReset();
  getAssignments.mockReset();
});

describe("fetchMyAssignments", () => {
  it("một request cho mọi buổi: không gọi listSessions/getAssignments", async () => {
    getMine.mockResolvedValue({ data: [row("a"), row("b")], total: 2, page: 1, page_size: 100 });
    const out = await fetchMyAssignments();
    expect(out.map((a) => a.id)).toEqual(["a", "b"]);
    expect(getMine).toHaveBeenCalledTimes(1);
    expect(listSessions).not.toHaveBeenCalled();
    expect(getAssignments).not.toHaveBeenCalled();
  });

  it("nhiều hơn một trang: đi hết các trang theo total", async () => {
    const page1 = Array.from({ length: 100 }, (_, i) => row(`p1-${i}`));
    getMine
      .mockResolvedValueOnce({ data: page1, total: 101, page: 1, page_size: 100 })
      .mockResolvedValueOnce({ data: [row("p2-0")], total: 101, page: 2, page_size: 100 });
    const out = await fetchMyAssignments();
    expect(out).toHaveLength(101);
    expect(getMine).toHaveBeenNthCalledWith(2, 2, 100);
  });

  it("404 (backend cũ): rơi về từng buổi, mỗi buổi một request", async () => {
    getMine.mockRejectedValue(new ApiError(404, "ERR_NOT_FOUND", "x"));
    listSessions.mockResolvedValue([{ id: "s1" }, { id: "s2" }]);
    getAssignments.mockImplementation(async (id: string) => [row(`from-${id}`)]);
    const out = await fetchMyAssignments();
    expect(out.map((a) => a.id)).toEqual(["from-s1", "from-s2"]);
    expect(getAssignments).toHaveBeenCalledTimes(2);
  });

  it("lỗi khác 404 (5xx) được ném lên, không rơi về cách cũ", async () => {
    getMine.mockRejectedValue(new ApiError(500, "ERR_INTERNAL", "x"));
    await expect(fetchMyAssignments()).rejects.toThrow();
    expect(listSessions).not.toHaveBeenCalled();
  });
});
