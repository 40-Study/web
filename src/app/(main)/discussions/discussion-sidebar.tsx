"use client";

/**
 * Discussion right sidebar — trending categories and active members leaderboard
 */

import { TrendingUp, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLeaderboard } from "@/hooks/queries/use-leaderboard";
import { leaderboardEntryKey, leaderboardEntryName } from "@/lib/leaderboard-display";
import { DISCUSSION_CATEGORIES, GENERAL_DISCUSSION_CATEGORY, generalDiscussionCount } from "./discussion-categories";
import { getInitials } from "@/lib/initials";

interface DiscussionSidebarProps {
  /** Tổng số bài theo API (không phải số bài đã tải). */
  total?: number;
  /** Tổng số bài theo từng danh mục theo API; thiếu khoá = chưa biết, hiện "–". */
  categoryCounts?: Record<string, number>;
  /** Q8-PG-04: danh sách bài lỗi nên số liệu 0/"–" sẽ sai sự thật; ẩn cột số thay vì hiện "Tất cả 0". */
  countsUnavailable?: boolean;
  activeCategory?: string;
  onCategoryChange: (cat: string | undefined) => void;
}

export function DiscussionSidebar({ total, categoryCounts = {}, countsUnavailable = false, activeCategory, onCategoryChange }: DiscussionSidebarProps) {
  const { data: leaderboard } = useLeaderboard({ limit: 5 });
  const members = leaderboard?.entries ?? [];
  const categoryRows = [
    ...DISCUSSION_CATEGORIES.map((cat) => ({ ...cat, count: categoryCounts[cat.value] })),
    { ...GENERAL_DISCUSSION_CATEGORY, count: generalDiscussionCount(total, categoryCounts) },
  ];

  return (
    <div className="space-y-5">
      {/* Trending categories */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-primary-500" />
          <h2 className="text-sm font-semibold text-slate-800">Chủ đề nổi bật</h2>
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
            {!countsUnavailable && <span className="text-xs text-slate-600">{total ?? "–"}</span>}
          </button>
          {categoryRows.map((cat) => (
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
              {!countsUnavailable && <span className="text-xs text-slate-600">{cat.count ?? "–"}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Active members */}
      {members.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-primary-500" />
            <h2 className="text-sm font-semibold text-slate-800">Thành viên tích cực</h2>
          </div>
          <div className="space-y-3">
            {members.map((m, index) => {
              const name = leaderboardEntryName(m);
              const initials = getInitials(name);
              return (
                <div key={leaderboardEntryKey(m, index)} className="flex items-center gap-3">
                  {m.avatar_url ? (
                    <img src={m.avatar_url} alt={name} className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-xs">
                      {initials}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {name}
                    </p>
                    <p className="text-xs text-slate-500">{Number(m.points).toLocaleString("vi-VN")} điểm</p>
                  </div>
                  <span className="text-xs font-bold text-slate-500">#{m.rank}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
