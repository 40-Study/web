"use client";

import { Flame, Zap } from "lucide-react";
import type { TodayStats } from "@/lib/mock-data/my-courses";

interface StatsWidgetsProps {
  stats: TodayStats;
}

export function StatsWidgets({ stats }: StatsWidgetsProps) {
  return (
    <div className="flex gap-3">
      {/* Time today */}
      <div className="bg-white rounded-2xl px-5 py-4 shadow-sm flex items-center gap-3 min-w-[140px]">
        <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
          <Flame className="w-5 h-5 text-orange-500" />
        </div>
        <div>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Hôm nay</p>
          <p className="text-lg font-bold text-gray-900 leading-tight">{stats.timeSpent}</p>
        </div>
      </div>

      {/* Overall progress */}
      <div className="bg-white rounded-2xl px-5 py-4 shadow-sm flex items-center gap-3 min-w-[140px]">
        <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
          <Zap className="w-5 h-5 text-primary-500" />
        </div>
        <div>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Tiến độ tổng</p>
          <p className="text-lg font-bold text-gray-900 leading-tight">{stats.progress}%</p>
        </div>
      </div>
    </div>
  );
}
