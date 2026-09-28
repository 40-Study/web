"use client";

/** Dialog chi tiết hồ sơ ứng tuyển giảng viên (read-only) cho trang /admin/teacher-applications. */

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { formatDate } from "@/lib/utils";
import { TEACHER_APPROVAL_STATUS_LABEL, type TeacherApplicationItem } from "@/types/approval";

interface TeacherApplicationDetailDialogProps {
  application: TeacherApplicationItem | null;
  onClose: () => void;
}

export function TeacherApplicationDetailDialog({
  application,
  onClose,
}: TeacherApplicationDetailDialogProps) {
  return (
    <Dialog open={!!application} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl" data-testid="application-detail-dialog">
        {application && (
          <div className="max-h-[75vh] space-y-4 overflow-y-auto pr-1 text-sm">
            <div>
              <DialogTitle>{application.full_name || application.email}</DialogTitle>
              <p className="text-gray-500">{application.email}</p>
            </div>
            <dl className="grid gap-3 sm:grid-cols-2">
              <Field label="Trạng thái" value={TEACHER_APPROVAL_STATUS_LABEL[application.approval_status]} />
              <Field label="Số lần nộp lại" value={String(application.resubmission_count)} />
              <Field label="Chuyên môn" value={application.specialization} />
              <Field label="Bộ môn" value={application.department} />
              <Field
                label="Kinh nghiệm"
                value={
                  application.experience_years != null
                    ? `${application.experience_years} năm`
                    : undefined
                }
              />
              <Field label="Ngày nộp" value={formatDate(application.created_at)} />
            </dl>
            <Block label="Học vấn" value={application.education} />
            <Block label="Bằng cấp / chứng chỉ" value={application.certificate_info} />
            {application.rejection_reason && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                <p className="text-xs font-semibold uppercase">Lý do từ chối trước đó</p>
                <p className="mt-1 whitespace-pre-line">{application.rejection_reason}</p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-900">
      <dt className="text-xs text-gray-500">{label}</dt>
      <dd className="font-medium">{value || "—"}</dd>
    </div>
  );
}

function Block({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <h3 className="mb-1 font-semibold">{label}</h3>
      <p className="whitespace-pre-line text-gray-600 dark:text-gray-400">{value || "Chưa cung cấp."}</p>
    </div>
  );
}
