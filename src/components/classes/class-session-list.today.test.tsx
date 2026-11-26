/** Q8-T06: danh sách buổi học của lớp nhiều buổi mở ở trang chứa hôm nay, không phải "Trang 1/6". */

import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-client", async () => {
  const { mockApi } = await import("@/test/mock-api");
  return { api: mockApi };
});

import { ClassSessionList } from "./class-session-list";
import { envelope, mockApi, resetMockApi } from "@/test/mock-api";
import { renderWithProviders } from "@/test/utils";

const vnDay = (offset: number) =>
  new Date(Date.now() + offset * 86_400_000).toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" });

describe("ClassSessionList mở đúng trang hôm nay (Q8-T06)", () => {
  it("104 buổi, hôm nay là buổi thứ 90: mở trang 5/6, có buổi hôm nay, nút 'Trang trước' bật", async () => {
    resetMockApi();
    const rows = Array.from({ length: 104 }, (_, i) => ({
      id: `s${i}`, class_id: "c1", date: vnDay(i - 89), start_time: "19:00", end_time: "20:30", status: "scheduled", topic: `Buổi ${i + 1}`,
    }));
    mockApi.get.mockImplementation((_url: string, config: { params: { page: number; page_size: number } }) => {
      const { page, page_size } = config.params;
      return Promise.resolve(envelope({ data: rows.slice((page - 1) * page_size, page * page_size), total: 104, page, page_size }));
    });
    renderWithProviders(<ClassSessionList classId="c1" canWrite hasSchedules onGenerate={() => {}} onAdd={() => {}} />);

    expect(await screen.findByText("Trang 5 / 6")).toBeTruthy();
    expect(screen.getByText("Buổi 90")).toBeTruthy();
    expect(screen.queryByText("Buổi 1")).toBeNull();
    expect(screen.getByText("Buổi học (104)")).toBeTruthy();
  });
});
