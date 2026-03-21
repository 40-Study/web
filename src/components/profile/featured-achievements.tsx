"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface FeaturedAchievement {
  id: string;
  name: string;
  icon: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  unlockedAt: Date | string;
}

interface FeaturedAchievementsProps {
  achievements: FeaturedAchievement[];
  className?: string;
}

const rarityGradients: Record<string, string> = {
  common: "from-gray-400 to-gray-500",
  rare: "from-blue-400 to-blue-500",
  epic: "from-purple-400 to-purple-500",
  legendary: "from-yellow-400 to-amber-500",
};

export function FeaturedAchievements({
  achievements,
  className,
}: FeaturedAchievementsProps) {
  if (achievements.length === 0) {
    return (
      <Card className={cn("p-6", className)}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">
            Featured Achievements
          </h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/achievements">View All</Link>
          </Button>
        </div>
        <p className="text-muted-foreground text-center py-8">
          No achievements unlocked yet. Start learning to earn badges!
        </p>
      </Card>
    );
  }

  return (
    <Card className={cn("p-6", className)}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-900 dark:text-white">
          Featured Achievements
        </h2>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/achievements">View All</Link>
        </Button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2">
        {achievements.map((achievement) => (
          <div
            key={achievement.id}
            className="flex-shrink-0 w-20 text-center group cursor-pointer"
          >
            <div
              className={cn(
                "w-16 h-16 mx-auto rounded-xl bg-gradient-to-br flex items-center justify-center text-2xl mb-2 shadow-lg transition-transform group-hover:scale-110",
                rarityGradients[achievement.rarity]
              )}
            >
              {achievement.icon}
            </div>
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 line-clamp-2">
              {achievement.name}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}
