/**
 * Q6-T01 (P1): mở /teacher/assignments/<id không tồn tại>/submissions tạo bão request (5.958 GET 404 trong 70 giây)
 * và spinner mãi. Bài tập 404 phải ra trạng thái "Không tìm thấy bài tập" với số request bị chặn.
 * Dùng QueryClient thật của app (createAppQueryClient) và service giả ở tầng HTTP, không mock useQuery.
 */

import { render, screen } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/errors";
import { createAppQueryClient } from "@/lib/query-client";
import AssignmentSubmissionsPage from "./page";

const getById = vi.fn();
const getByAssignment = vi.fn();

vi.mock("next/navigation", () => ({ useParams: () => ({ id: "00000000-0000-0000-0000-000000000000" }) }));
vi.mock("@/services/assignment.service", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/services/assignment.service")>()),
  assignmentService: { getById: (...a: unknown[]) => getById(...a) },
}));
vi.mock("@/services/submission.service", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/services/submission.service")>()),
  submissionService: { getByAssignment: (...a: unknown[]) => getByAssignment(...a) },
}));

function renderPage() {
  return render(
    <QueryClientProvider client={createAppQueryClient()}>
      <AssignmentSubmissionsPage />
    </QueryClientProvider>,
  );
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 400));

describe("AssignmentSubmissionsPage, bài tập không tồn tại (Q6-T01)", () => {
  beforeEach(() => {
    getById.mockReset();
    getByAssignment.mockReset();
    getByAssignment.mockResolvedValue({ data: [], total: 0, page: 1, page_size: 100 });
  });

  it("404: hiện 'Không tìm thấy bài tập' và số request không tăng theo thời gian", async () => {
    getById.mockRejectedValue(new ApiError(404, "ERR_NOT_FOUND", "not found"));
    renderPage();

    expect(await screen.findByText("Không tìm thấy bài tập")).toBeTruthy();
    await settle();

    expect(getById.mock.calls.length).toBeLessThanOrEqual(1);
    expect(getByAssignment).not.toHaveBeenCalled();
    expect(screen.getByRole("link", { name: "Về danh sách bài tập" }).getAttribute("href")).toBe("/teacher/assignments");
  });

  it("403: hiện 'Không có quyền truy cập' và không lặp request", async () => {
    getById.mockRejectedValue(new ApiError(403, "ERR_FORBIDDEN", "forbidden"));
    renderPage();

    expect(await screen.findByText("Không có quyền truy cập")).toBeTruthy();
    await settle();
    expect(getById.mock.calls.length).toBeLessThanOrEqual(1);
  });

  // Q6 #130 L3: id sai định dạng -> backend 400 `{"error":"invalid id"}`; "Thử lại" không giúp được gì.
  it("400 (id sai định dạng): hiện 'Không tìm thấy bài tập', không có nút Thử lại, không lặp request", async () => {
    getById.mockRejectedValue(new ApiError(400, "UNKNOWN", "invalid id"));
    renderPage();

    expect(await screen.findByText("Không tìm thấy bài tập")).toBeTruthy();
    await settle();
    expect(screen.queryByText("Không tải được bài tập")).toBeNull();
    expect(screen.queryByRole("button", { name: "Thử lại" })).toBeNull();
    expect(getById.mock.calls.length).toBeLessThanOrEqual(1);
  });

  it("5xx: hiện lỗi tải kèm nút Thử lại, không báo 'không tìm thấy'", async () => {
    getById.mockRejectedValue(new ApiError(500, "ERR_INTERNAL", "boom"));
    renderPage();

    expect(await screen.findByText("Không tải được bài tập", undefined, { timeout: 5000 })).toBeTruthy();
    expect(screen.queryByText("Không tìm thấy bài tập")).toBeNull();
    expect(screen.getByRole("button", { name: "Thử lại" })).toBeTruthy();
  }, 10000);
});
