"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { cn, formatDate } from "@/lib/utils";

export type AchievementRarity = "common" | "rare" | "epic" | "legendary";

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: AchievementRarity;
  xpReward: number;
  unlockedAt?: Date | string;
  category: string;
}

interface AchievementCardProps {
  achievement: Achievement;
  isUnlocked: boolean;
  progress?: number; // 0-100 for in-progress achievements
  className?: string;
}

const rarityStyles: Record<
  AchievementRarity,
  { bg: string; border: string; badge: "default" | "secondary" | "achievement" }
> = {
  common: {
    bg: "bg-gray-50 dark:bg-gray-800",
    border: "border-gray-200 dark:border-gray-700",
    badge: "default",
  },
  rare: {
    bg: "bg-blue-50 dark:bg-blue-900/20",
    border: "border-blue-200 dark:border-blue-800",
    badge: "default",
  },
  epic: {
    bg: "bg-purple-50 dark:bg-purple-900/20",
    border: "border-purple-200 dark:border-purple-800",
    badge: "secondary",
  },
  legendary: {
    bg: "bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20",
    border: "border-yellow-200 dark:border-yellow-700",
    badge: "achievement",
  },
};

/**
 * Achievement card component displaying badge with rarity styling
 * Shows locked/unlocked state and progress for in-progress achievements
 */
export function AchievementCard({
  achievement,
  isUnlocked,
  progress,
  className,
}: AchievementCardProps) {
  const styles = rarityStyles[achievement.rarity];

  return (
    <Card
      className={cn(
        "p-4 relative overflow-hidden transition-all border-2",
        isUnlocked ? styles.bg : "bg-gray-100 dark:bg-gray-800/50",
        isUnlocked ? styles.border : "border-gray-200 dark:border-gray-700",
        !isUnlocked && "grayscale",
        className
      )}
    >
      {/* Legendary glow effect */}
      {isUnlocked && achievement.rarity === "legendary" && (
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/10 to-amber-400/10 animate-pulse-glow" />
      )}

      <div className="relative z-10 flex items-center gap-4">
        {/* Badge icon */}
        <div
          className={cn(
            "w-16 h-16 rounded-xl flex items-center justify-center text-3xl shrink-0",
            isUnlocked
              ? "bg-gradient-to-br from-yellow-400 to-amber-500 shadow-lg"
              : "bg-gray-200 dark:bg-gray-700"
          )}
        >
          {isUnlocked ? achievement.icon : "🔒"}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
              {achievement.name}
            </h3>
            <Badge
              variant={styles.badge}
              size="sm"
              className="capitalize shrink-0"
            >
              {achievement.rarity}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
            {achievement.description}
          </p>

          {/* Progress bar for in-progress achievements */}
          {!isUnlocked && progress !== undefined && (
            <div className="flex items-center gap-2">
              <ProgressBar value={progress} size="sm" className="flex-1" />
              <span className="text-xs text-muted-foreground shrink-0">
                {Math.round(progress)}%
              </span>
            </div>
          )}

          {/* Unlock date */}
          {isUnlocked && achievement.unlockedAt && (
            <p className="text-xs text-muted-foreground">
              Unlocked {formatDate(achievement.unlockedAt)}
            </p>
          )}
        </div>

        {/* XP reward */}
        {isUnlocked && (
          <div className="text-center shrink-0">
            <Badge variant="xp" size="lg">
              +{achievement.xpReward} XP
            </Badge>
          </div>
        )}
      </div>
    </Card>
  );
}
