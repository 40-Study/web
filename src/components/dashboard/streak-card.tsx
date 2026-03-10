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

export function StreakCard({
  currentStreak,
  longestStreak,
  hasStreakToday,
  className,
}: StreakCardProps) {
  return (
    <Card
      className={cn(
        "bg-gradient-to-br from-orange-500 to-red-500 text-white p-4 overflow-hidden relative",
        className
      )}
    >
      {/* Background glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-400/20 to-transparent animate-pulse-glow" />

      <div className="relative z-10 flex items-center gap-3">
        <div className="flex items-center justify-center w-14 h-14 bg-white/20 rounded-full">
          <Flame
            className={cn(
              "w-8 h-8 text-yellow-300",
              !hasStreakToday && "animate-pulse"
            )}
          />
        </div>
        <div>
          <p className="text-3xl font-bold">{currentStreak}</p>
          <p className="text-sm opacity-90">day streak</p>
        </div>
      </div>

      {!hasStreakToday && (
        <div className="relative z-10 mt-3 text-sm bg-white/20 rounded px-2 py-1.5 backdrop-blur-sm">
          Complete a lesson to keep your streak!
        </div>
      )}

      {hasStreakToday && longestStreak > 0 && (
        <div className="relative z-10 mt-3 text-xs opacity-80">
          Longest streak: {longestStreak} days
        </div>
      )}
    </Card>
  );
}
