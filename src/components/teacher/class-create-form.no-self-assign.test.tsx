/**
 * backend#143 Q3-06: POST /classes giờ tự gán người tạo làm giảng viên chính trong cùng transaction, và gọi
 * POST /classes/:id/teachers cho chính người tạo sẽ báo "đã được gán". Form tạo lớp chỉ được gọi tạo lớp một lần.
 */
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithQuery } from "@/test-utils/query-wrapper";

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock("@/hooks/queries/use-auth", () => ({ useMyRoles: () => ({ data: undefined }) }));
vi.mock("@/lib/api-client", async () => {
  const { mockApi } = await import("@/test/mock-api");
  return { api: mockApi };
});

import { mockApi, resetMockApi } from "@/test/mock-api";
import { ClassCreateForm } from "./class-create-form";

beforeEach(() => {
  resetMockApi();
  mockApi.post.mockResolvedValue({ data: { data: { id: "class-1", name: "Lớp A" } } });
});

describe("ClassCreateForm — người tạo đã được backend gán", () => {
  it("tạo lớp xong không gọi thêm API gán giảng viên", async () => {
    const onCreated = vi.fn();
    renderWithQuery(<ClassCreateForm courseId="course-1" onCreated={onCreated} />);
    fireEvent.change(screen.getByPlaceholderText("VD: Lớp A - K67"), { target: { value: "Lớp A" } });
    fireEvent.click(screen.getByRole("button", { name: /Tạo lớp/ }));
    await waitFor(() => expect(onCreated).toHaveBeenCalledTimes(1));

    expect(mockApi.post).toHaveBeenCalledTimes(1);
    expect(mockApi.post.mock.calls[0][0]).toBe("/courses/course-1/classes");
    expect(mockApi.post.mock.calls.some(([url]) => String(url).includes("/teachers"))).toBe(false);
  });
});
