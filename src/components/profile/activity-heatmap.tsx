"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface ActivityData {
  date: string; // YYYY-MM-DD format
  count: number;
}

interface ActivityHeatmapProps {
  data: ActivityData[];
  startDate?: Date;
  weeks?: number;
  className?: string;
}

function getActivityLevel(count: number): string {
  if (count === 0) return "bg-gray-100 dark:bg-gray-800";
  if (count <= 2) return "bg-green-200 dark:bg-green-900";
  if (count <= 5) return "bg-green-400 dark:bg-green-700";
  return "bg-green-600 dark:bg-green-500";
}

function formatDateString(date: Date): string {
  return date.toISOString().split("T")[0];
}

function getDayOfWeek(date: Date): number {
  return date.getDay();
}

export function ActivityHeatmap({
  data,
  startDate,
  weeks = 20,
  className,
}: ActivityHeatmapProps) {
  const { weeksData, monthLabels } = useMemo(() => {
    const activityMap = new Map(data.map((d) => [d.date, d.count]));
    const end = new Date();
    const start = startDate || new Date(end.getTime() - weeks * 7 * 24 * 60 * 60 * 1000);

    // Adjust start to the beginning of the week (Sunday)
    const adjustedStart = new Date(start);
    adjustedStart.setDate(adjustedStart.getDate() - getDayOfWeek(adjustedStart));

    const weeksArray: Array<Array<{ date: string; count: number; dayOfWeek: number }>> = [];
    const months: Array<{ label: string; weekIndex: number }> = [];
    let currentWeek: Array<{ date: string; count: number; dayOfWeek: number }> = [];
    let lastMonth = -1;

    const currentDate = new Date(adjustedStart);
    let weekIndex = 0;

    while (currentDate <= end) {
      const dateStr = formatDateString(currentDate);
      const dayOfWeek = getDayOfWeek(currentDate);
      const count = activityMap.get(dateStr) || 0;

      // Track month labels
      const currentMonth = currentDate.getMonth();
      if (currentMonth !== lastMonth) {
        const monthName = currentDate.toLocaleDateString("en-US", { month: "short" });
        months.push({ label: monthName, weekIndex });
        lastMonth = currentMonth;
      }

      currentWeek.push({ date: dateStr, count, dayOfWeek });

      if (dayOfWeek === 6) {
        weeksArray.push(currentWeek);
        currentWeek = [];
        weekIndex++;
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Push remaining days
    if (currentWeek.length > 0) {
      weeksArray.push(currentWeek);
    }

    return { weeksData: weeksArray, monthLabels: months };
  }, [data, startDate, weeks]);

  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className={cn("overflow-x-auto", className)}>
      {/* Month labels */}
      <div className="flex mb-1 ml-8">
        {monthLabels.map((month, idx) => (
          <div
            key={`${month.label}-${idx}`}
            className="text-xs text-muted-foreground"
            style={{
              marginLeft: idx === 0 ? `${month.weekIndex * 14}px` : undefined,
              width: idx < monthLabels.length - 1
                ? `${(monthLabels[idx + 1].weekIndex - month.weekIndex) * 14}px`
                : "auto",
            }}
          >
            {month.label}
          </div>
        ))}
      </div>

      <div className="flex gap-0.5">
        {/* Day labels */}
        <div className="flex flex-col gap-0.5 mr-1">
          {dayLabels.map((day, idx) => (
            <div
              key={day}
              className={cn(
                "h-3 text-xs text-muted-foreground flex items-center",
                idx % 2 === 1 && "invisible"
              )}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Heatmap grid */}
        <div className="inline-grid grid-flow-col gap-0.5">
          {weeksData.map((week, weekIdx) => (
            <div key={weekIdx} className="grid grid-rows-7 gap-0.5">
              {[0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => {
                const day = week.find((d) => d.dayOfWeek === dayOfWeek);
                if (!day) {
                  return (
                    <div
                      key={`${weekIdx}-${dayOfWeek}`}
                      className="w-3 h-3 rounded-sm bg-transparent"
                    />
                  );
                }
                return (
                  <div
                    key={day.date}
                    className={cn(
                      "w-3 h-3 rounded-sm transition-colors cursor-pointer hover:ring-1 hover:ring-gray-400",
                      getActivityLevel(day.count)
                    )}
                    title={`${day.date}: ${day.count} ${day.count === 1 ? "lesson" : "lessons"}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-2 mt-3 text-xs text-muted-foreground">
        <span>Less</span>
        <div className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-800" />
        <div className="w-3 h-3 rounded-sm bg-green-200 dark:bg-green-900" />
        <div className="w-3 h-3 rounded-sm bg-green-400 dark:bg-green-700" />
        <div className="w-3 h-3 rounded-sm bg-green-600 dark:bg-green-500" />
        <span>More</span>
      </div>
    </div>
  );
}
