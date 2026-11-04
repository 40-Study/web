"use client";

import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { withClassPrefix } from "@/lib/class-label";
import { STUDENT_STATUS_LABEL, type GroupedStudent } from "./group-students";

interface StudentMobileCardProps {
  student: GroupedStudent;
  selected: boolean;
  onToggle: () => void;
}

/** Thẻ học viên cho màn hình < md (Q3-21): đủ trạng thái + thao tác mà bảng 6 cột làm bị cắt. */
export function StudentMobileCard({ student, selected, onToggle }: StudentMobileCardProps) {
  return (
    <li className="space-y-2 p-4" data-testid="student-card">
      <div className="flex items-start gap-3">
        <Checkbox checked={selected} onCheckedChange={onToggle} aria-label={`Chọn ${student.name}`} className="mt-1" />
        <Avatar fallback={student.name.charAt(0)} size="sm" className="bg-primary-100 text-primary-700" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{student.name}</p>
          <p className="text-xs text-muted-foreground">Mã HS: {student.studentId ?? "—"}</p>
        </div>
        <Badge variant={student.status === "active" ? "success" : "secondary"} className="whitespace-nowrap text-xs">
          {STUDENT_STATUS_LABEL[student.status]}
        </Badge>
      </div>
      <ul className="space-y-0.5 pl-1 text-sm">
        {student.courses.map((c) => (
          <li key={`${c.courseId ?? c.courseName}-${c.className ?? ""}`}>
            {c.courseName}
            {c.className && c.className !== c.courseName && (
              <span className="text-xs text-muted-foreground"> · {withClassPrefix(c.className)}</span>
            )}
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between text-sm">
        {student.parentName ? (
          <a
            href={student.parentPhone ? `tel:${student.parentPhone}` : undefined}
            className="text-primary-600 hover:underline"
          >
            PH: {student.parentName}
          </a>
        ) : (
          <span className="text-muted-foreground">PH: —</span>
        )}
        <Link href={`/teacher/students/${student.id}`} className="text-primary-600 hover:underline">
          Hồ sơ
        </Link>
      </div>
    </li>
  );
}
