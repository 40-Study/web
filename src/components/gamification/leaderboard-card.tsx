"use client";

import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export interface LeaderboardEntry {
  userId: string;
  name: string;
  avatar?: string;
  level: number;
  weeklyXP: number;
  trend: number; // positive = moved up, negative = moved down
}

interface LeaderboardCardProps {
  entry: LeaderboardEntry;
  rank: number;
  isCurrentUser?: boolean;
  className?: string;
}

/**
 * Format number with K/M suffix for large values
 */
function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
}

/** Huy hiệu hạng 1-3: chữ số trong vòng tròn, màu phân biệt kèm số nên không chỉ dựa vào màu. */
const RANK_BADGE: Record<number, string> = {
  1: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
  2: "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-100",
  3: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200",
};

/**
 * Individual leaderboard entry card
 * Displays user rank, avatar, name, level, weekly XP and trend
 */
export function LeaderboardCard({
  entry,
  rank,
  isCurrentUser = false,
  className,
}: LeaderboardCardProps) {
  const TrendIcon = entry.trend > 0 ? ArrowUp : entry.trend < 0 ? ArrowDown : Minus;
  const trendLabel =
    entry.trend > 0
      ? `Tăng ${entry.trend} hạng`
      : entry.trend < 0
        ? `Giảm ${Math.abs(entry.trend)} hạng`
        : "Giữ nguyên hạng";

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3 transition-colors md:gap-4",
        isCurrentUser && "bg-primary-50 dark:bg-primary-950/60",
        className
      )}
    >
      {/* Rank */}
      <div className="flex w-8 shrink-0 justify-center">
        <span
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold tabular-nums",
            RANK_BADGE[rank] ?? "text-slate-600 dark:text-slate-400"
          )}
        >
          {rank}
        </span>
      </div>

      {/* User avatar */}
      <Avatar
        size="sm"
        src={entry.avatar}
        fallback={entry.name}
        status={isCurrentUser ? "streak" : undefined}
      />

      {/* User info */}
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate text-sm font-medium",
            isCurrentUser
              ? "text-primary-700 dark:text-primary-300"
              : "text-slate-900 dark:text-slate-50"
          )}
        >
          {entry.name} {isCurrentUser && "(Bạn)"}
        </p>
        <p className="text-xs text-slate-600 dark:text-slate-400">Cấp {entry.level}</p>
      </div>

      {/* XP this week */}
      <div className="shrink-0 text-right">
        <p className="font-bold tabular-nums text-xp dark:text-xp-light">
          +{formatNumber(entry.weeklyXP)}
        </p>
        <p className="text-xs text-slate-600 dark:text-slate-400">XP tuần này</p>
      </div>

      {/* Trend indicator */}
      <div
        className={cn(
          "flex w-10 shrink-0 items-center justify-center gap-0.5 text-xs font-medium tabular-nums",
          entry.trend > 0
            ? "text-green-700 dark:text-green-400"
            : entry.trend < 0
              ? "text-red-700 dark:text-red-400"
              : "text-slate-600 dark:text-slate-400"
        )}
        title={trendLabel}
      >
        <TrendIcon className="h-4 w-4" aria-hidden="true" />
        <span className="sr-only">{trendLabel}</span>
        {entry.trend !== 0 && <span aria-hidden="true">{Math.abs(entry.trend)}</span>}
      </div>
    </div>
  );
}

interface LeaderboardListProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
  currentUserEntry?: LeaderboardEntry & { rank: number };
  className?: string;
}

/**
 * Full leaderboard list component
 * Shows top entries and current user position if not in top
 */
export function LeaderboardList({
  entries,
  currentUserId,
  currentUserEntry,
  className,
}: LeaderboardListProps) {
  const isCurrentUserInTop = entries.some((e) => e.userId === currentUserId);

  return (
    <Card className={cn("divide-y divide-slate-100 overflow-hidden dark:divide-slate-800", className)}>
      {entries.map((entry, idx) => (
        <LeaderboardCard
          key={entry.userId}
          entry={entry}
          rank={idx + 1}
          isCurrentUser={entry.userId === currentUserId}
        />
      ))}

      {/* Show current user if not in top entries */}
      {!isCurrentUserInTop && currentUserEntry && (
        <>
          <div className="px-4 py-2 text-center text-sm text-slate-600 dark:text-slate-400" aria-hidden="true">
            • • •
          </div>
          <LeaderboardCard
            entry={currentUserEntry}
            rank={currentUserEntry.rank}
            isCurrentUser={true}
            className="border-t-2 border-primary-200 dark:border-primary-800"
          />
        </>
      )}
    </Card>
  );
}
