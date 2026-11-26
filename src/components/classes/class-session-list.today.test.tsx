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

  it("đổi classId không remount: nhảy lại tới trang chứa hôm nay của lớp mới (review L2)", async () => {
    resetMockApi();
    const rowsFor = (classId: string, todayIndex: number) =>
      Array.from({ length: 104 }, (_, i) => ({
        id: `${classId}-s${i}`, class_id: classId, date: vnDay(i - todayIndex), start_time: "19:00", end_time: "20:30", status: "scheduled", topic: `${classId} buổi ${i + 1}`,
      }));
    const data: Record<string, ReturnType<typeof rowsFor>> = { c1: rowsFor("c1", 89), c2: rowsFor("c2", 10) };
    mockApi.get.mockImplementation((url: string, config: { params: { page: number; page_size: number } }) => {
      const rows = data[url.includes("c2") ? "c2" : "c1"];
      const { page, page_size } = config.params;
      return Promise.resolve(envelope({ data: rows.slice((page - 1) * page_size, page * page_size), total: 104, page, page_size }));
    });
    const ui = (classId: string) => <ClassSessionList classId={classId} canWrite hasSchedules onGenerate={() => {}} onAdd={() => {}} />;
    const { rerender } = renderWithProviders(ui("c1"));
    expect(await screen.findByText("Trang 5 / 6")).toBeTruthy();

    rerender(ui("c2"));
    expect(await screen.findByText("Trang 1 / 6")).toBeTruthy();
    expect(screen.getByText("c2 buổi 11")).toBeTruthy();
  });
});
