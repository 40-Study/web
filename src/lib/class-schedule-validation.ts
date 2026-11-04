/**
 * Luật nhập của lịch học lớp (khớp backend schedule_service.go): giờ "HH:MM", giờ kết thúc phải SAU giờ bắt đầu
 * (ErrSessionTimeOrder), thứ 0-6 với 0 = Chủ nhật (Go time.Weekday), khoảng sinh buổi tối đa 366 ngày.
 */

/** Hiển thị thứ Hai → Chủ nhật; `value` là day_of_week của backend (0 = Chủ nhật). */
export const WEEKDAY_OPTIONS = [
  { value: 1, label: "Thứ hai" },
  { value: 2, label: "Thứ ba" },
  { value: 3, label: "Thứ tư" },
  { value: 4, label: "Thứ năm" },
  { value: 5, label: "Thứ sáu" },
  { value: 6, label: "Thứ bảy" },
  { value: 0, label: "Chủ nhật" },
] as const;

/** Khoảng ngày tối đa của "Sinh buổi học" (maxGenerateSessionDays ở backend). */
export const MAX_GENERATE_DAYS = 366;

export function weekdayLabel(dayOfWeek: number): string {
  return WEEKDAY_OPTIONS.find((o) => o.value === dayOfWeek)?.label ?? `Thứ ${dayOfWeek}`;
}

/** Backend trả effective_from dạng ISO đầy đủ ("2026-11-04T00:00:00Z"); input date và API ghi chỉ nhận YYYY-MM-DD. */
export function toDateOnly(value?: string | null): string {
  return value ? value.slice(0, 10) : "";
}

/** "HH:MM" (cắt giây nếu có) cho input type=time. */
export function toTimeOfDay(value?: string | null): string {
  return value ? value.slice(0, 5) : "";
}

export type FieldErrors<K extends string> = Partial<Record<K, string>>;

function validateTimeRange(start: string, end: string): { startTime?: string; endTime?: string } {
  const errors: { startTime?: string; endTime?: string } = {};
  if (!start) errors.startTime = "Chọn giờ bắt đầu";
  if (!end) errors.endTime = "Chọn giờ kết thúc";
  // "HH:MM" luôn đủ 2 chữ số nên so chuỗi cũng là so giờ.
  else if (start && end <= start) errors.endTime = "Giờ kết thúc phải sau giờ bắt đầu";
  return errors;
}

export interface ScheduleFormValues {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room: string;
  effectiveFrom: string;
  effectiveUntil: string;
}

export function validateScheduleForm(v: ScheduleFormValues): FieldErrors<keyof ScheduleFormValues> {
  const errors: FieldErrors<keyof ScheduleFormValues> = validateTimeRange(v.startTime, v.endTime);
  if (v.dayOfWeek === "") errors.dayOfWeek = "Chọn thứ trong tuần";
  if (!v.effectiveFrom) errors.effectiveFrom = "Chọn ngày bắt đầu áp dụng";
  else if (v.effectiveUntil && v.effectiveUntil < v.effectiveFrom) {
    errors.effectiveUntil = "Ngày kết thúc phải từ ngày bắt đầu trở đi";
  }
  return errors;
}

export interface SessionFormValues {
  date: string;
  startTime: string;
  endTime: string;
  topic: string;
}

export function validateSessionForm(v: SessionFormValues): FieldErrors<keyof SessionFormValues> {
  const errors: FieldErrors<keyof SessionFormValues> = validateTimeRange(v.startTime, v.endTime);
  if (!v.date) errors.date = "Chọn ngày học";
  return errors;
}

export interface GenerateRangeValues {
  startDate: string;
  endDate: string;
}

function daysBetween(from: string, to: string): number {
  return (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000;
}

export function validateGenerateRange(v: GenerateRangeValues): FieldErrors<keyof GenerateRangeValues> {
  const errors: FieldErrors<keyof GenerateRangeValues> = {};
  if (!v.startDate) errors.startDate = "Chọn ngày bắt đầu";
  if (!v.endDate) errors.endDate = "Chọn ngày kết thúc";
  else if (v.startDate && v.endDate < v.startDate) errors.endDate = "Ngày kết thúc phải từ ngày bắt đầu trở đi";
  else if (v.startDate && daysBetween(v.startDate, v.endDate) > MAX_GENERATE_DAYS) {
    errors.endDate = "Chỉ sinh buổi học trong tối đa 1 năm mỗi lần";
  }
  return errors;
}
