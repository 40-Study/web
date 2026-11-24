/**
 * Q6-T04: backend không bao giờ chuyển buổi sang "Đã kết thúc" nên buổi 24/11 14:00-15:00 đã qua vẫn hiện "Đã lên lịch"
 * không kèm hành động, cạnh buổi sắp tới có "Huỷ buổi". Buổi đã qua phải hiện "Đã diễn ra", buổi đang diễn ra "Đang diễn
 * ra", và huy hiệu của mọi dòng nằm cùng chỗ dù dòng có nút hay không.
 */

import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-client", async () => {
  const { mockApi } = await import("@/test/mock-api");
  return { api: mockApi };
});

import { ClassSessionList, sessionDisplayMeta } from "./class-session-list";
import { envelope, mockApi, resetMockApi } from "@/test/mock-api";
import { renderWithProviders } from "@/test/utils";
import type { ClassSession } from "@/services/session.service";

const CLASS_ID = "c1";
const row = (id: string, date: string, status: string, start: string, end: string) => ({
  id, class_id: CLASS_ID, date, start_time: start, end_time: end, status,
});
const vnDay = (days: number) =>
  new Date(Date.now() + days * 86_400_000).toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" });

describe("sessionDisplayMeta (Q6-T04)", () => {
  // 12:00 giờ VN = 05:00 UTC.
  const now = new Date("2026-11-24T05:00:00Z");
  const s = (date: string, start: string, end: string, status = "scheduled") =>
    ({ id: "x", class_id: CLASS_ID, date, start_time: start, end_time: end, status }) as unknown as ClassSession;

  it("scheduled đã qua giờ kết thúc -> Đã diễn ra; đang trong giờ -> Đang diễn ra; chưa tới -> Đã lên lịch", () => {
    expect(sessionDisplayMeta(s("2026-11-24", "14:00", "15:00"), new Date("2026-11-24T09:00:00Z")).label).toBe("Đã diễn ra");
    expect(sessionDisplayMeta(s("2026-11-24", "11:00", "13:00"), now).label).toBe("Đang diễn ra");
    expect(sessionDisplayMeta(s("2026-11-24", "18:00", "19:00"), now).label).toBe("Đã lên lịch");
  });

  it("trạng thái backend khác scheduled giữ nguyên dù đã qua giờ", () => {
    expect(sessionDisplayMeta(s("2026-11-01", "18:00", "19:00", "cancelled"), now).label).toBe("Đã huỷ");
    expect(sessionDisplayMeta(s("2026-11-01", "18:00", "19:00", "completed"), now).label).toBe("Đã kết thúc");
  });
});

describe("ClassSessionList: huy hiệu theo giờ thật (Q6-T04)", () => {
  it("buổi đã qua không còn 'Đã lên lịch'; buổi tương lai vẫn 'Đã lên lịch' kèm Huỷ buổi; chỗ nút được giữ ở mọi dòng", async () => {
    resetMockApi();
    mockApi.get.mockImplementation((url: string) => {
      if (url === `/classes/${CLASS_ID}/sessions`) {
        const rows = [row("past", vnDay(-3), "scheduled", "14:00", "15:00"), row("future", vnDay(3), "scheduled", "14:00", "15:00")];
        return Promise.resolve(envelope({ data: rows, total: 2, page: 1, page_size: 20 }));
      }
      return Promise.reject(new Error(`unexpected GET ${url}`));
    });
    renderWithProviders(<ClassSessionList classId={CLASS_ID} canWrite hasSchedules onGenerate={() => {}} onAdd={() => {}} />);

    const held = await screen.findByText("Đã diễn ra");
    const planned = screen.getByText("Đã lên lịch");
    expect(screen.getAllByText("Đã lên lịch")).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: /Huỷ buổi/ })).toHaveLength(1);

    // Cả hai dòng có ô giữ chỗ cho nút ngay sau huy hiệu, nên huy hiệu không lệch chỗ giữa dòng có và không có nút.
    for (const badge of [held, planned]) {
      const slot = badge.nextElementSibling as HTMLElement | null;
      expect(slot?.className).toContain("min-w-");
    }
  });
});
