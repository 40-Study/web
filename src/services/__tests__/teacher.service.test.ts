import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-client", async () => {
  const { mockApi } = await import("@/test/mock-api");
  return { api: mockApi };
});

import { teacherService } from "@/services/teacher.service";
import { envelope, mockApi, resetMockApi } from "@/test/mock-api";

beforeEach(() => resetMockApi());

describe("teacherService.getPublicProfile (PG-M2)", () => {
  it("GET /teachers/:id/public-profile và unwrap data", async () => {
    const profile = { id: "t1", user_name: "gv1", full_name: "Nguyễn Văn A", stats: { course_count: 1 }, courses: [] };
    mockApi.get.mockResolvedValue(envelope(profile));

    expect(await teacherService.getPublicProfile("t1")).toEqual(profile);
    expect(mockApi.get).toHaveBeenCalledWith("/teachers/t1/public-profile");
  });
});
