/**
 * Chốt endpoint điểm danh về HỆ CANONICAL.
 *
 * Backend có HAI hệ điểm danh song song:
 *   ❌ CŨ (deprecated): bảng `attendances`, route /classes/:classId/attendances
 *      — model.Attendance, comment trong internal/model/schedule.go:89 ghi rõ
 *        "thay the Attendance cu"; route còn bị đăng ký TRÙNG ở class_router.go:38
 *        và course_router.go:61.
 *   ✅ CANONICAL: bảng `session_attendances`, route /sessions/:sessionId/attendances
 *      — model.SessionAttendance, ScheduleHandler.
 *
 * Test này là hàng rào: bất cứ ai đổi service sang route cũ sẽ fail ngay.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-client", async () => {
  const { mockApi } = await import("@/test/mock-api");
  return { api: mockApi };
});

import { sessionService } from "@/services/session.service";
import { envelope, mockApi, resetMockApi } from "@/test/mock-api";

const SESSION_ID = "s1";

/** Lấy URL từ lần gọi đầu tiên của một mock */
function calledUrl(fn: { mock: { calls: unknown[][] } }) {
  return fn.mock.calls[0]?.[0] as string;
}

beforeEach(() => {
  resetMockApi();
});

describe("điểm danh — dùng hệ canonical /sessions/:sessionId", () => {
  it("getAttendances -> GET /sessions/:sessionId/attendances", async () => {
    mockApi.get.mockResolvedValue(envelope([]));

    await sessionService.getAttendances(SESSION_ID);

    expect(mockApi.get).toHaveBeenCalledWith(`/sessions/${SESSION_ID}/attendances`);
    expect(calledUrl(mockApi.get)).not.toContain("/classes/");
  });

  it("markAttendance -> POST /sessions/:sessionId/attendances", async () => {
    mockApi.post.mockResolvedValue(envelope({}));

    await sessionService.markAttendance(SESSION_ID, {
      student_id: "u1",
      status: "present",
    });

    expect(calledUrl(mockApi.post)).toBe(`/sessions/${SESSION_ID}/attendances`);
    expect(calledUrl(mockApi.post)).not.toContain("/classes/");
  });

  it("bulkMarkAttendance -> POST /sessions/:sessionId/attendances/bulk", async () => {
    mockApi.post.mockResolvedValue(envelope([]));

    await sessionService.bulkMarkAttendance(SESSION_ID, {
      attendances: [
        { student_id: "u1", status: "present" },
        { student_id: "u2", status: "absent" },
      ],
    });

    expect(mockApi.post).toHaveBeenCalledWith(
      `/sessions/${SESSION_ID}/attendances/bulk`,
      {
        attendances: [
          { student_id: "u1", status: "present" },
          { student_id: "u2", status: "absent" },
        ],
      }
    );
  });

  it("bulk gửi CẢ LỚP trong MỘT request, không phải N request", async () => {
    mockApi.post.mockResolvedValue(envelope([]));

    await sessionService.bulkMarkAttendance(SESSION_ID, {
      attendances: [
        { student_id: "u1", status: "present" },
        { student_id: "u2", status: "late" },
        { student_id: "u3", status: "excused" },
      ],
    });

    expect(mockApi.post).toHaveBeenCalledTimes(1);
  });

  it("updateAttendance -> PUT /sessions/:sessionId/attendances/:attendanceId", async () => {
    mockApi.put.mockResolvedValue(envelope({}));

    await sessionService.updateAttendance(SESSION_ID, "a1", { status: "late" });

    expect(calledUrl(mockApi.put)).toBe(
      `/sessions/${SESSION_ID}/attendances/a1`
    );
  });
});

describe("getSessions", () => {
  it("unwrap danh sách theo ClassSessionListDTO của backend", async () => {
    mockApi.get.mockResolvedValue(
      envelope({
        data: [
          {
            id: SESSION_ID,
            class_id: "c1",
            date: "2026-07-31",
            start_time: "08:00",
            end_time: "10:00",
            status: "scheduled",
          },
        ],
        total: 1,
        page: 1,
        page_size: 20,
      })
    );

    const result = await sessionService.getSessions("c1", {
      page: 1,
      page_size: 20,
    });

    expect(result.sessions).toHaveLength(1);
    expect(result.sessions[0]?.id).toBe(SESSION_ID);
    expect(result.total).toBe(1);
  });
});

describe("học sinh tự check-in / check-out", () => {
  it("checkIn -> POST /sessions/:sessionId/check-in", async () => {
    mockApi.post.mockResolvedValue(envelope({}));

    await sessionService.checkIn(SESSION_ID);

    expect(calledUrl(mockApi.post)).toBe(`/sessions/${SESSION_ID}/check-in`);
  });

  it("checkOut -> POST /sessions/:sessionId/check-out", async () => {
    mockApi.post.mockResolvedValue(envelope({}));

    await sessionService.checkOut(SESSION_ID);

    expect(calledUrl(mockApi.post)).toBe(`/sessions/${SESSION_ID}/check-out`);
  });
});

describe("getMyAttendances", () => {
  it("GET /me/attendances kèm phân trang", async () => {
    mockApi.get.mockResolvedValue(envelope({ attendances: [], total: 0 }));

    await sessionService.getMyAttendances({ page: 2, page_size: 10 });

    expect(mockApi.get).toHaveBeenCalledWith("/me/attendances", {
      params: { page: 2, page_size: 10 },
    });
  });

  it("unwrap về {attendances, total} khớp handler backend", async () => {
    mockApi.get.mockResolvedValue(
      envelope({
        attendances: [{ id: "a1", session_id: SESSION_ID, status: "present" }],
        total: 1,
      })
    );

    const res = await sessionService.getMyAttendances();

    expect(res.total).toBe(1);
    expect(res.attendances).toHaveLength(1);
  });
});
