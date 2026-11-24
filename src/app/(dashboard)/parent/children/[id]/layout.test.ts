/** N-08 (QA4 261123): trang chi tiết con có tiêu đề theo tên con, không còn chỉ "ForteX". */
import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock("@/lib/server-api", () => ({ serverApi: { get: api.get } }));

import { generateMetadata } from "./layout";

beforeEach(() => { api.get.mockReset(); });

describe("/parent/children/[id] generateMetadata", () => {
  it("có tên con -> title là tên, gọi overview của đúng con", async () => {
    api.get.mockResolvedValue({ full_name: "Lê Văn C", username: "student1" });
    expect((await generateMetadata({ params: { id: "c1" } })).title).toBe("Lê Văn C");
    expect(api.get).toHaveBeenCalledWith("/parent/children/c1/overview");
  });

  it("không có họ tên -> dùng username", async () => {
    api.get.mockResolvedValue({ full_name: " ", username: "student1" });
    expect((await generateMetadata({ params: { id: "c1" } })).title).toBe("student1");
  });

  it("không phải con / backend lỗi -> 'Con của tôi'", async () => {
    api.get.mockImplementation(async () => { throw new Error("API Error: 404"); });
    expect((await generateMetadata({ params: { id: "zzz" } })).title).toBe("Con của tôi");
  });
});
