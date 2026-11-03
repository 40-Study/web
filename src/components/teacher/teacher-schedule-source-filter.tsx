"use client";

import { useMemo } from "react";
import { useMyRoles } from "@/hooks/queries/use-auth";
import { organizationsFromRoles } from "@/components/teacher/class-organization-field";
import type { TimetableSourceFilter } from "@/types/class-schedule";

/**
 * Ô lọc lịch lớp theo nguồn: tất cả / lớp cá nhân (dạy tự do) / từng tổ chức giảng viên đang thuộc.
 * Giảng viên không thuộc tổ chức nào thì mọi lớp đều là lớp cá nhân, nên không hiện ô lọc.
 * Chỉ lọc lịch lớp từ `/me/timetable`; buổi livestream không mang thông tin tổ chức nên luôn hiện.
 */
export function TeacherScheduleSourceFilter({
  value,
  onChange,
}: {
  value: TimetableSourceFilter | undefined;
  onChange: (source: TimetableSourceFilter | undefined) => void;
}) {
  const { data } = useMyRoles();
  const organizations = useMemo(() => organizationsFromRoles(data?.roles), [data]);

  if (organizations.length === 0) return null;

  return (
    <select
      aria-label="Lọc lịch lớp theo nguồn"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value || undefined)}
      className="h-8 rounded-full border border-input bg-background px-3 text-sm"
    >
      <option value="">Tất cả lớp</option>
      <option value="personal">Lớp cá nhân</option>
      {organizations.map((org) => (
        <option key={org.id} value={org.id}>
          {org.name}
        </option>
      ))}
    </select>
  );
}
