"use client";

import { useState, useRef, useEffect } from "react";
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
import {
  ChevronLeft,
  ChevronRight,
  Bell,
  Video,
  Radio,
  Clock,
  User,
  MapPin,
  ExternalLink,
  PlayCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Mock data - replace with API
const MOCK_STUDENT_EVENTS = [
  {
    id: "1",
    title: "Toán Cao cấp A1",
    courseId: "c1",
    startTime: "2026-03-23T08:00:00",
    endTime: "2026-03-23T09:30:00",
    type: "video" as const,
    status: "completed" as const,
    teacher: "TS. Nguyễn Văn A",
    location: "Phòng A101",
    description: "Học về giới hạn và đạo hàm",
  },
  {
    id: "2",
    title: "Tiếng Anh Giao tiếp",
    courseId: "c2",
    startTime: "2026-03-23T10:00:00",
    endTime: "2026-03-23T11:30:00",
    type: "livestream" as const,
    status: "ongoing" as const,
    meetingUrl: "https://meet.google.com/abc",
    teacher: "Cô Trần Thị B",
    location: "Online - Google Meet",
    description: "Conversation skills - Daily topics",
  },
  {
    id: "3",
    title: "Lập trình Python cơ bản",
    courseId: "c3",
    startTime: "2026-03-24T14:00:00",
    endTime: "2026-03-24T15:30:00",
    type: "video" as const,
    status: "upcoming" as const,
    teacher: "Th.S Hoàng Văn C",
    location: "Phòng B202",
    description: "Python fundamentals - Functions & Modules",
  },
  {
    id: "4",
    title: "Kỹ năng mềm",
    courseId: "c4",
    startTime: "2026-03-25T09:00:00",
    endTime: "2026-03-25T10:30:00",
    type: "hybrid" as const,
    status: "upcoming" as const,
    teacher: "TS. Lê Thị D",
    location: "Phòng C303 - Online",
    description: "Teamwork & Communication skills",
  },
  {
    id: "5",
    title: "Toán rời rạc",
    courseId: "c5",
    startTime: "2026-03-26T08:00:00",
    endTime: "2026-03-26T09:30:00",
    type: "video" as const,
    status: "upcoming" as const,
    teacher: "PGS.TS. Phạm Văn E",
    location: "Phòng D404",
    description: "Logic và chứng minh toán học",
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
  teacher: string;
  location?: string;
  description?: string;
}

const TIME_SLOTS = Array.from({ length: 14 }, (_, i) => i + 7);

export default function StudentSchedulePage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [hoveredEventId, setHoveredEventId] = useState<string | null>(null);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const events = MOCK_STUDENT_EVENTS;

  const getEventsForDay = (day: Date) => {
    return events.filter((event) => isSameDay(parseISO(event.startTime), day));
  };

  const getEventPosition = (event: ScheduleEvent) => {
    const start = parseISO(event.startTime);
    const end = parseISO(event.endTime);
    const startHour = start.getHours() + start.getMinutes() / 60;
    const duration = differenceInMinutes(end, start) / 60;
    const top = (startHour - 7) * 60;
    const height = duration * 60;
    return { top, height };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Lịch học</h1>
          <p className="text-sm text-gray-500 mt-1">Xem lịch học và tham gia lớp học</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Date Navigation */}
          <div className="flex items-center gap-1 rounded-xl border bg-white dark:bg-gray-800 px-3 py-2 shadow-sm">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => setCurrentDate(subWeeks(currentDate, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[160px] text-center">
              {format(weekStart, "dd MMM", { locale: vi })} - {format(weekEnd, "dd MMM yyyy", { locale: vi })}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => setCurrentDate(addWeeks(currentDate, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-gradient-to-br from-green-400 to-green-600" />
          <span className="text-gray-600 dark:text-gray-300">Đã hoàn thành</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-gradient-to-br from-red-400 to-red-600 animate-pulse" />
          <span className="text-gray-600 dark:text-gray-300">Đang diễn ra</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-gradient-to-br from-blue-400 to-blue-600" />
          <span className="text-gray-600 dark:text-gray-300">Sắp diễn ra</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <Card className="overflow-hidden border shadow-sm">
        <div className="overflow-x-auto">
          <div className="min-w-[900px] calendar-container relative">
            {/* Day Headers */}
            <div className="grid grid-cols-8 bg-gray-50 dark:bg-gray-900/50 border-b">
              <div className="p-4 text-center text-sm font-medium text-gray-400" />
              {weekDays.map((day) => (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "p-4 text-center border-l transition-all",
                    isToday(day)
                      ? "bg-gradient-to-b from-primary-600 to-primary-700 text-white"
                      : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  )}
                >
                  <div
                    className={cn(
                      "text-xs uppercase tracking-wider",
                      isToday(day) ? "text-white/80" : "text-gray-400"
                    )}
                  >
                    {isToday(day) ? "Hôm nay" : format(day, "EEEE", { locale: vi })}
                  </div>
                  <div
                    className={cn(
                      "text-2xl font-bold mt-1",
                      isToday(day) ? "text-white" : "text-gray-900 dark:text-white"
                    )}
                  >
                    {format(day, "d")}
                  </div>
                  <div
                    className={cn(
                      "text-xs mt-1",
                      isToday(day) ? "text-white/70" : "text-gray-400"
                    )}
                  >
                    {format(day, "MMM", { locale: vi })}
                  </div>
                </div>
              ))}
            </div>

            {/* Time Grid */}
            <div className="relative" onClick={() => setHoveredEvent(null)}>
              {TIME_SLOTS.map((hour) => (
                <div
                  key={hour}
                  className="grid grid-cols-8 border-b border-gray-100 dark:border-gray-800"
                  style={{ height: 72 }}
                >
                  <div className="p-3 text-sm text-gray-400 text-right pr-4 border-r border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30">
                    <span className="font-medium">{String(hour).padStart(2, "0")}:00</span>
                  </div>
                  {weekDays.map((day) => (
                    <div
                      key={day.toISOString()}
                      className={cn(
                        "relative border-l border-gray-100 dark:border-gray-800 transition-colors",
                        "hover:bg-gray-50/50 dark:hover:bg-gray-800/30"
                      )}
                    />
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
                        "absolute rounded-lg cursor-pointer transition-all duration-200",
                        "hover:shadow-lg hover:z-20",
                        event.status === "completed" &&
                          "bg-gradient-to-br from-green-50 to-green-100/50 border border-green-200",
                        event.status === "ongoing" &&
                          "bg-gradient-to-br from-white to-red-50 border-2 border-red-400 shadow-md shadow-red-100",
                        event.status === "upcoming" &&
                          "bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200"
                      )}
                      style={{
                        top: top + 2,
                        height: height - 4,
                        left: `calc(${leftOffset}% + 4px)`,
                        width: `calc(${100 / 8}% - 10px)`,
                      }}
                      onMouseEnter={() => setHoveredEventId(event.id)}
                      onMouseLeave={() => setHoveredEventId(null)}
                    >
                      <div className="h-full p-2 flex flex-col justify-between">
                        {/* Title */}
                        <h4 className="font-semibold text-gray-900 dark:text-white text-xs line-clamp-1">
                          {event.title}
                        </h4>

                        {/* Time */}
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          <span>
                            {format(parseISO(event.startTime), "HH:mm")}
                          </span>
                        </div>
                      </div>

                      {/* Inline Tooltip */}
                      {hoveredEventId === event.id && (
                        <div
                          className={cn(
                            "absolute left-full top-0 ml-2 w-72 rounded-xl shadow-2xl border p-4 z-50",
                            "bg-white dark:bg-gray-900",
                            event.status === "completed" && "border-green-200",
                            event.status === "ongoing" && "border-red-300 bg-gradient-to-br from-white to-red-50",
                            event.status === "upcoming" && "border-blue-200"
                          )}
                          onMouseEnter={() => setHoveredEventId(event.id)}
                          onMouseLeave={() => setHoveredEventId(null)}
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h3 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-2">
                              {event.title}
                            </h3>
                            {event.status === "ongoing" && (
                              <Badge className="bg-red-500 text-white text-[10px] shrink-0 animate-pulse">
                                ĐANG DIỄN RA
                              </Badge>
                            )}
                            {event.status === "completed" && (
                              <Badge className="bg-green-100 text-green-700 text-[10px] shrink-0">
                                ĐÃ HOÀN THÀNH
                              </Badge>
                            )}
                            {event.status === "upcoming" && (
                              <Badge className="bg-blue-100 text-blue-700 text-[10px] shrink-0">
                                SẮP DIỄN RA
                              </Badge>
                            )}
                          </div>
                          <div className="space-y-1.5 mb-2">
                            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                              <Clock className="w-3.5 h-3.5 text-gray-400" />
                              <span>
                                {format(parseISO(event.startTime), "HH:mm")} - {format(parseISO(event.endTime), "HH:mm")}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                              <User className="w-3.5 h-3.5 text-gray-400" />
                              <span>{event.teacher}</span>
                            </div>
                            {event.location && (
                              <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                                <span>{event.location}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            {event.status === "ongoing" && event.meetingUrl && (
                              <Button
                                size="sm"
                                className="flex-1 bg-red-500 hover:bg-red-600 text-white text-xs h-8"
                                onClick={() => window.open(event.meetingUrl, "_blank")}
                              >
                                <ExternalLink className="w-3 h-3 mr-1" />
                                Tham gia
                              </Button>
                            )}
                            {event.status === "upcoming" && (
                              <Button size="sm" variant="outline" className="flex-1 text-xs h-8">
                                Chi tiết
                              </Button>
                            )}
                            {event.status === "completed" && (
                              <Button size="sm" variant="outline" className="flex-1 text-xs h-8">
                                <PlayCircle className="w-3 h-3 mr-1" />
                                Xem lại
                              </Button>
                            )}
                          </div>
                        </div>
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
