"use client";

import { Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { cn } from "@/lib/utils";

interface XPProgressCardProps {
  currentXP: number;
  levelXP: number;
  level: number;
  className?: string;
}

export function XPProgressCard({
  currentXP,
  levelXP,
  level,
  className,
}: XPProgressCardProps) {
  const progressPercent = (currentXP / levelXP) * 100;
  const xpToNextLevel = levelXP - currentXP;

  return (
    <Card className={cn("p-4", className)}>
      <div className="flex items-center justify-between mb-3">
        <Badge variant="level" className="text-sm flex items-center gap-1">
          <Star className="w-3.5 h-3.5" />
          Level {level}
        </Badge>
        <span className="text-sm text-muted-foreground font-medium">
          {currentXP.toLocaleString()} / {levelXP.toLocaleString()} XP
        </span>
      </div>

      <ProgressBar value={progressPercent} variant="xp" size="md" />

      <p className="text-xs text-muted-foreground mt-2">
        {xpToNextLevel.toLocaleString()} XP to Level {level + 1}
      </p>
    </Card>
  );
}
