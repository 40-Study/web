/**
 * Review #81 MAJOR-1 / #38 W4: yêu cầu còn chờ hiện email phụ huynh đã nhập (backend không trả tên
 * học sinh); yêu cầu đã chốt ghi kèm ngày để không đọc thành "đang liên kết".
 */

import { screen } from "@testing-library/react";
import { beforeAll, afterAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-client", async () => {
  const { mockApi } = await import("@/test/mock-api");
  return { api: mockApi };
});

import { SentLinkRequests, linkRequestStatusText } from "./sent-link-requests";
import { envelope, mockApi, resetMockApi } from "@/test/mock-api";
import { renderWithProviders } from "@/test/utils";

const originalTz = process.env.TZ;
beforeAll(() => {
  process.env.TZ = "Asia/Ho_Chi_Minh";
});
afterAll(() => {
  process.env.TZ = originalTz;
});

beforeEach(() => resetMockApi());

describe("SentLinkRequests", () => {
  it("yêu cầu còn chờ hiện email đã nhập; đã xác nhận hiện tên con kèm ngày", async () => {
    mockApi.get.mockResolvedValue(envelope([
      { id: "r-1", status: "pending", relationship: "parent", student_email: "con@demo.com", created_at: "2026-09-28T09:00:00+07:00" },
      {
        id: "r-2", status: "accepted", relationship: "parent", student_email: "be@demo.com", created_at: "2026-09-20T09:00:00+07:00",
        responded_at: "2026-09-21T09:00:00+07:00", student: { id: "s-2", username: "be", full_name: "Bé Hai", email: "be@demo.com" },
      },
    ]));
    renderWithProviders(<SentLinkRequests />);
    expect(await screen.findByText("con@demo.com")).toBeTruthy();
    expect(screen.getByText("Bé Hai")).toBeTruthy();
    expect(screen.getByText("Con đã xác nhận ngày 21/9/2026")).toBeTruthy();
    expect(screen.getByText("Đang chờ con xác nhận")).toBeTruthy();
  });

  it("linkRequestStatusText: chỉ yêu cầu đã chốt mới kèm ngày", () => {
    expect(linkRequestStatusText("pending", undefined)).toBe("Đang chờ con xác nhận");
    expect(linkRequestStatusText("rejected", "2026-09-21T09:00:00+07:00")).toMatch(/^Con đã từ chối ngày /);
  });
});
