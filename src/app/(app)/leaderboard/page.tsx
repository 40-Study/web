"use client";

import { useState } from "react";
import { Trophy, Clock, ChevronDown, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  LeaderboardList,
  LeagueBadge,
  LeagueProgress,
  LEAGUES,
} from "@/components/gamification";
import type { LeaderboardEntry, LeagueType } from "@/components/gamification";
import { cn } from "@/lib/utils";
import { useLeaderboard, useMyRank } from "@/hooks/queries/use-leaderboard";
import type { PeriodType } from "@/services/leaderboard.service";

/**
 * Map backend period type to UI period selector options
 */
const PERIOD_OPTIONS: { label: string; value: PeriodType }[] = [
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
  { label: "All Time", value: "all_time" },
  { label: "Daily", value: "daily" },
];

/**
 * Map backend LeaderboardEntryDTO to UI LeaderboardEntry
 * Backend has rank, user_id, user_name, full_name, avatar_url, points
 * UI expects userId, name, avatar, level, weeklyXP, trend
 */
function mapToUiEntry(dto: {
  rank: number;
  user_id: string;
  user_name: string;
  full_name?: string;
  avatar_url?: string;
  points: number;
}): LeaderboardEntry & { rank: number } {
  return {
    userId: dto.user_id,
    name: dto.full_name || dto.user_name,
    avatar: dto.avatar_url,
    level: 0, // backend doesn't expose level separately
    weeklyXP: dto.points,
    trend: 0, // backend doesn't expose trend
    rank: dto.rank,
  };
}

/**
 * Format time remaining until weekly reset (Sunday midnight)
 */
function formatTimeRemaining(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

/**
 * Compute seconds until next Sunday midnight (UTC)
 */
function secondsUntilWeeklyReset(): number {
  const now = new Date();
  const nextSunday = new Date(now);
  nextSunday.setUTCDate(now.getUTCDate() + (7 - now.getUTCDay()));
  nextSunday.setUTCHours(0, 0, 0, 0);
  return Math.max(0, Math.floor((nextSunday.getTime() - now.getTime()) / 1000));
}

export default function LeaderboardPage() {
  const [selectedLeague, setSelectedLeague] = useState<LeagueType>("gold");
  const [isLeagueDropdownOpen, setIsLeagueDropdownOpen] = useState(false);
  const [periodType, setPeriodType] = useState<PeriodType>("weekly");

  const {
    data: leaderboardData,
    isLoading: isLeaderboardLoading,
  } = useLeaderboard({ period_type: periodType, limit: 10 });

  const { data: myRankData, isLoading: isMyRankLoading } = useMyRank({
    period_type: periodType,
  });

  const currentLeague = LEAGUES.find((l) => l.id === selectedLeague) || LEAGUES[2];
  const nextLeagueIndex = LEAGUES.findIndex((l) => l.id === selectedLeague) + 1;
  const nextLeague = LEAGUES[nextLeagueIndex];

  const timeRemaining = secondsUntilWeeklyReset();

  // Map backend entries to UI format
  const entries: (LeaderboardEntry & { rank: number })[] =
    leaderboardData?.entries.map(mapToUiEntry) ?? [];

  const myEntry = myRankData?.entry ? mapToUiEntry(myRankData.entry) : null;
  const myUserId = myEntry?.userId ?? "";

  const isLoading = isLeaderboardLoading || isMyRankLoading;

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      {/* Page header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl">
          <Trophy className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Leaderboard</h1>
          <p className="text-muted-foreground">Compete with others and climb the ranks</p>
        </div>
      </div>

      {/* Period selector */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {PERIOD_OPTIONS.map((opt) => (
          <Button
            key={opt.value}
            variant={periodType === opt.value ? "default" : "outline"}
            size="sm"
            onClick={() => setPeriodType(opt.value)}
          >
            {opt.label}
          </Button>
        ))}
      </div>

      {/* League selector and timer */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* League dropdown */}
        <div className="relative flex-1">
          <button
            onClick={() => setIsLeagueDropdownOpen(!isLeagueDropdownOpen)}
            className="w-full flex items-center justify-between p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl hover:border-gray-200 dark:hover:border-gray-600 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">{currentLeague.icon}</span>
              <div className="text-left">
                <p className="font-semibold text-gray-900 dark:text-white">
                  {currentLeague.name} League
                </p>
                <p className="text-sm text-muted-foreground">
                  {nextLeague
                    ? `Top 10 advance to ${nextLeague.name}`
                    : "You're at the top!"}
                </p>
              </div>
            </div>
            <ChevronDown
              className={cn(
                "h-5 w-5 text-gray-400 transition-transform",
                isLeagueDropdownOpen && "rotate-180"
              )}
            />
          </button>

          {isLeagueDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-xl z-10 overflow-hidden">
              {LEAGUES.map((league) => (
                <button
                  key={league.id}
                  onClick={() => {
                    setSelectedLeague(league.id);
                    setIsLeagueDropdownOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors",
                    league.id === selectedLeague && "bg-gray-50 dark:bg-gray-800"
                  )}
                >
                  <span className="text-2xl">{league.icon}</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {league.name}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Timer */}
        <Card className="p-4 flex items-center gap-3 sm:w-auto">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm text-muted-foreground">Resets in</p>
            <p className="font-mono font-bold text-lg text-gray-900 dark:text-white">
              {formatTimeRemaining(timeRemaining)}
            </p>
          </div>
        </Card>
      </div>

      {/* League header banner */}
      <Card className={cn("mb-6 overflow-hidden", currentLeague.color)}>
        <div className="p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-5xl">{currentLeague.icon}</span>
              <div>
                <h2 className="text-2xl font-bold">{currentLeague.name} League</h2>
                <p className="opacity-90">
                  {nextLeague
                    ? `Top 10 advance to ${nextLeague.name}`
                    : "Maximum league achieved!"}
                </p>
              </div>
            </div>
            <div className="hidden sm:block text-right">
              <p className="text-sm opacity-80">Weekly reset</p>
              <p className="font-mono text-xl">{formatTimeRemaining(timeRemaining)}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Your position summary */}
      {myEntry && (
        <Card className="p-4 mb-6 bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                <span className="text-xl font-bold text-primary-600 dark:text-primary-400">
                  #{myEntry.rank}
                </span>
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Your Position</p>
                <p className="text-sm text-muted-foreground">
                  +{myEntry.weeklyXP.toLocaleString()} XP this period
                </p>
              </div>
            </div>
            <div className="text-right">
              <LeagueBadge league={selectedLeague} size="sm" />
            </div>
          </div>
        </Card>
      )}

      {/* League progress */}
      <Card className="p-4 mb-6">
        <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">League Progress</h3>
        <LeagueProgress
          currentXP={myEntry?.weeklyXP ?? 0}
          currentLeague={selectedLeague}
        />
      </Card>

      {/* Leaderboard list */}
      {isLoading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="animate-spin h-8 w-8 text-muted-foreground" />
        </div>
      ) : (
        <LeaderboardList
          entries={entries}
          currentUserId={myUserId}
          currentUserEntry={myEntry ?? undefined}
        />
      )}

      {/* Bottom CTA */}
      <div className="mt-8 text-center">
        <p className="text-muted-foreground mb-4">
          Complete more lessons to climb the leaderboard!
        </p>
        <Button size="lg">Start Learning</Button>
      </div>
    </div>
  );
}
