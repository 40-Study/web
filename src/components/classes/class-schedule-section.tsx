"use client";

import { useState } from "react";
import { ClassGenerateSessionsDialog } from "@/components/classes/class-generate-sessions-dialog";
import { ClassScheduleForm } from "@/components/classes/class-schedule-form";
import { ClassScheduleList } from "@/components/classes/class-schedule-list";
import { ClassSessionForm } from "@/components/classes/class-session-form";
import { ClassSessionList } from "@/components/classes/class-session-list";
import { useClassSchedules } from "@/hooks/queries/use-sessions";
import type { ClassSchedule } from "@/services/session.service";

/** Tab "Lịch học" của lớp: lịch lặp hằng tuần, sinh buổi học theo khoảng ngày, buổi học lẻ và danh sách buổi học. */
export function ClassScheduleSection({ classId, canWrite }: { classId: string; canWrite: boolean }) {
  // undefined = đóng; null = form tạo mới; ClassSchedule = đang sửa lịch đó.
  const [editing, setEditing] = useState<ClassSchedule | null | undefined>(undefined);
  const [generating, setGenerating] = useState(false);
  const [addingSession, setAddingSession] = useState(false);
  // Cùng query key với danh sách lịch nên không gọi API thêm.
  const hasSchedules = (useClassSchedules(classId).data?.length ?? 0) > 0;

  return (
    <div className="space-y-6">
      <ClassScheduleList classId={classId} canWrite={canWrite} onAdd={() => setEditing(null)} onEdit={setEditing} />
      <ClassSessionList
        classId={classId}
        canWrite={canWrite}
        hasSchedules={hasSchedules}
        onGenerate={() => setGenerating(true)}
        onAdd={() => setAddingSession(true)}
      />
      {editing !== undefined && (
        <ClassScheduleForm classId={classId} schedule={editing} onClose={() => setEditing(undefined)} />
      )}
      {generating && <ClassGenerateSessionsDialog classId={classId} onClose={() => setGenerating(false)} />}
      {addingSession && <ClassSessionForm classId={classId} onClose={() => setAddingSession(false)} />}
    </div>
  );
}
