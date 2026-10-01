"use client";

import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { clockTimeToMinutes, formatClockTime } from "@/lib/schedule-time";
import type { ClassSchedule } from "@/types/class-schedule";

export type ScheduleStatus = "done" | "ongoing" | "upcoming";

export interface TodayScheduleItem {
  id: string;
  start: string;
  end: string;
  title: string;
  room?: string;
  status: ScheduleStatus;
}

const STATUS_LABEL: Record<ScheduleStatus, string> = {
  done: "Đã xong",
  ongoing: "Đang diễn ra",
  upcoming: "Sắp diễn ra",
};

const STATUS_DOT: Record<ScheduleStatus, string> = {
  done: "bg-slate-400 dark:bg-slate-500",
  ongoing: "bg-primary-600 dark:bg-primary-400",
  upcoming: "bg-amber-500",
};

/**
 * Lọc lịch lặp hằng tuần rơi vào hôm nay, sắp theo giờ bắt đầu, gắn trạng thái so với `now`.
 * `start_time`/`end_time` từ /me/timetable là timestamp ISO — đọc qua `lib/schedule-time`,
 * mục có giờ không đọc được thì bị bỏ.
 */
export function buildTodaySchedule(
  schedules: ClassSchedule[],
  now: Date = new Date()
): TodayScheduleItem[] {
  const dow = now.getDay();
  const nowMin = now.getHours() * 60 + now.getMinutes();

  return schedules
    .filter((s) => s.day_of_week === dow)
    .flatMap((s) => {
      const startMin = clockTimeToMinutes(s.start_time);
      const endMin = clockTimeToMinutes(s.end_time);
      if (startMin === null || endMin === null) return [];
      const status: ScheduleStatus =
        nowMin >= endMin ? "done" : nowMin >= startMin ? "ongoing" : "upcoming";
      const item: TodayScheduleItem = {
        id: s.id,
        start: formatClockTime(s.start_time),
        end: formatClockTime(s.end_time),
        title: s.title || "Buổi học",
        room: s.room,
        status,
      };
      return [{ item, startMin }];
    })
    .sort((a, b) => a.startMin - b.startMin)
    .map(({ item }) => item);
}

interface TodayScheduleProps {
  items: TodayScheduleItem[];
  className?: string;
}

export function TodaySchedule({ items, className }: TodayScheduleProps) {
  if (items.length === 0) {
    return (
      <Card className={cn("flex items-center gap-3 p-4 md:p-5", className)}>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-950 dark:text-primary-400">
          <CalendarDays className="h-5 w-5" aria-hidden="true" />
        </div>
        <p className="text-body-sm text-slate-600 dark:text-slate-400">
          Hôm nay bạn không có lịch học.
        </p>
      </Card>
    );
  }

  return (
    <ul className={cn("flex flex-col gap-3", className)}>
      {items.map((item) => (
        <li key={item.id}>
          <Card
            hoverable
            className="relative flex min-h-14 items-center gap-4 rounded-2xl px-4 py-2"
          >
            <p className="w-24 shrink-0 text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-50">
              {item.start} – {item.end}
            </p>
            <div className="min-w-0 flex-1">
              <Link
                href="/schedule"
                className="block truncate text-sm font-medium text-slate-900 after:absolute after:inset-0 after:content-[''] dark:text-slate-50"
              >
                {item.title}
              </Link>
              {item.room && (
                <p className="truncate text-xs text-slate-600 dark:text-slate-400">{item.room}</p>
              )}
            </div>
            <span className="flex shrink-0 items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
              <span
                className={cn("h-2 w-2 rounded-full", STATUS_DOT[item.status])}
                aria-hidden="true"
              />
              {STATUS_LABEL[item.status]}
            </span>
          </Card>
        </li>
      ))}
    </ul>
  );
}
