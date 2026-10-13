/**
 * Review QA2 #9: layout phía server gọi notFound() khi giảng viên không tồn tại, để Next trả 404 thật thay vì 200 +
 * "not found" vẽ ở client. Backend lỗi thì KHÔNG 404 (metadata mặc định).
 * PG-M1 x PG-M2: metadata đi qua buildPageMetadata nên có canonical và og:title riêng theo giảng viên.
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
    expect(meta.alternates?.canonical).toBe("/teachers/t1");
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

  it("canonical và og:title riêng theo giảng viên, ảnh og là avatar", async () => {
    fetcher.get.mockResolvedValue({
      status: "ok",
      profile: {
        id: "t-1",
        user_name: "nva",
        full_name: "Nguyễn Văn A",
        bio: "Giảng viên toán   10 năm\nkinh nghiệm",
        avatar_url: "https://cdn.test/a.png",
      },
    });
    const meta = await generateMetadata({ params: { id: "t-1" } });
    expect(meta.alternates?.canonical).toBe("/teachers/t-1");
    expect(meta.openGraph?.title).toBe("Nguyễn Văn A");
    expect(meta.description).toBe("Giảng viên toán 10 năm kinh nghiệm");
    expect(meta.openGraph?.images).toEqual([{ url: "https://cdn.test/a.png", alt: "Nguyễn Văn A" }]);
  });

  it("thiếu full_name dùng user_name; thiếu bio thì mô tả theo chuyên môn", async () => {
    fetcher.get.mockResolvedValue({
      status: "ok",
      profile: { id: "t-2", user_name: "nva", full_name: null, bio: null, specialization: "Toán", avatar_url: null },
    });
    const meta = await generateMetadata({ params: { id: "t-2" } });
    expect(meta.title).toBe("nva");
    expect(meta.description).toContain("Toán");
    expect(meta.openGraph?.images).toEqual([expect.objectContaining({ url: "/logo.png" })]);
  });

  it("id có ký tự lạ được mã hoá trong canonical", async () => {
    fetcher.get.mockResolvedValue({ status: "unavailable" });
    const meta = await generateMetadata({ params: { id: "a b/c" } });
    expect(meta.alternates?.canonical).toBe("/teachers/a%20b%2Fc");
  });
});
