/** QA 261008 T12: /teacher từng 404 (không có page.tsx). Phải chuyển tới trang đích sau đăng nhập. */

import { describe, expect, it, vi } from "vitest";

const { redirect } = vi.hoisted(() => ({
  redirect: vi.fn((url: string) => {
    // Giống next/navigation: redirect() ném để dừng render.
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));
vi.mock("next/navigation", () => ({ redirect }));

// eslint-disable-next-line import/first
import TeacherIndexPage from "./page";

describe("/teacher (gốc khu giảng viên)", () => {
  it("redirect tới /teacher/schedule", () => {
    expect(() => TeacherIndexPage()).toThrow("NEXT_REDIRECT:/teacher/schedule");
    expect(redirect).toHaveBeenCalledWith("/teacher/schedule");
  });
});
