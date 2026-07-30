"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ClassStudent } from "@/services/class.service";
import type {
  AttendanceStatus,
  SessionAttendance,
} from "@/services/session.service";

export interface AttendanceRow {
  studentId: string;
  name: string;
  email?: string;
  /** id bản ghi điểm danh — undefined = buổi này chưa điểm danh HS đó */
  attendanceId?: string;
  status?: AttendanceStatus;
  note?: string;
  checkInTime?: string;
  lateMinutes?: number;
}

interface Draft {
  status?: AttendanceStatus;
  note?: string;
}

/**
 * Gộp roster lớp với bản ghi điểm danh đã có, giữ draft cục bộ, và tách
 * thay đổi thành 2 nhóm create/update khi lưu.
 *
 * ⚠️ Vì sao phải tách create/update:
 * backend `BulkMarkAttendance` gọi `MarkAttendance` cho từng HS, mà hàm đó
 * TRẢ LỖI nếu HS đã có bản ghi ("attendance already recorded"). Bulk bắt lỗi
 * rồi `continue` — chỉ log phía server, KHÔNG báo về client
 * (internal/service/schedule_service.go:507-518).
 * => Nếu gửi hết qua bulk, sửa điểm danh lần 2 sẽ im lặng không lưu gì mà UI
 * vẫn tưởng thành công. HS đã có bản ghi BẮT BUỘC đi qua PUT updateAttendance.
 */
export function useAttendanceDraft(
  students: ClassStudent[] | undefined,
  attendances: SessionAttendance[] | undefined
) {
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});

  // Đổi buổi học -> bỏ draft cũ để không mang trạng thái buổi trước sang
  const attendanceKey = attendances?.map((a) => a.id).join(",") ?? "";
  useEffect(() => {
    setDrafts({});
  }, [attendanceKey]);

  const rows = useMemo<AttendanceRow[]>(() => {
    const byStudent = new Map(
      (attendances ?? []).map((a) => [a.student_id, a])
    );

    return (students ?? []).map((s) => {
      const existing = byStudent.get(s.student_id);
      const draft = drafts[s.student_id];

      return {
        studentId: s.student_id,
        name: s.name || s.email || s.student_id,
        email: s.email,
        attendanceId: existing?.id,
        status: draft?.status ?? existing?.status,
        note: draft?.note ?? existing?.note,
        checkInTime: existing?.check_in_time,
        lateMinutes: existing?.late_minutes,
      };
    });
  }, [students, attendances, drafts]);

  const setStatus = useCallback((studentId: string, status: AttendanceStatus) => {
    setDrafts((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], status },
    }));
  }, []);

  const setNote = useCallback((studentId: string, note: string) => {
    setDrafts((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], note },
    }));
  }, []);

  const markAllPresent = useCallback(() => {
    setDrafts((prev) => {
      const next = { ...prev };
      for (const s of students ?? []) {
        next[s.student_id] = { ...next[s.student_id], status: "present" };
      }
      return next;
    });
  }, [students]);

  const reset = useCallback(() => setDrafts({}), []);

  /**
   * Tách thay đổi thành 2 nhóm theo ràng buộc backend ở trên.
   * - toCreate: chưa có bản ghi + đã chọn trạng thái -> gửi 1 request bulk
   * - toUpdate: đã có bản ghi + status/note thực sự đổi -> PUT từng cái
   */
  const changes = useMemo(() => {
    const byStudent = new Map(
      (attendances ?? []).map((a) => [a.student_id, a])
    );

    const toCreate: { student_id: string; status: AttendanceStatus; note?: string }[] = [];
    const toUpdate: {
      attendanceId: string;
      status?: AttendanceStatus;
      note?: string;
    }[] = [];

    for (const [studentId, draft] of Object.entries(drafts)) {
      const existing = byStudent.get(studentId);

      if (!existing) {
        if (draft.status) {
          toCreate.push({
            student_id: studentId,
            status: draft.status,
            note: draft.note?.trim() || undefined,
          });
        }
        continue;
      }

      const statusChanged = draft.status && draft.status !== existing.status;
      const noteChanged =
        draft.note !== undefined && draft.note !== (existing.note ?? "");

      if (statusChanged || noteChanged) {
        toUpdate.push({
          attendanceId: existing.id,
          status: statusChanged ? draft.status : undefined,
          note: noteChanged ? draft.note : undefined,
        });
      }
    }

    return { toCreate, toUpdate };
  }, [drafts, attendances]);

  const hasChanges = changes.toCreate.length > 0 || changes.toUpdate.length > 0;

  return { rows, setStatus, setNote, markAllPresent, reset, changes, hasChanges };
}
