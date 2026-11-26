/** Q8-T06: lớp 104 buổi: ô chọn buổi có đủ 104 lựa chọn và mặc định là buổi gần hôm nay nhất, không dừng ở 50 buổi cũ. */

import { render, screen, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-client", async () => {
  const { mockApi } = await import("@/test/mock-api");
  return { api: mockApi };
});
vi.mock("next/navigation", () => ({ useParams: () => ({ classId: "c1" }) }));
vi.mock("@/hooks/queries/use-classes", () => ({ useClassStudentsByClassId: () => ({ data: [], isLoading: false }) }));
vi.mock("@/hooks/queries/use-class-manage", () => ({ useClassById: () => ({ data: { id: "c1", status: "active" } }) }));
vi.mock("@/components/attendance/attendance-table", () => ({ AttendanceTable: () => null }));
vi.mock("@/components/attendance/attendance-card-list", () => ({ AttendanceCardList: () => null }));
vi.mock("@/hooks/queries/use-sessions", async (orig) => ({
  ...(await orig<typeof import("@/hooks/queries/use-sessions")>()),
  useSessionAttendances: () => ({ data: [], isLoading: false }),
}));

import { envelope, mockApi, resetMockApi } from "@/test/mock-api";
import { createTestQueryClient } from "@/test/utils";
import ClassAttendancePage from "./page";

const vnDay = (offset: number) =>
  new Date(Date.now() + offset * 86_400_000).toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" });

describe("ClassAttendancePage: lớp nhiều buổi (Q8-T06)", () => {
  it("chọn được cả 104 buổi; mặc định là buổi hôm nay (buổi thứ 90), không phải buổi 50", async () => {
    resetMockApi();
    const rows = Array.from({ length: 104 }, (_, i) => ({
      id: `s${i}`, class_id: "c1", date: vnDay(i - 89), start_time: "19:00", end_time: "20:30", status: "scheduled",
    }));
    mockApi.get.mockImplementation((_url: string, config: { params: { page: number; page_size: number } }) => {
      const { page, page_size } = config.params;
      return Promise.resolve(envelope({ data: rows.slice((page - 1) * page_size, page * page_size), total: 104, page, page_size }));
    });
    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <ClassAttendancePage />
      </QueryClientProvider>,
    );

    const select = (await screen.findByRole("combobox")) as HTMLSelectElement;
    await waitFor(() => expect(select.options.length).toBe(104));
    await waitFor(() => expect(select.value).toBe("s89"));
  });
});
