"use client";

import { Calendar } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DayReward {
  xp: number;
  icon: string;
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
  { xp: 10, icon: "⭐" },
  { xp: 15, icon: "⭐" },
  { xp: 20, icon: "✨" },
  { xp: 25, icon: "✨" },
  { xp: 30, icon: "💫" },
  { xp: 40, icon: "💫" },
  { xp: 50, icon: "🌟", bonusXP: 100 },
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
    <Card className={cn("p-6", className)}>
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
        <Calendar className="h-5 w-5 text-primary-500" />
        Daily Check-In
      </h2>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-2 mb-4">
        {rewards.map((day, idx) => {
          const dayNum = idx + 1;
          const isClaimed = dayNum < currentDay;
          const isToday = dayNum === currentDay;
          const isLocked = dayNum > currentDay;

          return (
            <div
              key={dayNum}
              className={cn(
                "aspect-square rounded-lg flex flex-col items-center justify-center p-1 sm:p-2 border-2 transition-all",
                isClaimed && "bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700",
                isToday && !hasCheckedInToday && "border-primary-500 bg-primary-50 dark:bg-primary-900/20 animate-pulse",
                isToday && hasCheckedInToday && "bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700",
                isLocked && "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700"
              )}
            >
              <span className="text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-400">
                Day {dayNum}
              </span>
              <span className="text-lg sm:text-xl">
                {isClaimed || (isToday && hasCheckedInToday) ? "✓" : day.icon}
              </span>
              <span className="text-[10px] sm:text-xs text-muted-foreground">
                {day.xp} XP
              </span>
            </div>
          );
        })}
      </div>

      {/* Day 7 bonus highlight */}
      <div className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-lg p-3 flex items-center gap-3 mb-4">
        <div className="text-3xl">🎁</div>
        <div className="flex-1">
          <p className="font-medium text-gray-900 dark:text-white">7-Day Bonus</p>
          <p className="text-sm text-muted-foreground">
            Complete all 7 days for {rewards[6]?.bonusXP || 100} bonus XP!
          </p>
        </div>
      </div>

      <Button
        onClick={onCheckin}
        disabled={hasCheckedInToday}
        className="w-full"
        size="lg"
      >
        {hasCheckedInToday ? "✓ Checked In Today" : "Check In Now"}
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
    <button
      onClick={onCheckin}
      disabled={hasCheckedInToday}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors",
        hasCheckedInToday
          ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
          : "bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 hover:bg-primary-200 dark:hover:bg-primary-900/50 animate-pulse",
        className
      )}
    >
      <Calendar className="h-4 w-4" />
      <span className="text-sm font-medium">
        {hasCheckedInToday ? `Day ${currentDay} ✓` : "Check In!"}
      </span>
    </button>
  );
}
