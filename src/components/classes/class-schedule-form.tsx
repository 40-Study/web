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
import { SELECT_CLASS_NAME, ScheduleField } from "@/components/classes/class-schedule-field";
import { useCreateSchedule, useUpdateSchedule } from "@/hooks/queries/use-sessions";
import {
  WEEKDAY_OPTIONS,
  toDateOnly,
  toTimeOfDay,
  validateScheduleForm,
  type ScheduleFormValues,
} from "@/lib/class-schedule-validation";
import type { ClassSchedule, CreateClassScheduleDTO, UpdateClassScheduleDTO } from "@/services/session.service";

function initialValues(schedule: ClassSchedule | null): ScheduleFormValues {
  return {
    dayOfWeek: schedule ? String(schedule.day_of_week) : "",
    startTime: toTimeOfDay(schedule?.start_time),
    endTime: toTimeOfDay(schedule?.end_time),
    room: schedule?.room ?? "",
    effectiveFrom: toDateOnly(schedule?.effective_from),
    effectiveUntil: toDateOnly(schedule?.effective_until),
  };
}

/**
 * Tạo hoặc sửa một lịch học lặp hằng tuần (`schedule` null = tạo mới). Chỉ mount khi đang mở để mỗi lần mở
 * form bắt đầu từ giá trị của lịch được chọn.
 */
export function ClassScheduleForm({
  classId,
  schedule,
  onClose,
}: {
  classId: string;
  schedule: ClassSchedule | null;
  onClose: () => void;
}) {
  const [values, setValues] = useState(() => initialValues(schedule));
  const [errors, setErrors] = useState<ReturnType<typeof validateScheduleForm>>({});
  const create = useCreateSchedule(classId);
  const update = useUpdateSchedule(classId);
  const pending = create.isPending || update.isPending;

  const set = (field: keyof ScheduleFormValues) => (e: { target: { value: string } }) =>
    setValues((prev) => ({ ...prev, [field]: e.target.value }));

  const submit = () => {
    const found = validateScheduleForm(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const common = {
      start_time: values.startTime,
      end_time: values.endTime,
      room: values.room.trim() || undefined,
      effective_from: values.effectiveFrom,
      effective_until: values.effectiveUntil || undefined,
    };
    const options = { onSuccess: onClose };
    if (schedule) {
      // Backend nhận day_of_week khi sửa nhưng DTO ở session.service.ts chưa khai báo.
      const data: UpdateClassScheduleDTO & { day_of_week: number } = { ...common, day_of_week: Number(values.dayOfWeek) };
      update.mutate({ scheduleId: schedule.id, data }, options);
    } else {
      const data: CreateClassScheduleDTO = { ...common, day_of_week: Number(values.dayOfWeek) };
      create.mutate(data, options);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{schedule ? "Sửa lịch học hằng tuần" : "Thêm lịch học hằng tuần"}</DialogTitle>
          <DialogDescription>
            Lịch lặp lại mỗi tuần. Dùng &quot;Sinh buổi học&quot; để tạo các buổi cụ thể từ lịch này.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <ScheduleField id="schedule-day" label="Thứ trong tuần" error={errors.dayOfWeek}>
            <select id="schedule-day" value={values.dayOfWeek} onChange={set("dayOfWeek")} className={SELECT_CLASS_NAME}>
              <option value="">Chọn thứ</option>
              {WEEKDAY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </ScheduleField>
          <div className="grid grid-cols-2 gap-3">
            <ScheduleField id="schedule-start" label="Giờ bắt đầu" error={errors.startTime}>
              <Input id="schedule-start" type="time" value={values.startTime} onChange={set("startTime")} />
            </ScheduleField>
            <ScheduleField id="schedule-end" label="Giờ kết thúc" error={errors.endTime}>
              <Input id="schedule-end" type="time" value={values.endTime} onChange={set("endTime")} />
            </ScheduleField>
          </div>
          <ScheduleField id="schedule-room" label="Phòng học (không bắt buộc)">
            <Input id="schedule-room" value={values.room} onChange={set("room")} placeholder="VD: Phòng 301" />
          </ScheduleField>
          <div className="grid grid-cols-2 gap-3">
            <ScheduleField id="schedule-from" label="Áp dụng từ ngày" error={errors.effectiveFrom}>
              <Input id="schedule-from" type="date" value={values.effectiveFrom} onChange={set("effectiveFrom")} />
            </ScheduleField>
            <ScheduleField id="schedule-until" label="Đến ngày (không bắt buộc)" error={errors.effectiveUntil}>
              <Input id="schedule-until" type="date" value={values.effectiveUntil} onChange={set("effectiveUntil")} />
            </ScheduleField>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={pending}>Huỷ</Button>
          <Button onClick={submit} disabled={pending}>
            {pending && <Loader2 className="mr-1 h-4 w-4 animate-spin" aria-hidden="true" />}
            {schedule ? "Lưu thay đổi" : "Thêm lịch"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
