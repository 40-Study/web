"use client";

import { useState } from "react";
import { Award, Filter, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { AchievementCard } from "@/components/gamification";
import type { Achievement, AchievementRarity } from "@/components/gamification";
import { cn } from "@/lib/utils";

// Achievement categories configuration
const ACHIEVEMENT_CATEGORIES = {
  learning: { name: "Learning", icon: "📚" },
  consistency: { name: "Consistency", icon: "🔥" },
  social: { name: "Social", icon: "👥" },
  exploration: { name: "Exploration", icon: "🧭" },
  mastery: { name: "Mastery", icon: "🏆" },
};

// Mock achievements data - replace with API
const MOCK_ACHIEVEMENTS: Achievement[] = [
  // Learning
  {
    id: "first-lesson",
    name: "First Steps",
    description: "Complete your first lesson",
    icon: "📖",
    rarity: "common",
    xpReward: 50,
    category: "learning",
    unlockedAt: new Date("2024-01-15"),
  },
  {
    id: "course-complete",
    name: "Course Master",
    description: "Complete a full course",
    icon: "🎓",
    rarity: "rare",
    xpReward: 200,
    category: "learning",
    unlockedAt: new Date("2024-02-20"),
  },
  {
    id: "quiz-perfect",
    name: "Perfect Score",
    description: "Get 100% on a quiz",
    icon: "💯",
    rarity: "rare",
    xpReward: 100,
    category: "learning",
    unlockedAt: new Date("2024-01-20"),
  },
  {
    id: "speed-learner",
    name: "Speed Learner",
    description: "Complete 5 lessons in one day",
    icon: "⚡",
    rarity: "epic",
    xpReward: 150,
    category: "learning",
  },

  // Consistency
  {
    id: "streak-7",
    name: "Week Warrior",
    description: "Achieve a 7-day streak",
    icon: "🔥",
    rarity: "common",
    xpReward: 100,
    category: "consistency",
    unlockedAt: new Date("2024-01-22"),
  },
  {
    id: "streak-30",
    name: "Monthly Master",
    description: "Achieve a 30-day streak",
    icon: "🌟",
    rarity: "rare",
    xpReward: 300,
    category: "consistency",
  },
  {
    id: "streak-100",
    name: "Century Club",
    description: "Achieve a 100-day streak",
    icon: "💎",
    rarity: "legendary",
    xpReward: 1000,
    category: "consistency",
  },
  {
    id: "early-bird",
    name: "Early Bird",
    description: "Complete a lesson before 7 AM",
    icon: "🌅",
    rarity: "common",
    xpReward: 50,
    category: "consistency",
    unlockedAt: new Date("2024-02-01"),
  },

  // Social
  {
    id: "first-review",
    name: "Reviewer",
    description: "Write your first course review",
    icon: "✍️",
    rarity: "common",
    xpReward: 50,
    category: "social",
  },
  {
    id: "help-peer",
    name: "Mentor",
    description: "Help 10 students in discussions",
    icon: "🤝",
    rarity: "rare",
    xpReward: 150,
    category: "social",
  },
  {
    id: "popular-answer",
    name: "Popular Answer",
    description: "Get 50 upvotes on a single answer",
    icon: "👍",
    rarity: "epic",
    xpReward: 200,
    category: "social",
  },

  // Exploration
  {
    id: "multi-subject",
    name: "Renaissance Learner",
    description: "Study 3 different subjects",
    icon: "🎨",
    rarity: "rare",
    xpReward: 100,
    category: "exploration",
    unlockedAt: new Date("2024-02-10"),
  },
  {
    id: "night-owl",
    name: "Night Owl",
    description: "Complete a lesson after midnight",
    icon: "🦉",
    rarity: "common",
    xpReward: 50,
    category: "exploration",
  },
  {
    id: "globe-trotter",
    name: "Globe Trotter",
    description: "Learn in 5 different languages",
    icon: "🌍",
    rarity: "epic",
    xpReward: 250,
    category: "exploration",
  },

  // Mastery
  {
    id: "top-10",
    name: "Top 10",
    description: "Reach top 10 in weekly leaderboard",
    icon: "🏅",
    rarity: "epic",
    xpReward: 300,
    category: "mastery",
  },
  {
    id: "champion",
    name: "Champion",
    description: "Reach Champion league",
    icon: "👑",
    rarity: "legendary",
    xpReward: 1500,
    category: "mastery",
  },
];

// Mock progress for locked achievements
const ACHIEVEMENT_PROGRESS: Record<string, number> = {
  "streak-30": 65,
  "streak-100": 15,
  "speed-learner": 40,
  "first-review": 0,
  "help-peer": 30,
  "popular-answer": 10,
  "night-owl": 0,
  "globe-trotter": 20,
  "top-10": 0,
  "champion": 0,
};

type FilterType = "all" | "unlocked" | "locked" | AchievementRarity;

export default function AchievementsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");

  // Calculate stats
  const unlockedCount = MOCK_ACHIEVEMENTS.filter((a) => a.unlockedAt).length;
  const totalCount = MOCK_ACHIEVEMENTS.length;
  const totalXPEarned = MOCK_ACHIEVEMENTS.filter((a) => a.unlockedAt).reduce(
    (sum, a) => sum + a.xpReward,
    0
  );

  // Filter achievements
  const filteredAchievements = MOCK_ACHIEVEMENTS.filter((achievement) => {
    // Search filter
    if (
      searchQuery &&
      !achievement.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !achievement.description.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }

    // Category filter
    if (selectedCategory && achievement.category !== selectedCategory) {
      return false;
    }

    // Status/rarity filter
    if (filter === "unlocked" && !achievement.unlockedAt) return false;
    if (filter === "locked" && achievement.unlockedAt) return false;
    if (
      ["common", "rare", "epic", "legendary"].includes(filter) &&
      achievement.rarity !== filter
    ) {
      return false;
    }

    return true;
  });

  // Group by category for display
  const groupedAchievements = filteredAchievements.reduce((acc, achievement) => {
    const category = achievement.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(achievement);
    return acc;
  }, {} as Record<string, Achievement[]>);

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      {/* Page header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl">
          <Award className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Achievements
          </h1>
          <p className="text-muted-foreground">
            Track your progress and unlock rewards
          </p>
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
          <ProgressBar
            value={(unlockedCount / totalCount) * 100}
            variant="xp"
            size="sm"
            className="mt-3"
          />
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
                {MOCK_ACHIEVEMENTS.filter((a) => a.rarity === "legendary" && a.unlockedAt).length}
              </p>
              <p className="text-sm text-muted-foreground">Legendary Unlocked</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search achievements..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filter dropdown */}
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

      {/* Category tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <Button
          variant={selectedCategory === null ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedCategory(null)}
        >
          All Categories
        </Button>
        {Object.entries(ACHIEVEMENT_CATEGORIES).map(([key, { name, icon }]) => (
          <Button
            key={key}
            variant={selectedCategory === key ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(key)}
            className="whitespace-nowrap"
          >
            <span className="mr-1">{icon}</span>
            {name}
          </Button>
        ))}
      </div>

      {/* Rarity filter */}
      <div className="flex gap-2 mb-8 flex-wrap">
        <span className="text-sm text-muted-foreground py-1">Rarity:</span>
        {(["common", "rare", "epic", "legendary"] as AchievementRarity[]).map(
          (rarity) => (
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
          )
        )}
      </div>

      {/* Achievements list */}
      {Object.keys(groupedAchievements).length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No achievements found.</p>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedAchievements).map(([category, achievements]) => {
            const categoryInfo =
              ACHIEVEMENT_CATEGORIES[category as keyof typeof ACHIEVEMENT_CATEGORIES];
            const unlockedInCategory = achievements.filter((a) => a.unlockedAt).length;

            return (
              <div key={category}>
                {/* Category header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{categoryInfo?.icon}</span>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {categoryInfo?.name || category}
                    </h2>
                  </div>
                  <Badge variant="outline">
                    {unlockedInCategory}/{achievements.length}
                  </Badge>
                </div>

                {/* Achievement cards grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {achievements.map((achievement) => (
                    <AchievementCard
                      key={achievement.id}
                      achievement={achievement}
                      isUnlocked={!!achievement.unlockedAt}
                      progress={ACHIEVEMENT_PROGRESS[achievement.id]}
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
