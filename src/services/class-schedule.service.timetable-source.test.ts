import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-client", async () => {
  const { mockApi } = await import("@/test/mock-api");
  return { api: mockApi };
});

import { classScheduleService } from "./class-schedule.service";
import { envelope, mockApi, resetMockApi } from "@/test/mock-api";

const range = { from: "2026-11-02", to: "2026-11-08" };

function paramsOfLastCall() {
  const [url, config] = mockApi.get.mock.calls.at(-1) ?? [];
  expect(url).toBe("/me/timetable");
  return config?.params;
}

describe("getMyTimetableEntries: lọc theo nguồn lớp", () => {
  beforeEach(() => {
    resetMockApi();
    mockApi.get.mockResolvedValue(envelope({ entries: [] }));
  });

  it("không lọc: chỉ gửi khoảng ngày", async () => {
    await classScheduleService.getMyTimetableEntries(range);
    expect(paramsOfLastCall()).toEqual({ sessions_from: range.from, sessions_to: range.to });
  });

  it("lớp cá nhân: gửi scope=personal, không gửi organization_id", async () => {
    await classScheduleService.getMyTimetableEntries(range, "personal");
    expect(paramsOfLastCall()).toEqual({ sessions_from: range.from, sessions_to: range.to, scope: "personal" });
  });

  it("một tổ chức: gửi organization_id, không gửi scope", async () => {
    await classScheduleService.getMyTimetableEntries(range, "org-1");
    expect(paramsOfLastCall()).toEqual({ sessions_from: range.from, sessions_to: range.to, organization_id: "org-1" });
  });

  it("không khoảng ngày, không lọc: không gửi params", async () => {
    await classScheduleService.getMyTimetableEntries();
    expect(paramsOfLastCall()).toBeUndefined();
  });
});
