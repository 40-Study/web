/**
 * Q7-T09: 404 trong khung giảng viên có liên kết về trang giảng viên (không phải "Về trang chủ" của 404 toàn cục), và
 * route bắt-tất-cả `/teacher/<lạ>` thực sự ném notFound() để Next dựng trang này.
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const notFoundMock = vi.hoisted(() => vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
}));
vi.mock("next/navigation", () => ({ notFound: notFoundMock }));

// eslint-disable-next-line import/first
import TeacherNotFound from "./not-found";
// eslint-disable-next-line import/first
import TeacherUnknownRoutePage from "./teacher/[...slug]/page";

describe("(teacher) not-found (Q7-T09)", () => {
  it("hiện 'Không tìm thấy trang' kèm liên kết về /teacher", () => {
    render(<TeacherNotFound />);
    expect(screen.getByRole("heading", { name: "Không tìm thấy trang" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Về trang giảng viên" }).getAttribute("href")).toBe("/teacher");
    expect(screen.queryByRole("link", { name: "Về trang chủ" })).toBeNull();
  });

  it("route bắt-tất-cả gọi notFound()", () => {
    expect(() => TeacherUnknownRoutePage()).toThrow("NEXT_NOT_FOUND");
    expect(notFoundMock).toHaveBeenCalled();
  });
});
