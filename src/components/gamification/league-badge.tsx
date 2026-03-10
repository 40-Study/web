"use client";

import { cn } from "@/lib/utils";

export type LeagueType = "bronze" | "silver" | "gold" | "diamond" | "champion";

export interface League {
  id: LeagueType;
  name: string;
  icon: string;
  color: string;
  minXP: number;
}

export const LEAGUES: League[] = [
  {
    id: "bronze",
    name: "Bronze",
    icon: "🥉",
    color: "from-orange-600 to-orange-800",
    minXP: 0,
  },
  {
    id: "silver",
    name: "Silver",
    icon: "🥈",
    color: "from-gray-400 to-gray-600",
    minXP: 1000,
  },
  {
    id: "gold",
    name: "Gold",
    icon: "🥇",
    color: "from-yellow-400 to-yellow-600",
    minXP: 5000,
  },
  {
    id: "diamond",
    name: "Diamond",
    icon: "💎",
    color: "from-cyan-400 to-blue-600",
    minXP: 15000,
  },
  {
    id: "champion",
    name: "Champion",
    icon: "👑",
    color: "from-purple-500 to-pink-600",
    minXP: 50000,
  },
];

interface LeagueBadgeProps {
  league: LeagueType;
  size?: "sm" | "md" | "lg";
  showName?: boolean;
  className?: string;
}

const sizeStyles = {
  sm: {
    container: "px-2 py-1",
    icon: "text-lg",
    text: "text-xs",
  },
  md: {
    container: "px-3 py-1.5",
    icon: "text-2xl",
    text: "text-sm",
  },
  lg: {
    container: "px-4 py-2",
    icon: "text-3xl",
    text: "text-base",
  },
};

/**
 * League badge component displaying user's current league tier
 * Bronze -> Silver -> Gold -> Diamond -> Champion
 */
export function LeagueBadge({
  league,
  size = "md",
  showName = true,
  className,
}: LeagueBadgeProps) {
  const leagueData = LEAGUES.find((l) => l.id === league) || LEAGUES[0];
  const styles = sizeStyles[size];

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full bg-gradient-to-r text-white font-medium",
        leagueData.color,
        styles.container,
        className
      )}
    >
      <span className={styles.icon}>{leagueData.icon}</span>
      {showName && <span className={styles.text}>{leagueData.name}</span>}
    </div>
  );
}

interface LeagueProgressProps {
  currentXP: number;
  currentLeague: LeagueType;
  className?: string;
}

/**
 * Shows progress toward next league tier
 */
export function LeagueProgress({
  currentXP,
  currentLeague,
  className,
}: LeagueProgressProps) {
  const currentLeagueData = LEAGUES.find((l) => l.id === currentLeague);
  const currentLeagueIndex = LEAGUES.findIndex((l) => l.id === currentLeague);
  const nextLeague = LEAGUES[currentLeagueIndex + 1];

  if (!nextLeague || !currentLeagueData) {
    return (
      <div className={cn("text-center", className)}>
        <LeagueBadge league="champion" size="lg" />
        <p className="text-sm text-muted-foreground mt-2">Maximum league reached!</p>
      </div>
    );
  }

  const xpForNextLeague = nextLeague.minXP - currentLeagueData.minXP;
  const currentProgress = currentXP - currentLeagueData.minXP;
  const progressPercent = Math.min(100, (currentProgress / xpForNextLeague) * 100);

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <LeagueBadge league={currentLeague} size="sm" />
        <LeagueBadge league={nextLeague.id} size="sm" className="opacity-50" />
      </div>
      <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500", `bg-gradient-to-r ${currentLeagueData.color}`)}
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      <p className="text-xs text-center text-muted-foreground">
        {nextLeague.minXP - currentXP} XP to {nextLeague.name}
      </p>
    </div>
  );
}

/**
 * Get league by total XP
 */
export function getLeagueByXP(totalXP: number): League {
  for (let i = LEAGUES.length - 1; i >= 0; i--) {
    if (totalXP >= LEAGUES[i].minXP) {
      return LEAGUES[i];
    }
  }
  return LEAGUES[0];
}
