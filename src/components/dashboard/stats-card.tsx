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

export function StatsCard({
  title,
  value,
  change,
  icon,
  className,
}: StatsCardProps) {
  const isPositive = change !== undefined && change >= 0;
  const hasChange = change !== undefined;

  return (
    <Card className={cn("p-4", className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{title}</span>
        <div className="p-2 bg-primary-50 dark:bg-primary-900/30 rounded-lg text-primary-600">
          {icon}
        </div>
      </div>

      <p className="text-2xl font-bold mt-2">{value}</p>

      {hasChange && (
        <div
          className={cn(
            "flex items-center gap-1 text-xs mt-1",
            isPositive ? "text-green-600" : "text-red-600"
          )}
        >
          {isPositive ? (
            <TrendingUp className="w-3 h-3" />
          ) : (
            <TrendingDown className="w-3 h-3" />
          )}
          <span>
            {isPositive ? "+" : ""}
            {change}% from last month
          </span>
        </div>
      )}
    </Card>
  );
}
