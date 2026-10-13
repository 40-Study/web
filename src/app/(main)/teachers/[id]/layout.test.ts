/**
 * Review QA2 #9: layout phía server gọi notFound() khi giảng viên không tồn tại, để Next trả 404 thật thay vì 200 +
 * "not found" vẽ ở client. Backend lỗi thì KHÔNG 404 (metadata mặc định).
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const nav = vi.hoisted(() => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));
vi.mock("next/navigation", () => ({ notFound: nav.notFound }));
const fetcher = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock("@/lib/server-fetchers/teacher", () => ({ getTeacherPublicProfileServer: fetcher.get }));

import { generateMetadata } from "./layout";

beforeEach(() => {
  nav.notFound.mockClear();
  fetcher.get.mockReset();
});

describe("/teachers/[id] generateMetadata", () => {
  it("không có giảng viên -> notFound()", async () => {
    fetcher.get.mockResolvedValue({ status: "not-found" });
    await expect(generateMetadata({ params: { id: "zzz" } })).rejects.toThrow("NEXT_NOT_FOUND");
    expect(nav.notFound).toHaveBeenCalledTimes(1);
  });

  it("backend lỗi -> metadata mặc định, không notFound()", async () => {
    fetcher.get.mockResolvedValue({ status: "unavailable" });
    const meta = await generateMetadata({ params: { id: "t1" } });
    expect(nav.notFound).not.toHaveBeenCalled();
    expect(meta.title).toBe("Giảng viên");
  });

  it("có giảng viên -> title là tên, mô tả từ bio (không lộ trường nào khác)", async () => {
    fetcher.get.mockResolvedValue({
      status: "ok",
      profile: { id: "t1", user_name: "gv_a", full_name: "Trần Thị A", bio: "Dạy web mười năm." },
    });
    const meta = await generateMetadata({ params: { id: "t1" } });
    expect(meta.title).toBe("Trần Thị A");
    expect(meta.description).toBe("Dạy web mười năm.");
  });

  it("hồ sơ bị ẩn (không có bio): mô tả chung, vẫn có title", async () => {
    fetcher.get.mockResolvedValue({
      status: "ok",
      profile: { id: "t1", user_name: "gv_a", full_name: null, profile_hidden: true },
    });
    const meta = await generateMetadata({ params: { id: "t1" } });
    expect(meta.title).toBe("gv_a");
    expect(String(meta.description)).toMatch(/gv_a/);
  });
});
