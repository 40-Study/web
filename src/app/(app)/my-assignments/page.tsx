"use client";

/**
 * My Assignments page — shows student's assignments fetched from real API.
 * Assignments are session-scoped; we list all classes then aggregate assignments.
 */

import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  Code,
  Clock,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  Loader2,
  BookOpen,
  GraduationCap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { livestreamClassroomService, type Assignment } from "@/services/livestream-classroom.service";
import { classifyAssignment, isPastDue, type AssignmentStatus } from "@/lib/assignment-status";
import { useAuthStore } from "@/stores/auth.store";

// A-02: nơi làm bài (code / tự luận / trắc nghiệm, chạy thử, nộp) đã có sẵn ở phòng livestream. Dùng lại đúng
// màn đó thay vì viết bản thứ hai; tải động vì kéo theo trình soạn thảo nặng mà phần lớn lượt vào trang không dùng.
const AssignmentWorkOverlay = dynamic(
  () => import("@/app/(live)/rooms/[roomName]/tabs/AssignmentWorkOverlay"),
  { ssr: false },
);

// ---- Display helpers ----

function formatDeadline(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

type TabKey = "all" | AssignmentStatus;

const TABS: { key: TabKey; label: string }[] = [
  { key: "all", label: "Tất cả" },
  { key: "active", label: "Đang mở" },
  { key: "upcoming", label: "Sắp tới" },
  { key: "ended", label: "Đã đóng" },
];

// ---- Assignment card ----

function AssignmentCard({
  item,
  status,
  pastDue,
  onStart,
}: {
  item: Assignment;
  status: AssignmentStatus;
  pastDue: boolean;
  onStart: (item: Assignment) => void;
}) {
  const active = status === "active";

  const borderCls =
    status === "ended"
      ? "border-l-4 border-l-gray-300"
      : active
      ? "border-l-4 border-l-green-400"
      : "border-l-4 border-l-orange-400";
  const deadline = item.end_time ? formatDeadline(item.end_time) : "";

  return (
    <div className={cn("bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-4 shadow-sm", borderCls)}>
      {/* Top section */}
      <div className="flex gap-3 items-start">
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
          <Code className="w-5 h-5 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm leading-snug">
            {item.title}
          </p>
          {item.description && (
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{item.description}</p>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        {/* Language */}
        {/* Backend trả language là mảng (vd ["python"]) */}
        {item.language?.length > 0 && (
          <span className="text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full">
            {item.language.join(", ")}
          </span>
        )}

        {/* Status info */}
        <div className="flex items-center gap-1 text-xs">
          {!item.is_published && (
            <span className="text-gray-400">Chưa công bố</span>
          )}
          {deadline && (
            <span className={cn(pastDue ? "text-orange-600" : "text-gray-500")}>
              {pastDue ? "Quá hạn, còn nộp muộn · " : "Hạn: "}
              {deadline}
            </span>
          )}
        </div>

        {/* Time limit */}
        {item.time_limit && item.time_limit > 0 && (
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {item.time_limit}s
          </span>
        )}

        {/* Action button */}
        {active ? (
          <button
            type="button"
            onClick={() => onStart(item)}
            className="text-xs px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            Làm bài ngay
          </button>
        ) : (
          <button
            disabled
            className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 text-gray-400 cursor-not-allowed"
          >
            {status === "ended" ? "Đã đóng" : "Chưa mở"}
          </button>
        )}
      </div>
    </div>
  );
}

// ---- Empty state ----

function EmptyState() {
  return (
    <div className="col-span-3 flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
        <BookOpen className="w-8 h-8 text-blue-400" />
      </div>
      <p className="text-gray-500 text-sm">Không có bài tập nào.</p>
    </div>
  );
}

// ---- Aggregate assignments hook ----

function useAllAssignments() {
  return useQuery({
    queryKey: ["my-assignments-aggregated"],
    queryFn: async () => {
      // Step 1: fetch all sessions
      const sessions = await livestreamClassroomService.listSessions();
      if (!sessions || sessions.length === 0) return [];

      // Step 2: fetch assignments for each session in parallel
      const assignmentResults = await Promise.allSettled(
        sessions.map((s) => livestreamClassroomService.getAssignments(s.id))
      );

      const allAssignments: Assignment[] = [];
      for (const result of assignmentResults) {
        if (result.status === "fulfilled" && Array.isArray(result.value)) {
          allAssignments.push(...result.value);
        }
      }

      return allAssignments;
    },
  });
}

// ---- Main Page ----

export default function MyAssignmentsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [working, setWorking] = useState<Assignment | null>(null);
  const userId = useAuthStore((s) => s.user?.id);

  const { data: assignments = [], isLoading } = useAllAssignments();
  // Một mốc "bây giờ" cho cả lượt render để tab và thẻ không lệch nhau.
  const now = new Date();

  const classified = assignments.map((item) => ({
    item,
    status: classifyAssignment(item, now),
    pastDue: isPastDue(item, now),
  }));
  const filtered = classified.filter(
    (c) => activeTab === "all" || c.status === activeTab
  );

  const activeCount = classified.filter((c) => c.status === "active").length;

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bài tập của tôi</h1>
          <p className="text-gray-500 mt-1">
            {isLoading
              ? "Đang tải..."
              : `Bạn có ${activeCount} bài tập đang mở.`}
          </p>
        </div>
        {/* A-07: đường vào điểm số, người chấm và nhận xét của chính học viên */}
        <Link
          href="/my-grades"
          className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors"
        >
          <GraduationCap className="w-4 h-4" />
          Điểm của tôi
        </Link>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6 flex items-center gap-3 flex-wrap shadow-sm">
        {/* Tabs */}
        {/* A-21: whitespace-nowrap + cuộn ngang để nhãn ("Tất cả") không bị bẻ dòng ở 390px */}
        <div className="flex gap-1 flex-1 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0",
                activeTab === tab.key
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              {tab.label}
              {tab.key === "active" && activeCount > 0 && (
                <span className={cn(
                  "text-xs px-1.5 py-0.5 rounded-full font-semibold",
                  activeTab === "active" ? "bg-white text-blue-600" : "bg-orange-100 text-orange-600"
                )}>
                  {activeCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* View mode toggle */}
        {/* Ở 390px chế độ lưới/danh sách đều là một cột nên ẩn đi để đủ chỗ cho 4 tab */}
        <div className="hidden sm:flex border border-gray-100 rounded-xl overflow-hidden">
          <button
            onClick={() => setViewMode("grid")}
            className={cn("p-1.5 transition-colors", viewMode === "grid" ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-100")}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={cn("p-1.5 transition-colors", viewMode === "list" ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-100")}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Assignment cards */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      ) : (
        <div className={cn(
          "grid gap-4 mb-6",
          viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
        )}>
          {filtered.length > 0
            ? filtered.map((c) => (
                <AssignmentCard
                  key={c.item.id}
                  item={c.item}
                  status={c.status}
                  pastDue={c.pastDue}
                  onStart={setWorking}
                />
              ))
            : <EmptyState />
          }
        </div>
      )}

      {working && userId && (
        <AssignmentWorkOverlay
          assignmentId={working.id}
          title={working.title}
          userId={userId}
          onClose={() => setWorking(null)}
        />
      )}

      {/* Pagination summary */}
      {!isLoading && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Hiển thị {filtered.length} trong số {assignments.length} bài tập</span>
          <div className="flex items-center gap-1">
            <button className="p-1.5 rounded-xl border border-gray-100 hover:bg-gray-50 disabled:opacity-40" disabled>
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-sm font-medium">1</button>
            <button className="p-1.5 rounded-xl border border-gray-100 hover:bg-gray-50 disabled:opacity-40" disabled>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
