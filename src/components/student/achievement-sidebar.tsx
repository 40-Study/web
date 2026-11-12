"use client";

import Link from "next/link";
import { Award } from "lucide-react";
interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  earnedAt: string;
  color: string;
}

interface AchievementSidebarProps {
  achievements: Achievement[];
}

export function AchievementSidebar({ achievements }: AchievementSidebarProps) {
  return (
    <div className="bg-card rounded-2xl p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-yellow-500" />
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wide">
            Bức tường thành tựu
          </h3>
        </div>
        <span className="text-xs font-semibold px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full dark:bg-yellow-500/15 dark:text-yellow-300">
          {achievements.length}
        </span>
      </div>

      {/* Achievement list */}
      <div className="space-y-3">
        {achievements.map((achievement) => (
          <div
            key={achievement.id}
            className="flex items-center gap-3 group cursor-default"
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 transition-transform group-hover:scale-110 ${achievement.color}`}
            >
              {achievement.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">
                {achievement.title}
              </p>
              <p className="text-xs text-muted-foreground">{achievement.earnedAt}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Footer link */}
      <Link
        href="/achievements"
        className="mt-4 block text-center text-xs font-semibold text-primary-600 hover:text-primary-700 transition-colors py-2 border-t border-border dark:text-primary-400 dark:hover:text-primary-300"
      >
        XEM CHỨNG CHỈ CỦA TÔI →
      </Link>
    </div>
  );
}
