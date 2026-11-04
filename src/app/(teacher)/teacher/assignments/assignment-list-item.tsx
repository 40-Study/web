"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatVnDateThenTime } from "@/lib/vn-datetime";
import type { AssignmentResponseDTO, AssignmentType } from "@/services/assignment.service";

const TYPE_BADGE_CLASS: Record<AssignmentType, string> = {
  live_coding: "bg-purple-100 text-purple-700 border-purple-200",
  homework: "bg-amber-100 text-amber-700 border-amber-200",
  project: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

interface AssignmentListItemProps {
  assignment: AssignmentResponseDTO;
  typeLabel: string;
  selected: boolean;
  onSelect: () => void;
  onTogglePublish: () => void;
  onDelete: () => void;
  togglePending: boolean;
  deletePending: boolean;
}

export function AssignmentListItem({
  assignment,
  typeLabel,
  selected,
  onSelect,
  onTogglePublish,
  onDelete,
  togglePending,
  deletePending,
}: AssignmentListItemProps) {
  return (
    <div
      className={`rounded-lg border p-3 transition-colors ${
        selected ? "border-primary-500 bg-primary-50" : "hover:bg-gray-50"
      }`}
      onClick={onSelect}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">{assignment.title}</p>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={TYPE_BADGE_CLASS[assignment.type]}>
            {typeLabel}
          </Badge>
          <Badge
            variant="outline"
            className={
              assignment.is_published
                ? "bg-green-100 text-green-700 border-green-200"
                : "bg-gray-100 text-gray-700 border-gray-200"
            }
          >
            {assignment.is_published ? "Đã công bố" : "Bản nháp"}
          </Badge>
        </div>
      </div>
      {assignment.end_time && (
        <p className="mt-2 text-xs text-muted-foreground">Hạn nộp: {formatVnDateThenTime(assignment.end_time)}</p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" variant="outline" asChild onClick={(e) => e.stopPropagation()}>
          <Link href={`/teacher/assignments/${assignment.id}/submissions`}>Xem bài nộp</Link>
        </Button>
        <Button
          size="sm"
          variant={assignment.is_published ? "outline" : "default"}
          onClick={(e) => {
            e.stopPropagation();
            onTogglePublish();
          }}
          disabled={togglePending}
        >
          {assignment.is_published ? "Huỷ công bố" : "Công bố"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="text-red-600 hover:bg-red-50"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          disabled={deletePending}
        >
          Xoá
        </Button>
      </div>
    </div>
  );
}
