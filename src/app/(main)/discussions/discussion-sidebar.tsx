"use client";

/**
 * Discussion right sidebar — trending categories and active members leaderboard
 */

import { TrendingUp, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLeaderboard } from "@/hooks/queries/use-leaderboard";
import type { ForumPost } from "@/types/discussion";

const CATEGORIES = [
  { value: "general", label: "Chung", emoji: "💬" },
  { value: "question", label: "Hỏi đáp", emoji: "❓" },
  { value: "tips", label: "Mẹo hay", emoji: "💡" },
  { value: "showcase", label: "Chia sẻ", emoji: "🚀" },
];

interface DiscussionSidebarProps {
  posts: ForumPost[];
  activeCategory?: string;
  onCategoryChange: (cat: string | undefined) => void;
}

export function DiscussionSidebar({ posts, activeCategory, onCategoryChange }: DiscussionSidebarProps) {
  const { data: leaderboard } = useLeaderboard({ limit: 5 });
  const members = leaderboard?.entries ?? [];

  // Count posts per category
  const categoryCounts = posts.reduce<Record<string, number>>((acc, p) => {
    acc[p.category] = (acc[p.category] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      {/* Trending categories */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-primary-500" />
          <h3 className="text-sm font-semibold text-slate-800">Chủ đề nổi bật</h3>
        </div>
        <div className="space-y-1">
          <button
            onClick={() => onCategoryChange(undefined)}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-colors",
              !activeCategory
                ? "bg-primary-50 text-primary-700 font-medium"
                : "text-slate-600 hover:bg-slate-50"
            )}
          >
            <span>Tất cả</span>
            <span className="text-xs text-slate-400">{posts.length}</span>
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => onCategoryChange(cat.value === activeCategory ? undefined : cat.value)}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-colors",
                activeCategory === cat.value
                  ? "bg-primary-50 text-primary-700 font-medium"
                  : "text-slate-600 hover:bg-slate-50"
              )}
            >
              <span>
                {cat.emoji} {cat.label}
              </span>
              <span className="text-xs text-slate-400">{categoryCounts[cat.value] ?? 0}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Active members */}
      {members.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-primary-500" />
            <h3 className="text-sm font-semibold text-slate-800">Thành viên tích cực</h3>
          </div>
          <div className="space-y-3">
            {members.map((m) => {
              const initials = (m.full_name || m.user_name).slice(0, 2).toUpperCase();
              return (
                <div key={m.user_id} className="flex items-center gap-3">
                  {m.avatar_url ? (
                    <img src={m.avatar_url} alt={m.user_name} className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-xs">
                      {initials}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {m.full_name || m.user_name}
                    </p>
                    <p className="text-xs text-slate-400">{m.points} điểm</p>
                  </div>
                  <span className="text-xs font-bold text-slate-400">#{m.rank}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
