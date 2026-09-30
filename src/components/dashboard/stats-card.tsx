"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  className?: string;
}

export function StatsCard({ title, value, change, icon, className }: StatsCardProps) {
  const hasChange = change !== undefined;
  const isPositive = hasChange && change >= 0;

  return (
    <Card className={cn("p-4 md:p-5", className)}>
      <div className="flex items-center justify-between">
        <span className="text-body-sm text-slate-600 dark:text-slate-400">{title}</span>
        <div className="rounded-lg bg-primary-50 p-2 text-primary-600 dark:bg-primary-950 dark:text-primary-400">
          {icon}
        </div>
      </div>

      <p className="text-h2 mt-2 tabular-nums text-slate-900 dark:text-slate-50">{value}</p>

      {hasChange && (
        <div
          className={cn(
            "mt-1 flex items-center gap-1 text-xs font-medium",
            isPositive
              ? "text-green-700 dark:text-green-400"
              : "text-red-700 dark:text-red-400"
          )}
        >
          {isPositive ? (
            <TrendingUp className="h-3 w-3" aria-hidden="true" />
          ) : (
            <TrendingDown className="h-3 w-3" aria-hidden="true" />
          )}
          <span>
            {isPositive ? "+" : ""}
            {change}% so với tháng trước
          </span>
        </div>
      )}
    </Card>
  );
}
