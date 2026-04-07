"use client";

/**
 * My Assignments page — shows student's assignments fetched from real API.
 * Assignments are session-scoped; we list all classes then aggregate assignments.
 */

import { useState } from "react";
import {
  Code,
  Clock,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  Loader2,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { livestreamClassroomService, type Assignment } from "@/services/livestream-classroom.service";

// ---- Display helpers ----

function isActive(item: Assignment): boolean {
  return item.is_published;
}

type TabKey = "all" | "active" | "upcoming" | "ended";

const TABS: { key: TabKey; label: string }[] = [
  { key: "all", label: "Tất cả" },
  { key: "active", label: "Đang mở" },
  { key: "upcoming", label: "Sắp tới" },
  { key: "ended", label: "Đã đóng" },
];

// ---- Assignment card ----

function AssignmentCard({ item }: { item: Assignment }) {
  const active = isActive(item);

  const borderCls = active
    ? "border-l-4 border-l-green-400"
    : "border-l-4 border-l-orange-400";

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
        {item.language && (
          <span className="text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full">
            {item.language}
          </span>
        )}

        {/* Status info */}
        <div className="flex items-center gap-1 text-xs">
          {!item.is_published && (
            <span className="text-gray-400">Chưa công bố</span>
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
          <button className="text-xs px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors">
            Làm bài ngay
          </button>
        ) : (
          <button
            disabled
            className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 text-gray-400 cursor-not-allowed"
          >
            Chưa mở
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

  const { data: assignments = [], isLoading } = useAllAssignments();

  const filtered = assignments.filter((a) => {
    if (activeTab === "all") return true;
    if (activeTab === "active") return isActive(a);
    if (activeTab === "upcoming") return !a.is_published;
    if (activeTab === "ended") return false; // No end_time available on this type
    return true;
  });

  const activeCount = assignments.filter(isActive).length;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Bài tập của tôi</h1>
        <p className="text-gray-500 mt-1">
          {isLoading
            ? "Đang tải..."
            : `Bạn có ${activeCount} bài tập đang mở.`}
        </p>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6 flex items-center gap-3 flex-wrap shadow-sm">
        {/* Tabs */}
        <div className="flex gap-1 flex-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5",
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
        <div className="flex border border-gray-100 rounded-xl overflow-hidden">
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
            ? filtered.map((item) => <AssignmentCard key={item.id} item={item} />)
            : <EmptyState />
          }
        </div>
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
