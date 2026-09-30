"use client";

import { Check, Gift } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface DailyGoalWidgetProps {
  completed: number;
  target: number;
  bonusXP: number;
  className?: string;
}

const RING_SIZE = 64;
const RING_STROKE = 6;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

/** Mục tiêu học mỗi ngày: vòng tròn 64px + nhãn chữ (không chỉ dựa vào màu). */
export function DailyGoalWidget({ completed, target, bonusXP, className }: DailyGoalWidgetProps) {
  const safeTarget = Math.max(1, target);
  const isCompleted = completed >= safeTarget;
  const ratio = Math.min(1, completed / safeTarget);
  const remaining = safeTarget - completed;

  return (
    <Card className={cn("flex items-center gap-4 p-4 md:p-5", className)}>
      <div
        className="relative h-16 w-16 shrink-0"
        role="img"
        aria-label={`Đã hoàn thành ${Math.min(completed, safeTarget)} trên ${safeTarget} bài học hôm nay`}
      >
        <svg width={RING_SIZE} height={RING_SIZE} viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`} className="-rotate-90">
          <circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_RADIUS}
            fill="none"
            strokeWidth={RING_STROKE}
            className="stroke-slate-200 dark:stroke-slate-800"
          />
          <circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_RADIUS}
            fill="none"
            strokeWidth={RING_STROKE}
            strokeLinecap="round"
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={RING_CIRCUMFERENCE * (1 - ratio)}
            className="stroke-primary-600 dark:stroke-primary-400"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold tabular-nums text-slate-900 dark:text-slate-50">
          {isCompleted ? <Check className="h-5 w-5" aria-hidden="true" /> : `${completed}/${safeTarget}`}
        </span>
      </div>

      <div className="min-w-0 space-y-1.5">
        <p className="text-h4 text-slate-900 dark:text-slate-50">Mục tiêu hôm nay</p>
        <p className="text-body-sm text-slate-600 dark:text-slate-400">
          {isCompleted
            ? "Bạn đã hoàn thành mục tiêu"
            : `Còn ${remaining} bài học để nhận thưởng`}
        </p>
        <Badge variant="xp" className="gap-1">
          <Gift className="h-3 w-3" aria-hidden="true" />+{bonusXP} XP
        </Badge>
      </div>
    </Card>
  );
}
