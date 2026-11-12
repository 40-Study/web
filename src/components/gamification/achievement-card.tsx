"use client";

import { Lock } from "lucide-react";
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
  { label: string; tile: string; badge: "default" | "secondary" | "achievement" }
> = {
  common: {
    label: "Thường",
    tile: "bg-muted",
    badge: "default",
  },
  rare: {
    label: "Hiếm",
    tile: "bg-primary-50 dark:bg-primary-950",
    badge: "default",
  },
  epic: {
    label: "Sử thi",
    tile: "bg-secondary-50 dark:bg-secondary-950",
    badge: "secondary",
  },
  legendary: {
    label: "Huyền thoại",
    tile: "bg-amber-100 dark:bg-amber-900/40",
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
    <Card className={cn("relative overflow-hidden p-4 md:p-5", className)}>
      <div className="flex items-center gap-4">
        {/* Badge icon */}
        <div
          className={cn(
            "flex h-16 w-16 shrink-0 items-center justify-center rounded-lg text-3xl",
            isUnlocked ? styles.tile : "bg-muted"
          )}
        >
          {isUnlocked ? (
            achievement.icon
          ) : (
            <Lock className="h-6 w-6 text-muted-foreground" aria-label="Chưa mở khoá" />
          )}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-semibold text-foreground">
              {achievement.name}
            </h3>
            <Badge variant={styles.badge} size="sm" className="shrink-0">
              {styles.label}
            </Badge>
          </div>
          <p className="mb-2 line-clamp-2 text-sm text-muted-foreground">
            {achievement.description}
          </p>

          {/* Progress bar for in-progress achievements */}
          {!isUnlocked && progress !== undefined && (
            <div className="flex items-center gap-2">
              <ProgressBar value={progress} size="sm" className="flex-1" />
              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                {Math.round(progress)}%
              </span>
            </div>
          )}

          {/* Unlock date */}
          {isUnlocked && achievement.unlockedAt && (
            <p className="text-xs text-muted-foreground">
              Mở khoá {formatDate(achievement.unlockedAt)}
            </p>
          )}
        </div>

        {/* XP reward */}
        {isUnlocked && (
          <div className="shrink-0 text-center">
            <Badge variant="xp" size="lg" className="tabular-nums">
              +{achievement.xpReward} XP
            </Badge>
          </div>
        )}
      </div>
    </Card>
  );
}
