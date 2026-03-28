"use client";

/**
 * My Assignments page - shows student's assignments with filtering and pagination
 */

import { useState } from "react";
import Link from "next/link";
import {
  FileUp,
  CheckCircle,
  Code,
  Code2,
  Clock,
  Calendar,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  mockMyAssignments,
  type MyAssignment,
  type AssignmentStatus,
} from "@/lib/mock-data/my-assignments";

// ---- Config maps ----

const TYPE_CONFIG = {
  "NỘP FILE": { icon: FileUp, bg: "bg-orange-100", color: "text-orange-600", badge: "bg-orange-100 text-orange-700" },
  QUIZ: { icon: CheckCircle, bg: "bg-blue-100", color: "text-blue-600", badge: "bg-blue-100 text-blue-700" },
  SANDBOX: { icon: Code, bg: "bg-green-100", color: "text-green-600", badge: "bg-green-100 text-green-700" },
  "THỰC HÀNH": { icon: Code2, bg: "bg-pink-100", color: "text-pink-600", badge: "bg-pink-100 text-pink-700" },
} as const;

const STATUS_BORDER: Record<AssignmentStatus, string> = {
  pending: "border-l-4 border-l-orange-400",
  completed: "border-l-4 border-l-green-400",
  overdue: "border-l-4 border-l-red-300",
};

type TabKey = "all" | "pending" | "completed" | "overdue";

const TABS: { key: TabKey; label: string }[] = [
  { key: "all", label: "Tất cả" },
  { key: "pending", label: "Chưa làm" },
  { key: "completed", label: "Hoàn thành" },
  { key: "overdue", label: "Quá hạn" },
];

// ---- Sub-components ----

function AssignmentCard({ item }: { item: MyAssignment }) {
  const typeConf = TYPE_CONFIG[item.type];
  const Icon = typeConf.icon;
  const isOverdue = item.status === "overdue";
  const isCompleted = item.status === "completed";

  return (
    <div className={cn("bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-4 shadow-sm", STATUS_BORDER[item.status])}>
      {/* Top section */}
      <div className="flex gap-3 items-start">
        <div className={cn("w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0", typeConf.bg)}>
          <Icon className={cn("w-5 h-5", typeConf.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn("font-semibold text-sm leading-snug", isOverdue && "text-gray-400")}>{item.title}</p>
          <p className="text-xs text-gray-500 mt-0.5 truncate">{item.courseName}</p>
        </div>
      </div>

      {/* Bottom row */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        {/* Type badge */}
        <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", typeConf.badge)}>{item.type}</span>

        {/* Status info */}
        <div className="flex items-center gap-1 text-xs">
          {item.status === "pending" && item.deadline && (
            <>
              <Clock className="w-3.5 h-3.5 text-orange-500" />
              <span className="text-orange-600 font-medium">{item.deadline}</span>
            </>
          )}
          {item.status === "completed" && item.score && (
            <>
              <CheckCircle className="w-3.5 h-3.5 text-green-500" />
              <span className="text-green-600 font-medium">{item.score}</span>
            </>
          )}
          {item.status === "completed" && item.submittedAt && !item.score && (
            <>
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-gray-500">{item.submittedAt}</span>
            </>
          )}
          {isOverdue && <span className="text-red-500 font-medium">Quá hạn</span>}
        </div>

        {/* Action button */}
        {isOverdue ? (
          <button disabled className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-gray-400 cursor-not-allowed">
            Đã đóng
          </button>
        ) : isCompleted ? (
          <Link
            href={`/learn/${item.courseSlug}/${item.lessonId}`}
            className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Xem chi tiết
          </Link>
        ) : (
          <Link
            href={`/learn/${item.courseSlug}/${item.lessonId}`}
            className="text-xs px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            Làm bài ngay
          </Link>
        )}
      </div>
    </div>
  );
}

// ---- Main Page ----

export default function MyAssignmentsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [courseFilter, setCourseFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const pendingCount = mockMyAssignments.filter((a) => a.status === "pending").length;

  const filtered = mockMyAssignments.filter((a) => {
    const tabMatch = activeTab === "all" || a.status === activeTab;
    const courseMatch = courseFilter === "all" || a.courseName === courseFilter;
    const typeMatch = typeFilter === "all" || a.type === typeFilter;
    return tabMatch && courseMatch && typeMatch;
  });

  const uniqueCourses = Array.from(new Set(mockMyAssignments.map((a) => a.courseName)));
  const uniqueTypes = Array.from(new Set(mockMyAssignments.map((a) => a.type)));

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Bài tập của tôi</h1>
        <p className="text-gray-500 mt-1">
          Chào buổi sáng! Bạn có {pendingCount} bài tập cần hoàn thành hôm nay.
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
              {tab.key === "pending" && (
                <span className={cn("text-xs px-1.5 py-0.5 rounded-full font-semibold",
                  activeTab === "pending" ? "bg-white text-blue-600" : "bg-orange-100 text-orange-600"
                )}>
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2">
          <select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            className="text-sm border border-gray-100 rounded-xl px-3 py-1.5 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Khóa học</option>
            {uniqueCourses.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-sm border border-gray-100 rounded-xl px-3 py-1.5 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Loại bài tập</option>
            {uniqueTypes.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>

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
      </div>

      {/* Assignment cards */}
      <div className={cn(
        "grid gap-4 mb-6",
        viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
      )}>
        {filtered.length > 0
          ? filtered.map((item) => <AssignmentCard key={item.id} item={item} />)
          : <p className="col-span-3 text-center text-gray-500 py-12">Không có bài tập nào.</p>
        }
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>Hiển thị {filtered.length} trong số {mockMyAssignments.length} bài tập</span>
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
    </div>
  );
}
