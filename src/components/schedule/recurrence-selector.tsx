"use client";

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

/** RRULE-compatible recurrence frequency values */
export type RecurrenceFrequency = "none" | "daily" | "weekly" | "monthly";

export interface RecurrenceConfig {
  frequency: RecurrenceFrequency;
  /** How often to repeat (e.g. every 2 weeks = interval 2, freq weekly) */
  interval: number;
  /** Days of week for weekly recurrence (0=SU,1=MO,...,6=SA) */
  weekdays?: number[];
  /** End condition */
  endType: "never" | "on_date" | "after_count";
  endDate?: string;
  endCount?: number;
}

interface RecurrenceSelectorProps {
  value: RecurrenceConfig;
  onChange: (config: RecurrenceConfig) => void;
  className?: string;
}

const FREQ_OPTIONS: { value: RecurrenceFrequency; label: string }[] = [
  { value: "none", label: "Không lặp" },
  { value: "daily", label: "Hàng ngày" },
  { value: "weekly", label: "Hàng tuần" },
  { value: "monthly", label: "Hàng tháng" },
];

const WEEKDAY_LABELS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

/** Build RRULE string from config for storage */
export function buildRRule(config: RecurrenceConfig): string | undefined {
  if (config.frequency === "none") return undefined;

  const parts: string[] = [];
  parts.push(`FREQ=${config.frequency.toUpperCase()}`);

  if (config.interval > 1) {
    parts.push(`INTERVAL=${config.interval}`);
  }

  if (config.frequency === "weekly" && config.weekdays && config.weekdays.length > 0) {
    const dayMap = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
    parts.push(`BYDAY=${config.weekdays.map((d) => dayMap[d]).join(",")}`);
  }

  if (config.endType === "on_date" && config.endDate) {
    // RRULE UNTIL needs UTC format: YYYYMMDDTHHMMSSZ
    const d = new Date(config.endDate);
    const until = d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    parts.push(`UNTIL=${until}`);
  } else if (config.endType === "after_count" && config.endCount) {
    parts.push(`COUNT=${config.endCount}`);
  }

  return parts.join(";");
}

export const DEFAULT_RECURRENCE: RecurrenceConfig = {
  frequency: "none",
  interval: 1,
  weekdays: [],
  endType: "never",
};

export default function RecurrenceSelector({
  value,
  onChange,
  className,
}: RecurrenceSelectorProps) {
  const update = (partial: Partial<RecurrenceConfig>) => {
    onChange({ ...value, ...partial });
  };

  const toggleWeekday = (day: number) => {
    const current = value.weekdays ?? [];
    const updated = current.includes(day)
      ? current.filter((d) => d !== day)
      : [...current, day];
    update({ weekdays: updated });
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Frequency */}
      <div className="space-y-1.5">
        <Label className="text-sm">Lặp lịch</Label>
        <Select
          value={value.frequency}
          onValueChange={(v) => update({ frequency: v as RecurrenceFrequency })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FREQ_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Interval + weekday picker (only when freq != none) */}
      {value.frequency !== "none" && (
        <>
          <div className="flex items-center gap-2">
            <Label className="text-sm shrink-0">Mỗi</Label>
            <Input
              type="number"
              min={1}
              max={99}
              value={value.interval}
              onChange={(e) => update({ interval: Math.max(1, parseInt(e.target.value) || 1) })}
              className="w-20"
            />
            <span className="text-sm text-gray-500">
              {value.frequency === "daily" && "ngày"}
              {value.frequency === "weekly" && "tuần"}
              {value.frequency === "monthly" && "tháng"}
            </span>
          </div>

          {/* Weekday selector for weekly */}
          {value.frequency === "weekly" && (
            <div className="space-y-1.5">
              <Label className="text-sm">Ngày trong tuần</Label>
              <div className="flex gap-1">
                {WEEKDAY_LABELS.map((label, idx) => {
                  const isActive = value.weekdays?.includes(idx);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => toggleWeekday(idx)}
                      className={cn(
                        "w-9 h-9 rounded-full text-xs font-semibold transition-all",
                        isActive
                          ? "bg-primary-600 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      )}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* End condition */}
          <div className="space-y-1.5">
            <Label className="text-sm">Kết thúc</Label>
            <Select
              value={value.endType}
              onValueChange={(v) =>
                update({ endType: v as RecurrenceConfig["endType"] })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="never">Không giới hạn</SelectItem>
                <SelectItem value="on_date">Vào ngày</SelectItem>
                <SelectItem value="after_count">Sau số lần</SelectItem>
              </SelectContent>
            </Select>

            {value.endType === "on_date" && (
              <Input
                type="date"
                value={value.endDate ?? ""}
                onChange={(e) => update({ endDate: e.target.value })}
              />
            )}

            {value.endType === "after_count" && (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  max={365}
                  value={value.endCount ?? 1}
                  onChange={(e) =>
                    update({ endCount: Math.max(1, parseInt(e.target.value) || 1) })
                  }
                  className="w-24"
                />
                <span className="text-sm text-gray-500">lần</span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
