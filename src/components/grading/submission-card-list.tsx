"use client";

import { Eye, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { GradingRow } from "@/lib/submission-grading";
import { formatDateTime } from "./submission-grade-dialog";

interface SubmissionCardListProps {
  rows: GradingRow[];
  canGrade: boolean;
  onOpen: (studentId: string) => void;
}

/**
 * Q4-T18: dưới md, bảng bài nộp 5 cột (min-w 720px) đẩy "Thời gian nộp", "Điểm", "Xem bài" vào thanh cuộn ngang bên
 * trong. Thẻ xếp dọc hiện đủ thông tin và thao tác của từng học viên.
 */
export function SubmissionCardList({ rows, canGrade, onOpen }: SubmissionCardListProps) {
  return (
    <ul className="divide-y" data-testid="submission-cards">
      {rows.map((row) => (
        <li key={row.studentId} className="space-y-2 p-4">
          <div className="flex items-start justify-between gap-2">
            <span className="min-w-0 truncate font-medium">{row.studentName}</span>
            <div className="flex flex-wrap justify-end gap-1.5">
              <Badge variant={row.status === "graded" ? "success" : "default"}>
                {row.status === "graded" ? "Đã chấm" : "Chưa chấm"}
              </Badge>
              {row.late && <Badge variant="warning">Nộp muộn</Badge>}
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">Thời gian nộp</dt>
              <dd>
                {formatDateTime(row.submission.created_at)}
                {row.attempts > 1 && <span className="block text-xs text-muted-foreground">{row.attempts} lần nộp</span>}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Điểm</dt>
              <dd>
                {row.grade ? (
                  <>
                    <span className="font-medium">
                      {row.grade.score}/{row.grade.max_score}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      Chấm bởi {row.grade.graded_by_name || "không rõ"}
                    </span>
                  </>
                ) : (
                  "—"
                )}
              </dd>
            </div>
          </dl>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={() => onOpen(row.studentId)}>
              <Eye className="h-4 w-4" aria-hidden="true" />
              Xem bài
            </Button>
            {canGrade && row.status === "ungraded" && (
              <Button size="sm" className="flex-1 gap-1" onClick={() => onOpen(row.studentId)}>
                <Pencil className="h-4 w-4" aria-hidden="true" />
                Chấm điểm
              </Button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
