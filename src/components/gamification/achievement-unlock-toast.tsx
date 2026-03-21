"use client";

import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import type { Achievement, AchievementRarity } from "./achievement-card";

const rarityColors: Record<AchievementRarity, string> = {
  common: "from-gray-400 to-gray-500",
  rare: "from-blue-400 to-blue-600",
  epic: "from-purple-400 to-purple-600",
  legendary: "from-yellow-400 to-amber-500",
};

interface AchievementToastContentProps {
  achievement: Achievement;
}

/**
 * Custom toast content for achievement unlock notification
 */
function AchievementToastContent({ achievement }: AchievementToastContentProps) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`w-12 h-12 rounded-lg bg-gradient-to-br ${
          rarityColors[achievement.rarity]
        } flex items-center justify-center text-2xl shadow-lg`}
      >
        {achievement.icon}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-900 dark:text-white">
            {achievement.name}
          </span>
          <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full">
            +{achievement.xpReward} XP
          </span>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {achievement.description}
        </p>
      </div>
    </div>
  );
}

/**
 * Show achievement unlock toast notification using Sonner
 * Displays achievement icon, name, description and XP reward
 */
export function showAchievementUnlockToast(achievement: Achievement) {
  toast.custom(
    (t) => (
      <div
        className="w-full max-w-md bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 cursor-pointer"
        onClick={() => toast.dismiss(t)}
      >
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-4 w-4 text-yellow-500" />
          <span className="text-xs font-medium text-yellow-600 dark:text-yellow-400 uppercase tracking-wide">
            Achievement Unlocked!
          </span>
        </div>
        <AchievementToastContent achievement={achievement} />
      </div>
    ),
    {
      duration: 5000,
      position: "top-center",
    }
  );
}

/**
 * Hook to trigger achievement unlock toast
 * Returns a function that can be called with achievement data
 */
export function useAchievementToast() {
  return {
    showUnlock: showAchievementUnlockToast,
  };
}
