"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { AttendanceTable } from "@/components/attendance/attendance-table";
import { useAttendanceDraft } from "@/components/attendance/use-attendance-draft";
import { useClassStudentsByClassId } from "@/hooks/queries/use-classes";
import {
  useBulkMarkAttendance,
  useClassSessions,
  useSessionAttendances,
  useUpdateAttendance,
} from "@/hooks/queries/use-sessions";

export default function ClassAttendancePage() {
  const params = useParams();
  const classId = String(params.classId ?? "");

  const [sessionId, setSessionId] = useState("");

  const { data: sessionsData, isLoading: sessionsLoading } = useClassSessions(
    classId,
    { page: 1, page_size: 100 }
  );
  const sessions = useMemo(
    () =>
      [...(sessionsData?.sessions ?? [])].sort((a, b) =>
        b.date.localeCompare(a.date)
      ),
    [sessionsData]
  );

  // Mặc định chọn buổi gần nhất
  useEffect(() => {
    if (!sessionId && sessions.length > 0) setSessionId(sessions[0].id);
  }, [sessions, sessionId]);

  const { data: students, isLoading: studentsLoading } =
    useClassStudentsByClassId(classId);
  const { data: attendances, isLoading: attendancesLoading } =
    useSessionAttendances(sessionId);

  const { rows, setStatus, setNote, markAllPresent, reset, changes, hasChanges } =
    useAttendanceDraft(students, attendances);

  const bulkMark = useBulkMarkAttendance(sessionId);
  const updateOne = useUpdateAttendance(sessionId);
  const saving = bulkMark.isPending || updateOne.isPending;

  async function handleSave() {
    const { toCreate, toUpdate } = changes;

    try {
      // Bản ghi mới đi 1 request bulk; bản ghi cũ BẮT BUỘC đi PUT riêng —
      // bulk sẽ âm thầm bỏ qua HS đã có bản ghi (xem use-attendance-draft.ts)
      if (toCreate.length > 0) {
        await bulkMark.mutateAsync({ attendances: toCreate });
      }
      for (const item of toUpdate) {
        await updateOne.mutateAsync({
          attendanceId: item.attendanceId,
          data: { status: item.status, note: item.note },
        });
      }

      reset();
      // Không toast success ở đây: useBulkMarkAttendance/useUpdateAttendance
      // đã tự toast bên trong, thêm nữa sẽ thành double-toast.
    } catch {
      // Giữ nguyên draft để giáo viên không mất dữ liệu đã nhập
      toast.error("Lưu điểm danh thất bại. Vui lòng thử lại.");
    }
  }

  const selectedSession = sessions.find((s) => s.id === sessionId);
  const loading = sessionsLoading || studentsLoading || attendancesLoading;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Điểm danh</h1>
        <p className="mt-1 text-sm text-gray-500">
          Chọn buổi học rồi đánh dấu trạng thái cho từng học sinh.
        </p>
      </header>

      {!sessionsLoading && sessions.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
          Lớp này chưa có buổi học nào. Hãy tạo lịch học trước khi điểm danh.
        </div>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-end gap-3">
            <label className="flex-1 min-w-[240px]">
              <span className="mb-1 block text-xs font-medium text-gray-600">
                Buổi học
              </span>
              <select
                value={sessionId}
                onChange={(e) => {
                  reset();
                  setSessionId(e.target.value);
                }}
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary-500"
              >
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.date} · {s.start_time}–{s.end_time}
                    {s.topic ? ` · ${s.topic}` : ""}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              onClick={markAllPresent}
              disabled={saving || rows.length === 0}
              className="rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Đánh dấu tất cả có mặt
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={!hasChanges || saving}
              className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {saving ? "Đang lưu…" : "Lưu điểm danh"}
            </button>
          </div>

          {selectedSession?.status === "cancelled" && (
            <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              Buổi học này đã bị hủy
              {selectedSession.cancel_reason
                ? `: ${selectedSession.cancel_reason}`
                : "."}
            </p>
          )}

          {loading ? (
            <div className="rounded-lg border border-gray-200 p-8 text-center text-sm text-gray-500">
              Đang tải…
            </div>
          ) : (
            <AttendanceTable
              rows={rows}
              onStatusChange={setStatus}
              onNoteChange={setNote}
              disabled={saving}
            />
          )}
        </>
      )}
    </div>
  );
}
