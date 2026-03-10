"use client";

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
  const getRankDisplay = () => {
    if (rank === 1) return { emoji: "🥇", bg: "bg-yellow-100 dark:bg-yellow-900/30" };
    if (rank === 2) return { emoji: "🥈", bg: "bg-gray-100 dark:bg-gray-800" };
    if (rank === 3) return { emoji: "🥉", bg: "bg-orange-100 dark:bg-orange-900/30" };
    return { emoji: null, bg: "" };
  };

  const rankDisplay = getRankDisplay();

  return (
    <div
      className={cn(
        "flex items-center gap-4 px-4 py-3 transition-colors",
        isCurrentUser && "bg-primary-50 dark:bg-primary-900/20",
        rank <= 3 && !isCurrentUser && rankDisplay.bg,
        className
      )}
    >
      {/* Rank */}
      <div className="w-8 text-center shrink-0">
        {rankDisplay.emoji ? (
          <span className="text-xl">{rankDisplay.emoji}</span>
        ) : (
          <span className="text-lg font-bold text-muted-foreground">{rank}</span>
        )}
      </div>

      {/* User avatar */}
      <Avatar
        size="sm"
        src={entry.avatar}
        fallback={entry.name}
        status={isCurrentUser ? "streak" : undefined}
      />

      {/* User info */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "font-medium truncate",
            isCurrentUser
              ? "text-primary-600 dark:text-primary-400"
              : "text-gray-900 dark:text-white"
          )}
        >
          {entry.name} {isCurrentUser && "(You)"}
        </p>
        <p className="text-xs text-muted-foreground">Level {entry.level}</p>
      </div>

      {/* XP this week */}
      <div className="text-right shrink-0">
        <p className="font-bold text-xp">+{formatNumber(entry.weeklyXP)}</p>
        <p className="text-xs text-muted-foreground">XP this week</p>
      </div>

      {/* Trend indicator */}
      <div
        className={cn(
          "w-8 text-center shrink-0 font-medium",
          entry.trend > 0
            ? "text-green-500"
            : entry.trend < 0
            ? "text-red-500"
            : "text-muted-foreground"
        )}
      >
        {entry.trend > 0 ? "↑" : entry.trend < 0 ? "↓" : "−"}
        {Math.abs(entry.trend) > 0 && Math.abs(entry.trend)}
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
    <Card className={cn("divide-y divide-gray-100 dark:divide-gray-800", className)}>
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
          <div className="px-4 py-2 text-center text-muted-foreground text-sm">
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
