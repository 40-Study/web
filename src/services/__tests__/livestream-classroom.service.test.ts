/**
 * "Bài tập của tôi" rỗng dù có dữ liệu: service đọc `data.sessions` / `data.assignments`
 * trong khi GET /livestream và GET /assignments trả raw `{data: [...], total, page, page_size}`.
 * Fixture dưới đây rút gọn từ response thật của backend local (seed demo, 2026-10-01).
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-client", async () => {
  const { mockApi } = await import("@/test/mock-api");
  return { api: mockApi };
});

import { livestreamClassroomService } from "@/services/livestream-classroom.service";
import { mockApi, resetMockApi } from "@/test/mock-api";

const CLASS_PY = "108f2c8f-b4c1-408b-91bb-ce32da994a83";
const SESSION_ID = "ac6ee3c3-b27d-48e4-b81e-dcda0b432022";

// axios bọc body trong `.data`; body GET /livestream là { data, total, page, page_size }.
const livestreamBody = {
  data: {
    data: [
      { id: SESSION_ID, title: "Live chữa bài", host_id: "h1", class_id: CLASS_PY, status: "ended" },
      { id: "s-react", title: "Live React", host_id: "h2", class_id: "8cedbbab", status: "scheduled" },
    ],
    total: 2,
    page: 1,
    page_size: 100,
  },
};

const assignmentsBody = {
  data: {
    data: [
      {
        id: "c00dd5c4-7d8f-4697-9a10-64430f742550",
        session_id: SESSION_ID,
        class_id: CLASS_PY,
        type: "homework",
        title: "Điểm trung bình theo lớp",
        description: "Viết hàm diem_tb(df)",
        difficulty: "easy",
        language: ["python"],
        starter_code: "import pandas as pd\n",
        time_limit: 2,
        memory_limit: 256,
        duration_minutes: 15,
        is_published: true,
        end_time: "2026-09-27T23:59:00+07:00",
        show_in_recap: true,
        allow_late_submission: true,
        late_penalty_percent: 10,
        max_late_days: 3,
        grace_period_minutes: 15,
        created_at: "2026-09-30T23:23:00+07:00",
      },
    ],
    total: 1,
    page: 1,
    page_size: 50,
  },
};

beforeEach(() => {
  resetMockApi();
});

describe("livestreamClassroomService.listSessions", () => {
  it("đọc mảng `data` của GET /livestream", async () => {
    mockApi.get.mockResolvedValue(livestreamBody);
    const sessions = await livestreamClassroomService.listSessions();
    expect(sessions.map((s) => s.id)).toEqual([SESSION_ID, "s-react"]);
    expect(mockApi.get.mock.calls[0][0]).toBe("/livestream");
  });

  it("lọc theo lớp ở client vì backend bỏ qua class_id", async () => {
    mockApi.get.mockResolvedValue(livestreamBody);
    const sessions = await livestreamClassroomService.listSessions(CLASS_PY);
    expect(sessions.map((s) => s.id)).toEqual([SESSION_ID]);
  });
});

describe("livestreamClassroomService.getAssignments", () => {
  it("đọc mảng `data` của GET /assignments?session_id=", async () => {
    mockApi.get.mockResolvedValue(assignmentsBody);
    const list = await livestreamClassroomService.getAssignments(SESSION_ID);
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ title: "Điểm trung bình theo lớp", language: ["python"] });
    const [url, config] = mockApi.get.mock.calls[0];
    expect(url).toBe("/assignments");
    expect(config.params.session_id).toBe(SESSION_ID);
  });
});
