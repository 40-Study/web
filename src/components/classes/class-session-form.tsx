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
import { useCreateSession } from "@/hooks/queries/use-sessions";
import { validateSessionForm, type SessionFormValues } from "@/lib/class-schedule-validation";

const EMPTY: SessionFormValues = { date: "", startTime: "", endTime: "", topic: "" };

/** Tạo một buổi học lẻ (không thuộc lịch lặp), vd. buổi học bù. Chỉ mount khi đang mở. */
export function ClassSessionForm({ classId, onClose }: { classId: string; onClose: () => void }) {
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState<ReturnType<typeof validateSessionForm>>({});
  const create = useCreateSession(classId);

  const set = (field: keyof SessionFormValues) => (e: { target: { value: string } }) =>
    setValues((prev) => ({ ...prev, [field]: e.target.value }));

  const submit = () => {
    const found = validateSessionForm(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    create.mutate(
      { date: values.date, start_time: values.startTime, end_time: values.endTime, topic: values.topic.trim() || undefined },
      { onSuccess: onClose }
    );
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Thêm buổi học lẻ</DialogTitle>
          <DialogDescription>Một buổi học riêng, không lặp lại theo lịch tuần (vd. học bù).</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <ScheduleField id="session-date" label="Ngày học" error={errors.date}>
            <Input id="session-date" type="date" value={values.date} onChange={set("date")} />
          </ScheduleField>
          <div className="grid grid-cols-2 gap-3">
            <ScheduleField id="session-start" label="Giờ bắt đầu" error={errors.startTime}>
              <Input id="session-start" type="time" value={values.startTime} onChange={set("startTime")} />
            </ScheduleField>
            <ScheduleField id="session-end" label="Giờ kết thúc" error={errors.endTime}>
              <Input id="session-end" type="time" value={values.endTime} onChange={set("endTime")} />
            </ScheduleField>
          </div>
          <ScheduleField id="session-topic" label="Chủ đề (không bắt buộc)">
            <Input id="session-topic" value={values.topic} onChange={set("topic")} placeholder="VD: Ôn tập chương 2" />
          </ScheduleField>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={create.isPending}>Huỷ</Button>
          <Button onClick={submit} disabled={create.isPending}>
            {create.isPending && <Loader2 className="mr-1 h-4 w-4 animate-spin" aria-hidden="true" />}
            Thêm buổi học
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
