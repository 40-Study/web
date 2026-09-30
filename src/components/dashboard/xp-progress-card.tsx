"use client";

import { Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { cn } from "@/lib/utils";

interface XPProgressCardProps {
  /** Tổng XP tích lũy. */
  totalXP: number;
  level: number;
  /** Tiến độ tới cấp kế tiếp, phần trăm 0-100 (đúng như API trả về). */
  progress: number;
  className?: string;
}

export function XPProgressCard({ totalXP, level, progress, className }: XPProgressCardProps) {
  const percent = Math.min(100, Math.max(0, Math.round(progress)));

  return (
    <Card className={cn("p-4 md:p-5", className)}>
      <div className="flex items-center justify-between gap-3">
        <Badge variant="level" size="lg" className="gap-1.5">
          <Star className="h-4 w-4" aria-hidden="true" />
          Cấp {level}
        </Badge>
        <span className="text-label tabular-nums text-slate-600 dark:text-slate-400">
          {totalXP.toLocaleString("vi-VN")} XP
        </span>
      </div>

      <ProgressBar value={percent} variant="xp" size="md" className="mt-4" />

      <p className="text-body-sm mt-2 tabular-nums text-slate-600 dark:text-slate-400">
        {percent}% để lên cấp {level + 1}
      </p>
    </Card>
  );
}
