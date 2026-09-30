"use client";

import { Flame } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StreakCardProps {
  currentStreak: number;
  longestStreak: number;
  hasStreakToday: boolean;
  className?: string;
}

const WEEKDAY_SHORT = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const WEEKDAY_LONG = ["Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ nhật"];

/**
 * Trả về 7 cờ (T2..CN) cho biết ngày nào nằm trong chuỗi hiện tại.
 * Chuỗi đếm ngược từ hôm nay (nếu đã học hôm nay) hoặc từ hôm qua.
 * `todayIndex`: 0 = T2 ... 6 = CN.
 */
export function getWeekStreakFlags(
  currentStreak: number,
  hasStreakToday: boolean,
  todayIndex: number
): boolean[] {
  const flags = new Array<boolean>(7).fill(false);
  const lastActive = hasStreakToday ? todayIndex : todayIndex - 1;
  for (let i = 0; i < currentStreak; i++) {
    const idx = lastActive - i;
    if (idx < 0) break; // chuỗi kéo sang tuần trước, không hiển thị ở lịch tuần này
    flags[idx] = true;
  }
  return flags;
}

export function StreakCard({
  currentStreak,
  longestStreak,
  hasStreakToday,
  className,
}: StreakCardProps) {
  const todayIndex = (new Date().getDay() + 6) % 7;
  const flags = getWeekStreakFlags(currentStreak, hasStreakToday, todayIndex);

  return (
    <Card className={cn("p-4 md:p-5", className)}>
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-streak dark:bg-orange-950 dark:text-streak-light">
          <Flame className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="text-h2 leading-none tabular-nums text-slate-900 dark:text-slate-50">
            {currentStreak}
          </p>
          <p className="text-body-sm mt-1 text-slate-600 dark:text-slate-400">ngày liên tiếp</p>
        </div>
      </div>

      <ul className="mt-4 grid grid-cols-7 gap-1" aria-label="Chuỗi học trong tuần">
        {WEEKDAY_SHORT.map((label, i) => {
          const isToday = i === todayIndex;
          const done = flags[i];
          return (
            <li
              key={label}
              aria-label={`${isToday ? "Hôm nay" : WEEKDAY_LONG[i]}: ${done ? "đã học" : "chưa học"}`}
              title={isToday ? "Hôm nay" : undefined}
              className={cn(
                "mx-auto flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold",
                done
                  ? "bg-streak text-white dark:bg-orange-500 dark:text-slate-950"
                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
                isToday && "ring-2 ring-primary ring-offset-2 ring-offset-white dark:ring-offset-slate-900"
              )}
            >
              {label}
            </li>
          );
        })}
      </ul>

      <p className="text-body-sm mt-3 text-slate-600 dark:text-slate-400">
        {hasStreakToday
          ? `Kỷ lục ${longestStreak} ngày`
          : "Hoàn thành một bài học để giữ chuỗi"}
      </p>
    </Card>
  );
}
