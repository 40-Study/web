/**
 * QA2 F-10: web không có service/route nào cho wishlist. Contract BE3 §4.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-client", async () => {
  const { mockApi } = await import("@/test/mock-api");
  return { api: mockApi };
});

import { wishlistService } from "@/services/wishlist.service";
import { envelope, mockApi, resetMockApi } from "@/test/mock-api";

beforeEach(() => resetMockApi());

describe("wishlistService", () => {
  it("list: GET /wishlist, trả items + total_item", async () => {
    const page = { items: [{ id: "w1", course_id: "c1", user_id: "u", created_at: "x", course: { id: "c1", title: "A" } }], total_item: 1 };
    mockApi.get.mockResolvedValue(envelope(page));

    expect(await wishlistService.list()).toEqual(page);
    expect(mockApi.get).toHaveBeenCalledWith("/wishlist");
  });

  it("ids: GET /wishlist/ids, trả mảng course_ids", async () => {
    mockApi.get.mockResolvedValue(envelope({ course_ids: ["c1", "c2"] }));
    expect(await wishlistService.ids()).toEqual(["c1", "c2"]);
    expect(mockApi.get).toHaveBeenCalledWith("/wishlist/ids");
  });

  it("ids: course_ids null (chưa có gì) -> mảng rỗng", async () => {
    mockApi.get.mockResolvedValue(envelope({ course_ids: null }));
    expect(await wishlistService.ids()).toEqual([]);
  });

  it("add: POST /wishlist { course_id }", async () => {
    mockApi.post.mockResolvedValue(envelope({ id: "w1", course_id: "c1" }));
    await wishlistService.add("c1");
    expect(mockApi.post).toHaveBeenCalledWith("/wishlist", { course_id: "c1" });
  });

  it("remove: DELETE /wishlist/:courseID", async () => {
    mockApi.delete.mockResolvedValue({ data: { message: "ok" } });
    await wishlistService.remove("c1");
    expect(mockApi.delete).toHaveBeenCalledWith("/wishlist/c1");
  });
});
