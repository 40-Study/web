"use client";

import { useState } from "react";
import { Award, Search, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { AchievementCard } from "@/components/gamification";
import type { Achievement, AchievementRarity } from "@/components/gamification";
import { cn } from "@/lib/utils";
import { useMyAchievements } from "@/hooks/queries/use-achievements";
import type { AchievementWithStatusDTO } from "@/services/achievement.service";

// Achievement categories configuration
const ACHIEVEMENT_CATEGORIES: Record<string, { name: string; icon: string }> = {
  learning: { name: "Learning", icon: "📚" },
  streak: { name: "Streak", icon: "🔥" },
  social: { name: "Social", icon: "👥" },
  coding: { name: "Coding", icon: "💻" },
  milestone: { name: "Milestone", icon: "🏆" },
  // legacy UI categories mapped to backend
  consistency: { name: "Consistency", icon: "🔥" },
  exploration: { name: "Exploration", icon: "🧭" },
  mastery: { name: "Mastery", icon: "👑" },
};

/**
 * Map backend AchievementWithStatusDTO to UI Achievement type
 * Points become xpReward; icon_url falls back to emoji from category
 */
function mapToUiAchievement(dto: AchievementWithStatusDTO): Achievement {
  return {
    id: dto.id,
    name: dto.name,
    description: dto.description,
    icon: dto.icon_url || "🏅",
    rarity: deriveRarity(dto.points),
    xpReward: dto.points,
    unlockedAt: dto.earned_at ? new Date(dto.earned_at) : undefined,
    category: dto.category,
  };
}

/**
 * Derive rarity from points threshold (business rule approximation)
 */
function deriveRarity(points: number): AchievementRarity {
  if (points >= 1000) return "legendary";
  if (points >= 200) return "epic";
  if (points >= 100) return "rare";
  return "common";
}

type FilterType = "all" | "unlocked" | "locked" | AchievementRarity;

export default function AchievementsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");

  const { data: rawAchievements = [], isLoading } = useMyAchievements();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="animate-spin h-8 w-8 text-muted-foreground" />
      </div>
    );
  }

  // Map backend DTOs to UI Achievement objects
  const achievements = rawAchievements.map(mapToUiAchievement);

  // Calculate stats
  const unlockedCount = rawAchievements.filter((a) => a.unlocked).length;
  const totalCount = achievements.length;
  const totalXPEarned = rawAchievements
    .filter((a) => a.unlocked)
    .reduce((sum, a) => sum + a.points, 0);
  const legendaryUnlocked = rawAchievements.filter(
    (a) => a.unlocked && a.points >= 1000
  ).length;

  // Filter achievements
  const filteredAchievements = achievements.filter((achievement) => {
    if (
      searchQuery &&
      !achievement.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !achievement.description.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    if (selectedCategory && achievement.category !== selectedCategory) return false;
    if (filter === "unlocked" && !achievement.unlockedAt) return false;
    if (filter === "locked" && achievement.unlockedAt) return false;
    if (
      (["common", "rare", "epic", "legendary"] as AchievementRarity[]).includes(
        filter as AchievementRarity
      ) &&
      achievement.rarity !== filter
    ) {
      return false;
    }
    return true;
  });

  // Group by category for display
  const groupedAchievements = filteredAchievements.reduce(
    (acc, achievement) => {
      const category = achievement.category;
      if (!acc[category]) acc[category] = [];
      acc[category].push(achievement);
      return acc;
    },
    {} as Record<string, Achievement[]>
  );

  // Build progress map from raw DTO data (progress 0-100)
  const progressMap = rawAchievements.reduce(
    (acc, dto) => {
      acc[dto.id] = dto.progress;
      return acc;
    },
    {} as Record<string, number>
  );

  // Collect unique categories present in data
  const presentCategories = [...new Set(achievements.map((a) => a.category))];

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      {/* Page header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl">
          <Award className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Achievements</h1>
          <p className="text-muted-foreground">Track your progress and unlock rewards</p>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Award className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {unlockedCount}/{totalCount}
              </p>
              <p className="text-sm text-muted-foreground">Achievements Unlocked</p>
            </div>
          </div>
          {totalCount > 0 && (
            <ProgressBar
              value={(unlockedCount / totalCount) * 100}
              variant="xp"
              size="sm"
              className="mt-3"
            />
          )}
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <span className="text-xl">✨</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {totalXPEarned.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">XP from Achievements</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <span className="text-xl">💎</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {legendaryUnlocked}
              </p>
              <p className="text-sm text-muted-foreground">Legendary Unlocked</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search achievements..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            All
          </Button>
          <Button
            variant={filter === "unlocked" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("unlocked")}
          >
            Unlocked
          </Button>
          <Button
            variant={filter === "locked" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("locked")}
          >
            Locked
          </Button>
        </div>
      </div>

      {/* Category tabs — only show categories present in data */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <Button
          variant={selectedCategory === null ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedCategory(null)}
        >
          All Categories
        </Button>
        {presentCategories.map((key) => {
          const info = ACHIEVEMENT_CATEGORIES[key];
          if (!info) return null;
          return (
            <Button
              key={key}
              variant={selectedCategory === key ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(key)}
              className="whitespace-nowrap"
            >
              <span className="mr-1">{info.icon}</span>
              {info.name}
            </Button>
          );
        })}
      </div>

      {/* Rarity filter */}
      <div className="flex gap-2 mb-8 flex-wrap">
        <span className="text-sm text-muted-foreground py-1">Rarity:</span>
        {(["common", "rare", "epic", "legendary"] as AchievementRarity[]).map((rarity) => (
          <Badge
            key={rarity}
            variant={filter === rarity ? "achievement" : "outline"}
            className={cn(
              "cursor-pointer capitalize",
              filter === rarity && "ring-2 ring-offset-2 ring-yellow-400"
            )}
            onClick={() => setFilter(filter === rarity ? "all" : rarity)}
          >
            {rarity}
          </Badge>
        ))}
      </div>

      {/* Achievements list */}
      {Object.keys(groupedAchievements).length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No achievements found.</p>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedAchievements).map(([category, categoryAchievements]) => {
            const categoryInfo = ACHIEVEMENT_CATEGORIES[category];
            const unlockedInCategory = categoryAchievements.filter(
              (a) => a.unlockedAt
            ).length;

            return (
              <div key={category}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{categoryInfo?.icon ?? "🏅"}</span>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {categoryInfo?.name ?? category}
                    </h2>
                  </div>
                  <Badge variant="outline">
                    {unlockedInCategory}/{categoryAchievements.length}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {categoryAchievements.map((achievement) => (
                    <AchievementCard
                      key={achievement.id}
                      achievement={achievement}
                      isUnlocked={!!achievement.unlockedAt}
                      progress={progressMap[achievement.id]}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
