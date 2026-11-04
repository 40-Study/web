"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScheduleField } from "@/components/classes/class-schedule-field";
import { useGenerateSessions } from "@/hooks/queries/use-sessions";
import { validateGenerateRange, type GenerateRangeValues } from "@/lib/class-schedule-validation";

/** Sinh các buổi học cụ thể từ lịch hằng tuần trong một khoảng ngày. Chỉ mount khi đang mở. */
export function ClassGenerateSessionsDialog({ classId, onClose }: { classId: string; onClose: () => void }) {
  const [values, setValues] = useState<GenerateRangeValues>({ startDate: "", endDate: "" });
  const [errors, setErrors] = useState<ReturnType<typeof validateGenerateRange>>({});
  const generate = useGenerateSessions(classId);

  const set = (field: keyof GenerateRangeValues) => (e: { target: { value: string } }) =>
    setValues((prev) => ({ ...prev, [field]: e.target.value }));

  const submit = () => {
    const found = validateGenerateRange(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    generate.mutate({ start_date: values.startDate, end_date: values.endDate }, { onSuccess: onClose });
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sinh buổi học từ lịch tuần</DialogTitle>
          <DialogDescription>
            Tạo các buổi học theo lịch hằng tuần trong khoảng ngày (tối đa 1 năm). Buổi đã có hoặc trùng giờ sẽ được bỏ qua.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <ScheduleField id="generate-start" label="Từ ngày" error={errors.startDate}>
            <Input id="generate-start" type="date" value={values.startDate} onChange={set("startDate")} />
          </ScheduleField>
          <ScheduleField id="generate-end" label="Đến ngày" error={errors.endDate}>
            <Input id="generate-end" type="date" value={values.endDate} onChange={set("endDate")} />
          </ScheduleField>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={generate.isPending}>Huỷ</Button>
          <Button onClick={submit} disabled={generate.isPending}>
            {generate.isPending && <Loader2 className="mr-1 h-4 w-4 animate-spin" aria-hidden="true" />}
            Sinh buổi học
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
