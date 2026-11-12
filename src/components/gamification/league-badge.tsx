"use client";

import { Award, Crown, Gem, Medal, Trophy, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type LeagueType = "bronze" | "silver" | "gold" | "diamond" | "champion";

export interface League {
  id: LeagueType;
  name: string;
  /**
   * Emoji giữ lại vì `app/(app)/leaderboard/page.tsx` (ngoài phạm vi) còn render trực tiếp.
   * `LeagueBadge`/`LeagueProgress` dùng icon lucide theo `id`, không dùng trường này.
   */
  icon: string;
  /** Nền đặc: chữ trắng trên các màu này đạt ≥ 4.5:1. */
  color: string;
  minXP: number;
}

export const LEAGUES: League[] = [
  { id: "bronze", name: "Đồng", icon: "🥉", color: "bg-orange-700", minXP: 0 },
  { id: "silver", name: "Bạc", icon: "🥈", color: "bg-slate-600", minXP: 1000 },
  { id: "gold", name: "Vàng", icon: "🥇", color: "bg-amber-700", minXP: 5000 },
  { id: "diamond", name: "Kim cương", icon: "💎", color: "bg-primary-600", minXP: 15000 },
  { id: "champion", name: "Vô địch", icon: "👑", color: "bg-purple-700", minXP: 50000 },
];

const LEAGUE_ICON: Record<LeagueType, LucideIcon> = {
  bronze: Medal,
  silver: Award,
  gold: Trophy,
  diamond: Gem,
  champion: Crown,
};

interface LeagueBadgeProps {
  league: LeagueType;
  size?: "sm" | "md" | "lg";
  showName?: boolean;
  /** Kiểu chưa đạt (giải kế tiếp): nền nhạt, vẫn đủ tương phản. */
  muted?: boolean;
  className?: string;
}

const sizeStyles = {
  sm: { container: "px-2.5 py-1", icon: "h-4 w-4", text: "text-xs" },
  md: { container: "px-3 py-1.5", icon: "h-5 w-5", text: "text-sm" },
  lg: { container: "px-4 py-2", icon: "h-6 w-6", text: "text-base" },
};

/**
 * League badge component displaying user's current league tier
 * Bronze -> Silver -> Gold -> Diamond -> Champion
 */
export function LeagueBadge({
  league,
  size = "md",
  showName = true,
  muted = false,
  className,
}: LeagueBadgeProps) {
  const leagueData = LEAGUES.find((l) => l.id === league) || LEAGUES[0];
  const styles = sizeStyles[size];
  const Icon = LEAGUE_ICON[leagueData.id];

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full font-medium",
        muted
          ? "bg-muted text-foreground"
          : cn("text-white", leagueData.color),
        styles.container,
        className
      )}
    >
      <Icon className={styles.icon} aria-hidden="true" />
      {showName ? (
        <span className={styles.text}>{leagueData.name}</span>
      ) : (
        <span className="sr-only">{leagueData.name}</span>
      )}
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
      <div className={cn("flex flex-col items-center", className)}>
        <LeagueBadge league="champion" size="lg" />
        <p className="mt-2 text-sm text-muted-foreground">Bạn đã đạt giải cao nhất</p>
      </div>
    );
  }

  const xpForNextLeague = nextLeague.minXP - currentLeagueData.minXP;
  const currentProgress = currentXP - currentLeagueData.minXP;
  const progressPercent = Math.min(100, Math.max(0, (currentProgress / xpForNextLeague) * 100));

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <LeagueBadge league={currentLeague} size="sm" />
        <LeagueBadge league={nextLeague.id} size="sm" muted />
      </div>
      <div className="relative h-2.5 overflow-hidden rounded-full bg-muted-foreground/20">
        <div
          className={cn("h-full rounded-full transition-all duration-500", currentLeagueData.color)}
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      <p className="text-center text-xs tabular-nums text-muted-foreground">
        Còn {Math.max(0, nextLeague.minXP - currentXP).toLocaleString("vi-VN")} XP để lên {nextLeague.name}
      </p>
    </div>
  );
}

/**
 * Điều kiện lên giải kế tiếp, nói bằng ĐÚNG quy tắc đang dùng: giải tính theo XP tích luỹ (`minXP`, xem
 * `getLeagueByXP`). QA-A-16: banner từng ghi "Top 10 sẽ lên giải Kim cương" (backend không có cơ chế thăng
 * hạng theo top tuần) ngay cạnh "Còn 14.880 XP để lên Kim cương" — hai quy tắc trái nhau.
 */
export function nextLeagueRequirement(nextLeague: League | undefined): string {
  if (!nextLeague) return "Đã đạt giải cao nhất!";
  return `Đạt ${nextLeague.minXP.toLocaleString("vi-VN")} XP tích luỹ để lên giải ${nextLeague.name}`;
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
