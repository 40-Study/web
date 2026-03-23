"use client";

import { useState, useMemo } from "react";
import {
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  format,
  eachDayOfInterval,
  isSameDay,
  isToday,
  parseISO,
  differenceInMinutes,
} from "date-fns";
import { vi } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Bell, Video, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Mock data - replace with API
const MOCK_EVENTS = [
  {
    id: "1",
    title: "Lập trình Python",
    courseId: "c1",
    startTime: "2026-03-23T09:00:00",
    endTime: "2026-03-23T10:30:00",
    type: "video" as const,
    status: "completed" as const,
  },
  {
    id: "2",
    title: "Seminar Công nghệ",
    courseId: "c2",
    startTime: "2026-03-23T14:00:00",
    endTime: "2026-03-23T15:30:00",
    type: "livestream" as const,
    status: "ongoing" as const,
    meetingUrl: "https://meet.google.com/abc",
  },
  {
    id: "3",
    title: "React Advanced Patterns",
    courseId: "c3",
    startTime: "2026-03-24T10:00:00",
    endTime: "2026-03-24T11:30:00",
    type: "video" as const,
    status: "upcoming" as const,
  },
];

interface ScheduleEvent {
  id: string;
  title: string;
  courseId: string;
  startTime: string;
  endTime: string;
  type: "video" | "livestream" | "hybrid";
  status: "completed" | "ongoing" | "upcoming";
  meetingUrl?: string;
}

const TIME_SLOTS = Array.from({ length: 14 }, (_, i) => i + 7); // 7:00 - 20:00

export default function TeacherSchedulePage() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const events = MOCK_EVENTS; // Replace with useTeacherSchedule hook

  const getEventsForDay = (day: Date) => {
    return events.filter((event) => isSameDay(parseISO(event.startTime), day));
  };

  const getEventPosition = (event: ScheduleEvent) => {
    const start = parseISO(event.startTime);
    const end = parseISO(event.endTime);
    const startHour = start.getHours() + start.getMinutes() / 60;
    const duration = differenceInMinutes(end, start) / 60;
    const top = (startHour - 7) * 60; // 7:00 is the start
    const height = duration * 60;
    return { top, height };
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Lịch giảng dạy</h1>
        <div className="flex items-center gap-4">
          {/* Date Navigation */}
          <div className="flex items-center gap-2 rounded-lg border bg-white px-2 py-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentDate(subWeeks(currentDate, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[140px] text-center">
              {format(weekStart, "dd/MM", { locale: vi })} -{" "}
              {format(weekEnd, "dd/MM/yyyy", { locale: vi })}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentDate(addWeeks(currentDate, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Day Headers */}
            <div className="grid grid-cols-8 border-b">
              <div className="p-3 text-center text-sm text-muted-foreground" />
              {weekDays.map((day) => (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "p-3 text-center border-l",
                    isToday(day) && "bg-primary-600 text-white"
                  )}
                >
                  <div className="text-xs uppercase">
                    {isToday(day) ? "HÔM NAY" : format(day, "EEE", { locale: vi }).toUpperCase()}
                  </div>
                  <div className={cn("text-xs", isToday(day) ? "text-white/80" : "text-muted-foreground")}>
                    {format(day, "EEE", { locale: vi }).toUpperCase().slice(0, 3)} {format(day, "d")}
                  </div>
                  <div className="text-lg font-semibold">{format(day, "d")}</div>
                </div>
              ))}
            </div>

            {/* Time Grid */}
            <div className="relative">
              {TIME_SLOTS.map((hour) => (
                <div key={hour} className="grid grid-cols-8 border-b" style={{ height: 60 }}>
                  <div className="p-2 text-xs text-muted-foreground text-right pr-3 border-r">
                    {String(hour).padStart(2, "0")}:00
                  </div>
                  {weekDays.map((day) => (
                    <div key={day.toISOString()} className="relative border-l" />
                  ))}
                </div>
              ))}

              {/* Events Overlay */}
              {weekDays.map((day, dayIndex) => {
                const dayEvents = getEventsForDay(day);
                return dayEvents.map((event) => {
                  const { top, height } = getEventPosition(event);
                  const leftOffset = (dayIndex + 1) * (100 / 8);

                  return (
                    <div
                      key={event.id}
                      className={cn(
                        "absolute rounded-lg p-2 mx-1 overflow-hidden",
                        event.status === "completed" && "bg-blue-50 border border-blue-200",
                        event.status === "ongoing" && "bg-white border-2 border-red-500 shadow-lg",
                        event.status === "upcoming" && "bg-gray-50 border border-gray-200"
                      )}
                      style={{
                        top: top + 1,
                        height: height - 2,
                        left: `calc(${leftOffset}% + 4px)`,
                        width: `calc(${100 / 8}% - 12px)`,
                      }}
                    >
                      {event.status === "ongoing" && (
                        <Badge className="bg-red-500 text-white text-[10px] mb-1">
                          ĐANG DIỄN RA
                        </Badge>
                      )}
                      {event.status === "completed" && (
                        <div className="flex items-center gap-1 text-green-600 text-xs mb-1">
                          <span className="w-3 h-3 rounded-full bg-green-500 flex items-center justify-center">
                            <span className="text-white text-[8px]">✓</span>
                          </span>
                          Đã hoàn thành
                        </div>
                      )}
                      <p className="text-sm font-medium truncate">{event.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(parseISO(event.startTime), "HH:mm")} -{" "}
                        {format(parseISO(event.endTime), "HH:mm")}
                        {event.type === "livestream" && " •"}
                      </p>
                      {event.type === "livestream" && (
                        <p className="text-xs text-muted-foreground">Livestream</p>
                      )}
                      {event.status === "ongoing" && event.meetingUrl && (
                        <Button
                          size="sm"
                          className="w-full mt-2 bg-red-500 hover:bg-red-600 text-xs h-7"
                          onClick={() => window.open(event.meetingUrl, "_blank")}
                        >
                          Tham gia ngay
                        </Button>
                      )}
                    </div>
                  );
                });
              })}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
