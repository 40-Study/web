"use client";

/**
 * My Assignments page — shows student's assignments fetched from real API.
 * Một request `GET /me/assignments` (C16); backend cũ rơi về từng buổi học (`lib/fetch-my-assignments.ts`).
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
import { QueryState } from "@/components/common/query-state";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Assignment } from "@/services/livestream-classroom.service";
import { fetchMyAssignments } from "@/lib/fetch-my-assignments";
import { classifyAssignment, isPastDue, type AssignmentStatus } from "@/lib/assignment-status";
import { hasSubmitted, submissionLabel } from "@/lib/assignment-submission";
import { useAuthStore } from "@/stores/auth.store";
import { formatVnDateTime } from "@/lib/vn-datetime";

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
  return formatVnDateTime(d);
}

type TabKey = "all" | AssignmentStatus;

const TABS: { key: TabKey; label: string }[] = [
  { key: "all", label: "Tất cả" },
  { key: "active", label: "Đang mở" },
  { key: "upcoming", label: "Chưa mở" },
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
  const submittedLabel = submissionLabel(item.my_submission);

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
          {submittedLabel && (
            <span className="shrink-0 whitespace-nowrap rounded-full bg-green-50 px-2 py-0.5 font-medium text-green-700">
              {submittedLabel}
            </span>
          )}
          {!item.is_published && (
            <span className="text-gray-400">Chưa công bố</span>
          )}
          {deadline && (
            // Đã nộp/đã chấm thì không còn "nộp muộn" nào để nhắc (QA6 S6-06): chỉ ghi mốc hạn, không tô cam.
            <span className={cn(pastDue && !submittedLabel ? "text-orange-600" : "text-gray-500")}>
              {pastDue && !submittedLabel ? "Quá hạn, còn nộp muộn · " : "Hạn: "}
              {deadline}
            </span>
          )}
        </div>

        {/* Time limit (S7-05: bài chấm thủ công không chạy test nên không có giới hạn/test) */}
        {item.auto_grade !== false && item.time_limit && item.time_limit > 0 && (
          <span
            className="text-xs text-gray-400 flex items-center gap-1"
            title="Thời gian chạy tối đa cho mỗi test (không phải đồng hồ đếm ngược)"
          >
            <Clock className="w-3 h-3" aria-hidden="true" />
            Giới hạn {item.time_limit}s/test
          </span>
        )}

        {/* Action button */}
        {active ? (
          <button
            type="button"
            onClick={() => onStart(item)}
            className="text-xs px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            {submittedLabel ? "Xem bài nộp" : "Làm bài ngay"}
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

// ---- Assignments hook ----

const ASSIGNMENTS_QUERY_KEY = ["my-assignments-aggregated"] as const;

function useAllAssignments() {
  // S7-09 (C16): một request `/me/assignments`; backend cũ (404) rơi về từng buổi, xem `fetchMyAssignments`.
  return useQuery({ queryKey: ASSIGNMENTS_QUERY_KEY, queryFn: fetchMyAssignments });
}

// ---- Main Page ----

export default function MyAssignmentsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [working, setWorking] = useState<Assignment | null>(null);
  const userId = useAuthStore((s) => s.user?.id);
  const queryClient = useQueryClient();
  // staleTime 30 s và không tải lại khi focus: nộp bài xong mà không làm mới thì danh sách vẫn ghi "Làm bài ngay"
  // và đếm bài đó là "đang mở" (QA5 review #127, mục 3). Làm mới ngay khi nộp và khi đóng màn làm bài.
  const refreshAssignments = () => queryClient.invalidateQueries({ queryKey: ASSIGNMENTS_QUERY_KEY });

  const { data, isLoading, isError, error, refetch } = useAllAssignments();
  const assignments = data ?? [];
  // Q9-STU-01: lỗi API không được đọc thành "0 bài tập"; chỉ coi là lỗi khi chưa có dữ liệu cache.
  const showError = isError && !data;
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

  // Bài đã nộp/đã chấm không còn là việc phải làm: không tính vào số "đang mở".
  const activeCount = classified.filter((c) => c.status === "active" && !hasSubmitted(c.item)).length;

  return (
    <div className="page-container py-4 sm:py-8">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bài tập của tôi</h1>
          <p className="text-gray-500 mt-1">
            {isLoading
              ? "Đang tải..."
              : showError
              ? "Chưa tải được danh sách bài tập."
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
            type="button"
            aria-label="Xem dạng lưới"
            aria-pressed={viewMode === "grid"}
            onClick={() => setViewMode("grid")}
            className={cn("p-1.5 transition-colors", viewMode === "grid" ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-100")}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            type="button"
            aria-label="Xem dạng danh sách"
            aria-pressed={viewMode === "list"}
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
      ) : showError ? (
        <QueryState isError error={error} onRetry={() => refetch()} className="mb-6">
          {null}
        </QueryState>
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
          onSubmitted={refreshAssignments}
          onClose={() => {
            setWorking(null);
            refreshAssignments();
          }}
        />
      )}

      {/* Pagination summary */}
      {!isLoading && !showError && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Hiển thị {filtered.length} trong số {assignments.length} bài tập</span>
          <div className="flex items-center gap-1">
            <button type="button" aria-label="Trang trước" className="p-1.5 rounded-xl border border-gray-100 hover:bg-gray-50 disabled:opacity-40" disabled>
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-sm font-medium">1</button>
            <button type="button" aria-label="Trang sau" className="p-1.5 rounded-xl border border-gray-100 hover:bg-gray-50 disabled:opacity-40" disabled>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
