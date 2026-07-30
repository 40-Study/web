/**
 * Test cho logic tách create/update khi lưu điểm danh.
 *
 * Vì sao quan trọng: backend `BulkMarkAttendance` gọi `MarkAttendance` cho
 * từng HS, hàm đó trả lỗi nếu HS ĐÃ có bản ghi, và bulk nuốt lỗi bằng
 * `continue` — chỉ log phía server (schedule_service.go:507-518).
 * Gộp hết vào bulk => sửa điểm danh lần 2 im lặng không lưu gì.
 * Test này khoá hành vi: đã có bản ghi -> PHẢI vào toUpdate, không vào toCreate.
 */

import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ClassStudent } from "@/services/class.service";
import type { SessionAttendance } from "@/services/session.service";
import { useAttendanceDraft } from "../use-attendance-draft";

const STUDENTS: ClassStudent[] = [
  { student_id: "u1", name: "An", email: "an@example.com" },
  { student_id: "u2", name: "Bình" },
];

const EXISTING: SessionAttendance[] = [
  { id: "a1", session_id: "s1", student_id: "u1", status: "absent", note: "" },
];

describe("gộp roster với bản ghi đã có", () => {
  it("hiện đủ mọi HS trong lớp, kể cả người chưa điểm danh", () => {
    const { result } = renderHook(() => useAttendanceDraft(STUDENTS, EXISTING));

    expect(result.current.rows).toHaveLength(2);
    expect(result.current.rows[0].attendanceId).toBe("a1");
    expect(result.current.rows[0].status).toBe("absent");
    // u2 chưa có bản ghi
    expect(result.current.rows[1].attendanceId).toBeUndefined();
    expect(result.current.rows[1].status).toBeUndefined();
  });

  it("HS không có tên thì hiện email, không có email thì hiện id", () => {
    const { result } = renderHook(() =>
      useAttendanceDraft([{ student_id: "u9" }], [])
    );
    expect(result.current.rows[0].name).toBe("u9");
  });
});

describe("tách create/update — hàng rào chống bulk nuốt lỗi", () => {
  it("HS CHƯA có bản ghi -> toCreate", () => {
    const { result } = renderHook(() => useAttendanceDraft(STUDENTS, EXISTING));

    act(() => result.current.setStatus("u2", "present"));

    expect(result.current.changes.toCreate).toEqual([
      { student_id: "u2", status: "present", note: undefined },
    ]);
    expect(result.current.changes.toUpdate).toHaveLength(0);
  });

  it("HS ĐÃ có bản ghi -> toUpdate, TUYỆT ĐỐI không vào toCreate", () => {
    const { result } = renderHook(() => useAttendanceDraft(STUDENTS, EXISTING));

    act(() => result.current.setStatus("u1", "present"));

    expect(result.current.changes.toCreate).toHaveLength(0);
    expect(result.current.changes.toUpdate).toEqual([
      { attendanceId: "a1", status: "present", note: undefined },
    ]);
  });

  it("chọn lại đúng trạng thái cũ thì không tính là thay đổi", () => {
    const { result } = renderHook(() => useAttendanceDraft(STUDENTS, EXISTING));

    act(() => result.current.setStatus("u1", "absent")); // vốn đã absent

    expect(result.current.hasChanges).toBe(false);
    expect(result.current.changes.toUpdate).toHaveLength(0);
  });

  it("markAllPresent chia đúng 2 nhóm", () => {
    const { result } = renderHook(() => useAttendanceDraft(STUDENTS, EXISTING));

    act(() => result.current.markAllPresent());

    // u1 đã có bản ghi -> update; u2 chưa -> create
    expect(result.current.changes.toCreate.map((c) => c.student_id)).toEqual(["u2"]);
    expect(result.current.changes.toUpdate.map((u) => u.attendanceId)).toEqual(["a1"]);
  });

  it("chỉ sửa ghi chú cũng tạo update", () => {
    const { result } = renderHook(() => useAttendanceDraft(STUDENTS, EXISTING));

    act(() => result.current.setNote("u1", "ốm"));

    expect(result.current.changes.toUpdate).toEqual([
      { attendanceId: "a1", status: undefined, note: "ốm" },
    ]);
  });
});

describe("trạng thái draft", () => {
  it("chưa đụng gì thì hasChanges = false", () => {
    const { result } = renderHook(() => useAttendanceDraft(STUDENTS, EXISTING));
    expect(result.current.hasChanges).toBe(false);
  });

  it("reset xoá hết draft", () => {
    const { result } = renderHook(() => useAttendanceDraft(STUDENTS, EXISTING));

    act(() => result.current.setStatus("u2", "late"));
    expect(result.current.hasChanges).toBe(true);

    act(() => result.current.reset());
    expect(result.current.hasChanges).toBe(false);
  });

  it("ghi chú chỉ có khoảng trắng thì bỏ qua khi tạo mới", () => {
    const { result } = renderHook(() => useAttendanceDraft(STUDENTS, EXISTING));

    act(() => {
      result.current.setStatus("u2", "present");
      result.current.setNote("u2", "   ");
    });

    expect(result.current.changes.toCreate[0].note).toBeUndefined();
  });

  it("không có roster thì không có dòng nào", () => {
    const { result } = renderHook(() => useAttendanceDraft(undefined, undefined));
    expect(result.current.rows).toHaveLength(0);
    expect(result.current.hasChanges).toBe(false);
  });
});
