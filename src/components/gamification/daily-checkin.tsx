"use client";

import { Calendar, Check, Gift, Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DayReward {
  xp: number;
  /** Giữ trường để tương thích prop cũ; hiển thị bằng icon Star, không dùng emoji. */
  icon?: string;
  bonusXP?: number; // For day 7
}

interface DailyCheckinProps {
  currentDay: number; // 1-7
  hasCheckedInToday: boolean;
  rewards?: DayReward[];
  onCheckin: () => void;
  className?: string;
}

const DEFAULT_REWARDS: DayReward[] = [
  { xp: 10 },
  { xp: 15 },
  { xp: 20 },
  { xp: 25 },
  { xp: 30 },
  { xp: 40 },
  { xp: 50, bonusXP: 100 },
];

/**
 * Daily check-in calendar component
 * Displays 7-day reward cycle with progress tracking
 */
export function DailyCheckin({
  currentDay,
  hasCheckedInToday,
  rewards = DEFAULT_REWARDS,
  onCheckin,
  className,
}: DailyCheckinProps) {
  return (
    <Card className={cn("p-4 md:p-5 lg:p-6", className)}>
      <h2 className="text-h3 mb-4 flex items-center gap-2 text-slate-900 dark:text-slate-50">
        <Calendar className="h-5 w-5 text-primary-600 dark:text-primary-400" aria-hidden="true" />
        Điểm danh hằng ngày
      </h2>

      {/* Days grid */}
      <ul className="mb-4 grid grid-cols-7 gap-2">
        {rewards.map((day, idx) => {
          const dayNum = idx + 1;
          const isDone = dayNum < currentDay || (dayNum === currentDay && hasCheckedInToday);
          const isToday = dayNum === currentDay;

          return (
            <li
              key={dayNum}
              aria-current={isToday ? "date" : undefined}
              className={cn(
                "flex aspect-square flex-col items-center justify-center rounded-lg border p-1 sm:p-2",
                isDone
                  ? "border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-900/30 dark:text-green-300"
                  : isToday
                    ? "border-primary-500 bg-primary-50 text-primary-700 dark:border-primary-400 dark:bg-primary-950 dark:text-primary-300"
                    : "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
              )}
            >
              <span className="text-xs font-medium">Ngày {dayNum}</span>
              {isDone ? (
                <Check className="my-0.5 h-5 w-5" aria-label="Đã điểm danh" />
              ) : (
                <Star className="my-0.5 h-5 w-5" aria-hidden="true" />
              )}
              <span className="text-xs tabular-nums">{day.xp} XP</span>
            </li>
          );
        })}
      </ul>

      {/* Day 7 bonus highlight */}
      <div className="mb-4 flex items-center gap-3 rounded-lg bg-secondary-50 p-3 dark:bg-secondary-950">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-secondary-700 dark:bg-slate-900 dark:text-secondary-300">
          <Gift className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="flex-1">
          <p className="font-medium text-slate-900 dark:text-slate-50">Thưởng 7 ngày</p>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Điểm danh đủ 7 ngày để nhận thêm {rewards[6]?.bonusXP || 100} XP.
          </p>
        </div>
      </div>

      <Button onClick={onCheckin} disabled={hasCheckedInToday} className="w-full" size="lg">
        {hasCheckedInToday ? "Hôm nay bạn đã điểm danh" : "Điểm danh ngay"}
      </Button>
    </Card>
  );
}

interface DailyCheckinCompactProps {
  currentDay: number;
  hasCheckedInToday: boolean;
  onCheckin: () => void;
  className?: string;
}

/**
 * Compact version of daily check-in for sidebar/header
 */
export function DailyCheckinCompact({
  currentDay,
  hasCheckedInToday,
  onCheckin,
  className,
}: DailyCheckinCompactProps) {
  return (
    <Button
      type="button"
      variant={hasCheckedInToday ? "ghost" : "secondary"}
      size="sm"
      onClick={onCheckin}
      disabled={hasCheckedInToday}
      className={cn("gap-2", className)}
    >
      <Calendar className="h-4 w-4" aria-hidden="true" />
      <span className="text-sm font-medium">
        {hasCheckedInToday ? `Ngày ${currentDay} đã xong` : "Điểm danh"}
      </span>
    </Button>
  );
}
