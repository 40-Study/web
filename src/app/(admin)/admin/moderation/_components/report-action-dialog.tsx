"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useApplyReportAction } from "@/hooks/queries/use-reports";
import type { Report, ReportModerationAction } from "@/services/report.service";
import {
  MAX_REASON_LENGTH,
  MIN_REASON_LENGTH,
  REPORT_ACTION_SPECS,
  getReportActionErrorMessage,
} from "../_lib/report-actions";

interface ReportActionDialogProps {
  report: Report;
  action: ReportModerationAction;
  onClose: () => void;
}

/** Hộp thoại xác nhận một hành động kiểm duyệt (ADM-N4). Đóng lại khi thành công, giữ mở khi lỗi để sửa lý do. */
export function ReportActionDialog({ report, action, onClose }: ReportActionDialogProps) {
  const spec = REPORT_ACTION_SPECS[action];
  const apply = useApplyReportAction();
  const [reason, setReason] = useState("");
  const [resolve, setResolve] = useState(true);

  const trimmed = reason.trim();
  const needsReason = Boolean(spec.reasonLabel);
  const reasonValid = !needsReason || trimmed.length >= MIN_REASON_LENGTH;

  const submit = () => {
    if (!reasonValid || apply.isPending) return;
    apply.mutate(
      { id: report.id, data: { action, ...(needsReason ? { reason: trimmed } : {}), resolve } },
      {
        onSuccess: () => {
          toast.success(spec.success);
          onClose();
        },
        onError: (error) => toast.error(getReportActionErrorMessage(error)),
      },
    );
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogTitle>{spec.title}</DialogTitle>
        <DialogDescription>{spec.description}</DialogDescription>
        {spec.reasonLabel && (
          <Textarea
            label={spec.reasonLabel}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={MAX_REASON_LENGTH}
            helperText={`Từ ${MIN_REASON_LENGTH} đến ${MAX_REASON_LENGTH} ký tự.`}
          />
        )}
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={resolve} onChange={(e) => setResolve(e.target.checked)} />
          Đồng thời đánh dấu báo cáo đã xử lý
        </label>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Huỷ
          </Button>
          <Button variant="destructive" onClick={submit} disabled={!reasonValid || apply.isPending}>
            {spec.confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
