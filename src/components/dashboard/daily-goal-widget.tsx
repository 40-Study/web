"use client";

import { Target, Gift } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { cn } from "@/lib/utils";

interface DailyGoalWidgetProps {
  completed: number;
  target: number;
  bonusXP: number;
  className?: string;
}

export function DailyGoalWidget({
  completed,
  target,
  bonusXP,
  className,
}: DailyGoalWidgetProps) {
  const isCompleted = completed >= target;
  const progressPercent = (completed / target) * 100;

  return (
    <Card
      className={cn(
        "p-4 border-2 border-dashed transition-colors",
        isCompleted
          ? "border-green-300 bg-green-50 dark:bg-green-900/20"
          : "border-primary-200",
        className
      )}
    >
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <Target className={cn("w-5 h-5", isCompleted ? "text-green-600" : "text-primary-600")} />
          <span className="font-medium">Daily Goal</span>
        </div>
        <Badge variant="xp" className="flex items-center gap-1">
          <Gift className="w-3 h-3" />
          +{bonusXP} XP
        </Badge>
      </div>

      <ProgressBar
        value={progressPercent}
        variant={isCompleted ? "xp" : "default"}
        size="md"
      />

      <p className="text-sm mt-2">
        {isCompleted ? (
          <span className="text-green-600 font-medium flex items-center gap-1">
            <span className="inline-block">&#10003;</span> Daily goal complete!
          </span>
        ) : (
          <span className="text-muted-foreground">
            Complete {target - completed} more lesson
            {target - completed > 1 ? "s" : ""} for bonus XP!
          </span>
        )}
      </p>
    </Card>
  );
}
