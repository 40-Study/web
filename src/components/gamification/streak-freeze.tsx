"use client";

import { Shield, Flame, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface StreakFreezeProps {
  streakFreezes: number;
  maxFreezes?: number;
  onUseFreeze?: () => void;
  onBuyFreeze?: () => void;
  className?: string;
}

/**
 * Streak freeze display component
 * Shows available freezes and options to use/buy more
 */
export function StreakFreeze({
  streakFreezes,
  maxFreezes = 3,
  onUseFreeze,
  onBuyFreeze,
  className,
}: StreakFreezeProps) {
  return (
    <Card className={cn("p-4", className)}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-cyan-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Streak Freezes
          </h3>
        </div>
        <span className="text-sm text-muted-foreground">
          {streakFreezes}/{maxFreezes}
        </span>
      </div>

      {/* Freeze indicators */}
      <div className="flex gap-2 mb-4">
        {Array.from({ length: maxFreezes }).map((_, idx) => (
          <div
            key={idx}
            className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center transition-all",
              idx < streakFreezes
                ? "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400"
                : "bg-gray-100 dark:bg-gray-800 text-gray-300 dark:text-gray-600"
            )}
          >
            <Shield className="h-5 w-5" />
          </div>
        ))}
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        Use a freeze to protect your streak when you miss a day.
      </p>

      <div className="flex gap-2">
        {onUseFreeze && (
          <Button
            variant="outline"
            size="sm"
            onClick={onUseFreeze}
            disabled={streakFreezes === 0}
            className="flex-1"
          >
            Use Freeze
          </Button>
        )}
        {onBuyFreeze && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onBuyFreeze}
            disabled={streakFreezes >= maxFreezes}
            className="flex-1"
          >
            Get More
          </Button>
        )}
      </div>
    </Card>
  );
}

interface StreakAtRiskWarningProps {
  streakDays: number;
  hoursRemaining: number;
  streakFreezes: number;
  onLearnNow: () => void;
  onUseFreeze: () => void;
  onDismiss: () => void;
  className?: string;
}

/**
 * Floating warning card when streak is at risk
 * Appears when user hasn't completed daily goal near deadline
 */
export function StreakAtRiskWarning({
  streakDays,
  hoursRemaining,
  streakFreezes,
  onLearnNow,
  onUseFreeze,
  onDismiss,
  className,
}: StreakAtRiskWarningProps) {
  return (
    <div
      className={cn(
        "fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-96 z-40",
        className
      )}
    >
      <Card className="bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800 p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="text-3xl animate-pulse">🔥</div>
          <div className="flex-1">
            <p className="font-semibold text-orange-800 dark:text-orange-200">
              Your streak is at risk!
            </p>
            <p className="text-sm text-orange-700 dark:text-orange-300 mb-3">
              Complete a lesson in the next {hoursRemaining} hours to keep your{" "}
              {streakDays}-day streak.
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                className="bg-orange-500 hover:bg-orange-600 text-white"
                onClick={onLearnNow}
              >
                Learn Now
              </Button>
              {streakFreezes > 0 && (
                <Button size="sm" variant="outline" onClick={onUseFreeze}>
                  <Shield className="h-3 w-3 mr-1" />
                  Use Freeze
                </Button>
              )}
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="text-orange-400 hover:text-orange-600 dark:hover:text-orange-200 transition-colors"
            aria-label="Dismiss warning"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </Card>
    </div>
  );
}

interface StreakCardProps {
  currentStreak: number;
  longestStreak: number;
  hasCompletedToday: boolean;
  streakFreezes: number;
  weekHistory: boolean[]; // Last 7 days, index 0 = Monday
  className?: string;
}

/**
 * Main streak display card
 * Shows current streak, weekly calendar, and freeze count
 */
export function StreakCard({
  currentStreak,
  longestStreak,
  hasCompletedToday,
  streakFreezes,
  weekHistory,
  className,
}: StreakCardProps) {
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  const todayIndex = new Date().getDay();
  // Convert Sunday=0 to index 6, Monday=1 to index 0, etc.
  const todayCalendarIndex = todayIndex === 0 ? 6 : todayIndex - 1;

  return (
    <Card
      className={cn(
        "p-6 relative overflow-hidden",
        hasCompletedToday
          ? "bg-gradient-to-br from-orange-500 to-red-500 text-white"
          : "bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30",
        className
      )}
    >
      {/* Animated fire background when active */}
      {hasCompletedToday && (
        <div className="absolute top-0 right-0 text-8xl opacity-20">🔥</div>
      )}

      <div className="relative z-10">
        {/* Main streak count */}
        <div className="flex items-center gap-4 mb-4">
          <div
            className={cn(
              "text-6xl",
              hasCompletedToday ? "animate-bounce" : "grayscale opacity-50"
            )}
          >
            🔥
          </div>
          <div>
            <p className="text-5xl font-bold">{currentStreak}</p>
            <p
              className={cn(
                "text-sm",
                hasCompletedToday ? "opacity-90" : "text-muted-foreground"
              )}
            >
              day streak
            </p>
          </div>
        </div>

        {/* Week calendar */}
        <div className="flex gap-2 mb-4">
          {days.map((day, idx) => {
            const isToday = idx === todayCalendarIndex;
            const isCompleted = weekHistory[idx];

            return (
              <div
                key={idx}
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all",
                  isCompleted
                    ? hasCompletedToday
                      ? "bg-white/30 text-white"
                      : "bg-green-500 text-white"
                    : isToday
                    ? "border-2 border-dashed border-current"
                    : hasCompletedToday
                    ? "bg-white/20"
                    : "bg-gray-200 dark:bg-gray-700"
                )}
              >
                {isCompleted ? "✓" : day}
              </div>
            );
          })}
        </div>

        {/* Streak freeze and best streak */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield
              className={cn(
                "h-5 w-5",
                hasCompletedToday ? "text-white" : "text-cyan-500"
              )}
            />
            <span className="text-sm">{streakFreezes} streak freezes</span>
          </div>
          <span
            className={cn(
              "text-xs",
              hasCompletedToday ? "opacity-75" : "text-muted-foreground"
            )}
          >
            Best: {longestStreak} days
          </span>
        </div>

        {/* CTA if not completed today */}
        {!hasCompletedToday && (
          <Button className="w-full mt-4 bg-orange-500 hover:bg-orange-600 text-white">
            <Flame className="h-4 w-4 mr-2" />
            Complete a lesson to extend your streak!
          </Button>
        )}
      </div>
    </Card>
  );
}
