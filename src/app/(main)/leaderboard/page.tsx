"use client";

import { useState } from "react";
import { Trophy, Clock, ChevronDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  LeaderboardList,
  LeagueBadge,
  LeagueProgress,
  LEAGUES,
} from "@/components/gamification";
import type { LeaderboardEntry, LeagueType, League } from "@/components/gamification";
import { cn } from "@/lib/utils";

// Mock data - replace with API calls
const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { userId: "1", name: "Nguyen Van A", level: 25, weeklyXP: 2450, trend: 2, avatar: undefined },
  { userId: "2", name: "Tran Thi B", level: 23, weeklyXP: 2180, trend: -1, avatar: undefined },
  { userId: "3", name: "Le Van C", level: 22, weeklyXP: 1950, trend: 1, avatar: undefined },
  { userId: "4", name: "Pham Thi D", level: 21, weeklyXP: 1820, trend: 0, avatar: undefined },
  { userId: "5", name: "Hoang Van E", level: 20, weeklyXP: 1650, trend: 3, avatar: undefined },
  { userId: "6", name: "Vo Thi F", level: 19, weeklyXP: 1520, trend: -2, avatar: undefined },
  { userId: "7", name: "Dang Van G", level: 18, weeklyXP: 1380, trend: 1, avatar: undefined },
  { userId: "8", name: "Bui Thi H", level: 17, weeklyXP: 1250, trend: -1, avatar: undefined },
  { userId: "9", name: "Ngo Van I", level: 16, weeklyXP: 1120, trend: 0, avatar: undefined },
  { userId: "10", name: "Do Thi K", level: 15, weeklyXP: 980, trend: 2, avatar: undefined },
];

const CURRENT_USER_ID = "current-user";
const CURRENT_USER_ENTRY: LeaderboardEntry & { rank: number } = {
  userId: CURRENT_USER_ID,
  name: "You",
  level: 12,
  weeklyXP: 450,
  trend: 5,
  rank: 42,
};

/**
 * Format time remaining until weekly reset
 */
function formatTimeRemaining(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) {
    return `${days}d ${hours}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

export default function LeaderboardPage() {
  const [selectedLeague, setSelectedLeague] = useState<LeagueType>("gold");
  const [isLeagueDropdownOpen, setIsLeagueDropdownOpen] = useState(false);

  // Mock: Time until weekly reset (Sunday midnight)
  const timeRemaining = 3 * 24 * 3600 + 5 * 3600 + 30 * 60; // 3 days, 5 hours, 30 minutes

  const currentLeague = LEAGUES.find((l) => l.id === selectedLeague) || LEAGUES[2];
  const nextLeagueIndex = LEAGUES.findIndex((l) => l.id === selectedLeague) + 1;
  const nextLeague = LEAGUES[nextLeagueIndex];

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      {/* Page header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl">
          <Trophy className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Leaderboard
          </h1>
          <p className="text-muted-foreground">
            Compete with others and climb the ranks
          </p>
        </div>
      </div>

      {/* League selector and timer */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* League dropdown */}
        <div className="relative flex-1">
          <button
            onClick={() => setIsLeagueDropdownOpen(!isLeagueDropdownOpen)}
            className="w-full flex items-center justify-between p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
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

          {/* Dropdown menu */}
          {isLeagueDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-10 overflow-hidden">
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
      <Card
        className={cn(
          "mb-6 overflow-hidden",
          `bg-gradient-to-r ${currentLeague.color}`
        )}
      >
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
      <Card className="p-4 mb-6 bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
              <span className="text-xl font-bold text-primary-600 dark:text-primary-400">
                #{CURRENT_USER_ENTRY.rank}
              </span>
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">
                Your Position
              </p>
              <p className="text-sm text-muted-foreground">
                +{CURRENT_USER_ENTRY.weeklyXP} XP this week
              </p>
            </div>
          </div>
          <div className="text-right">
            <LeagueBadge league={selectedLeague} size="sm" />
            <p className="text-xs text-muted-foreground mt-1">
              {CURRENT_USER_ENTRY.trend > 0 ? "↑" : CURRENT_USER_ENTRY.trend < 0 ? "↓" : "−"}
              {Math.abs(CURRENT_USER_ENTRY.trend)} from last week
            </p>
          </div>
        </div>
      </Card>

      {/* League progress */}
      <Card className="p-4 mb-6">
        <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">
          League Progress
        </h3>
        <LeagueProgress currentXP={3500} currentLeague={selectedLeague} />
      </Card>

      {/* Leaderboard list */}
      <LeaderboardList
        entries={MOCK_LEADERBOARD}
        currentUserId={CURRENT_USER_ID}
        currentUserEntry={CURRENT_USER_ENTRY}
      />

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
