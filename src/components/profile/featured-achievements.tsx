"use client";

import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface FeaturedAchievement {
  id: string;
  name: string;
  icon?: string;
  iconUrl?: string;
  badgeUrl?: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  unlockedAt: Date | string;
}

interface FeaturedAchievementsProps {
  achievements: FeaturedAchievement[];
  className?: string;
}

const rarityGradients: Record<string, string> = {
  common: "bg-gray-400",
  rare: "bg-blue-500",
  epic: "bg-purple-500",
  legendary: "bg-yellow-500",
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
            Thành tích nổi bật
          </h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/achievements">Xem tất cả</Link>
          </Button>
        </div>
        <p className="text-muted-foreground text-center py-8">
          Chưa mở khóa thành tích nào. Học tiếp để nhận huy hiệu!
        </p>
      </Card>
    );
  }

  return (
    <Card className={cn("p-6", className)}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-900 dark:text-white">
          Thành tích nổi bật
        </h2>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/achievements">Xem tất cả</Link>
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
                "w-16 h-16 mx-auto rounded-xl flex items-center justify-center text-2xl mb-2 shadow-lg transition-transform group-hover:scale-110 overflow-hidden",
                rarityGradients[achievement.rarity]
              )}
            >
              {achievement.badgeUrl || achievement.iconUrl ? (
                <Image
                  src={achievement.badgeUrl || achievement.iconUrl || ""}
                  alt={achievement.name}
                  width={64}
                  height={64}
                  className="h-full w-full object-cover"
                />
              ) : (
                achievement.icon || achievement.name.slice(0, 1).toUpperCase()
              )}
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
