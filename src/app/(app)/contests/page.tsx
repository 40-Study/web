"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Trophy, Clock, Users, Code, HelpCircle, Loader2, Plus, Calendar,
  Search, SlidersHorizontal, X, ChevronDown,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useContests } from "@/hooks/queries/use-contests";
import type { Contest, ContestStatus, ContestType } from "@/services/contest.service";
import { useAuthStore } from "@/stores/auth.store";

// ─── Filter Config ──────────────────────────────────────────────────────────

const STATUS_OPTIONS: { label: string; value: ContestStatus | ""; color: string }[] = [
  { label: "Tất cả", value: "", color: "bg-gray-100 text-gray-700 border-gray-200" },
  { label: "Sắp diễn ra", value: "UPCOMING", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { label: "Đang diễn ra", value: "ACTIVE", color: "bg-green-50 text-green-700 border-green-200" },
  { label: "Đã kết thúc", value: "ENDED", color: "bg-orange-50 text-orange-700 border-orange-200" },
];

const TYPE_OPTIONS: { label: string; value: ContestType | ""; icon: React.ReactNode }[] = [
  { label: "Tất cả", value: "", icon: <Trophy className="h-3.5 w-3.5" /> },
  { label: "Lập trình", value: "CODING", icon: <Code className="h-3.5 w-3.5" /> },
  { label: "Trắc nghiệm", value: "QUIZ", icon: <HelpCircle className="h-3.5 w-3.5" /> },
  { label: "Tổng hợp", value: "MIXED", icon: <Trophy className="h-3.5 w-3.5" /> },
];

const STATUS_BADGE: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  UPCOMING: "bg-blue-100 text-blue-700",
  ACTIVE: "bg-emerald-100 text-emerald-700",
  ENDED: "bg-orange-100 text-orange-600",
  CANCELLED: "bg-red-100 text-red-600",
};
const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Nháp", UPCOMING: "Sắp tới", ACTIVE: "Đang thi", ENDED: "Đã kết thúc", CANCELLED: "Đã hủy",
};
const TYPE_LABEL: Record<string, string> = {
  CODING: "Lập trình", QUIZ: "Trắc nghiệm", MIXED: "Tổng hợp",
};
const TYPE_ICON: Record<string, React.ReactNode> = {
  CODING: <Code className="h-3.5 w-3.5" />,
  QUIZ: <HelpCircle className="h-3.5 w-3.5" />,
  MIXED: <Trophy className="h-3.5 w-3.5" />,
};

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

// ─── Filter Panel ───────────────────────────────────────────────────────────

function FilterPanel({
  open, onClose,
  status, onStatusChange,
  type, onTypeChange,
  dateFrom, dateTo, onDateFromChange, onDateToChange,
  onReset,
}: {
  open: boolean; onClose: () => void;
  status: string; onStatusChange: (v: string) => void;
  type: string; onTypeChange: (v: string) => void;
  dateFrom: string; dateTo: string;
  onDateFromChange: (v: string) => void; onDateToChange: (v: string) => void;
  onReset: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose]);

  if (!open) return null;

  const activeCount = [status, type, dateFrom, dateTo].filter(Boolean).length;

  return (
    <div ref={ref} className="absolute right-0 top-full mt-2 bg-white rounded-2xl border border-gray-200 shadow-xl z-50 w-80 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/50">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-semibold text-gray-800">Bộ lọc</span>
          {activeCount > 0 && (
            <Badge className="bg-blue-600 text-white text-[10px] px-1.5 py-0 h-4">{activeCount}</Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          {activeCount > 0 && (
            <button onClick={onReset} className="text-[11px] text-blue-600 hover:underline font-medium mr-2">
              Xóa lọc
            </button>
          )}
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-200 transition-colors">
            <X className="h-4 w-4 text-gray-400" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Status */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Trạng thái</p>
          <div className="grid grid-cols-2 gap-1.5">
            {STATUS_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => onStatusChange(opt.value)}
                className={cn(
                  "px-3 py-2 rounded-lg text-xs font-medium border transition-all text-center",
                  status === opt.value ? "ring-2 ring-blue-500 ring-offset-1" : "",
                  opt.color,
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Type */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Loại cuộc thi</p>
          <div className="grid grid-cols-2 gap-1.5">
            {TYPE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => onTypeChange(opt.value)}
                className={cn(
                  "flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-all",
                  type === opt.value
                    ? "bg-blue-50 border-blue-300 text-blue-700 ring-2 ring-blue-500 ring-offset-1"
                    : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100",
                )}
              >
                {opt.icon}
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Date range */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Thời gian</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-gray-400 mb-0.5 block">Từ ngày</label>
              <Input type="date" value={dateFrom} onChange={e => onDateFromChange(e.target.value)} className="h-8 text-xs" />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 mb-0.5 block">Đến ngày</label>
              <Input type="date" value={dateTo} onChange={e => onDateToChange(e.target.value)} className="h-8 text-xs" />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50">
        <Button size="sm" className="w-full text-xs" onClick={onClose}>
          Áp dụng
        </Button>
      </div>
    </div>
  );
}

// ─── Contest Card ────────────────────────────────────────────────────────────

function ContestCard({ contest }: { contest: Contest }) {
  const isActive = contest.status === "ACTIVE";
  const isUpcoming = contest.status === "UPCOMING";

  return (
    <Link href={`/contests/${contest.slug}`}>
      <Card className={cn(
        "group overflow-hidden transition-all hover:shadow-lg cursor-pointer h-full flex flex-col",
        isActive && "border-emerald-200 bg-emerald-50/20",
      )}>
        {contest.banner_url ? (
          <div className="h-36 overflow-hidden bg-gray-100 shrink-0">
            <img src={contest.banner_url} alt={contest.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
          </div>
        ) : (
          <div className="h-28 bg-gradient-to-br from-blue-50 to-violet-50 flex items-center justify-center shrink-0">
            <Trophy className="h-10 w-10 text-blue-300" />
          </div>
        )}

        <div className="p-4 space-y-2.5 flex-1 flex flex-col">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold line-clamp-2 group-hover:text-blue-600 transition-colors flex-1">{contest.title}</h3>
            <Badge className={cn("shrink-0 text-[10px] px-1.5", STATUS_BADGE[contest.status])}>
              {STATUS_LABEL[contest.status]}
            </Badge>
          </div>

          {contest.description && (
            <p className="text-xs text-gray-500 line-clamp-2">{contest.description}</p>
          )}

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-400 mt-auto pt-2">
            <span className="flex items-center gap-1">
              {TYPE_ICON[contest.type]}
              {TYPE_LABEL[contest.type]}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {contest.participant_count}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {fmtDate(contest.start_time)}
            </span>
            {contest.duration && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {contest.duration}p
              </span>
            )}
          </div>

          {(isActive || isUpcoming) && (
            <Button size="sm" className="w-full mt-2" variant={isActive ? "default" : "outline"}>
              {isActive ? "Tham gia ngay" : "Xem chi tiết"}
            </Button>
          )}
        </div>
      </Card>
    </Link>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function ContestsPage() {
  const [keyword, setKeyword] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { activeRole } = useAuthStore();
  const isTeacher = activeRole === "TEACHER";

  const { data, isLoading } = useContests({
    status: (statusFilter as ContestStatus) || undefined,
    page: 1,
    limit: 50,
  });

  const activeFilterCount = [statusFilter, typeFilter, dateFrom, dateTo].filter(Boolean).length;

  // Client-side filtering for type and date (backend handles status)
  const contests = (data?.contests ?? []).filter(c => {
    if (typeFilter && c.type !== typeFilter) return false;
    if (dateFrom && new Date(c.start_time) < new Date(dateFrom)) return false;
    if (dateTo && new Date(c.start_time) > new Date(dateTo + "T23:59:59")) return false;
    if (keyword && !c.title.toLowerCase().includes(keyword.toLowerCase())) return false;
    return true;
  });

  const resetFilters = () => {
    setStatusFilter("");
    setTypeFilter("");
    setDateFrom("");
    setDateTo("");
  };

  return (
    <div className="container max-w-6xl mx-auto py-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="h-7 w-7 text-yellow-500" />
            Cuộc thi
          </h1>
          <p className="text-sm text-gray-500 mt-1">Tham gia các cuộc thi lập trình và trắc nghiệm</p>
        </div>
        {isTeacher && (
          <Link href="/teacher/contests/create">
            <Button><Plus className="h-4 w-4 mr-2" />Tạo cuộc thi</Button>
          </Link>
        )}
      </div>

      {/* Search + Filter button */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Tìm kiếm cuộc thi..."
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="relative">
          <Button
            variant="outline"
            size="sm"
            className={cn("gap-1.5", activeFilterCount > 0 && "border-blue-300 bg-blue-50 text-blue-700")}
            onClick={() => setShowFilter(v => !v)}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Bộ lọc
            {activeFilterCount > 0 && (
              <Badge className="bg-blue-600 text-white text-[10px] px-1.5 py-0 h-4 ml-0.5">{activeFilterCount}</Badge>
            )}
            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", showFilter && "rotate-180")} />
          </Button>

          <FilterPanel
            open={showFilter}
            onClose={() => setShowFilter(false)}
            status={statusFilter}
            onStatusChange={setStatusFilter}
            type={typeFilter}
            onTypeChange={setTypeFilter}
            dateFrom={dateFrom}
            dateTo={dateTo}
            onDateFromChange={setDateFrom}
            onDateToChange={setDateTo}
            onReset={resetFilters}
          />
        </div>

        {/* Active filter chips */}
        {activeFilterCount > 0 && (
          <div className="flex items-center gap-1.5 ml-1">
            {statusFilter && (
              <Badge variant="outline" className="text-[11px] gap-1 pr-1">
                {STATUS_LABEL[statusFilter] || statusFilter}
                <button onClick={() => setStatusFilter("")} className="hover:bg-gray-200 rounded-full p-0.5"><X className="h-3 w-3" /></button>
              </Badge>
            )}
            {typeFilter && (
              <Badge variant="outline" className="text-[11px] gap-1 pr-1">
                {TYPE_LABEL[typeFilter]}
                <button onClick={() => setTypeFilter("")} className="hover:bg-gray-200 rounded-full p-0.5"><X className="h-3 w-3" /></button>
              </Badge>
            )}
            {(dateFrom || dateTo) && (
              <Badge variant="outline" className="text-[11px] gap-1 pr-1">
                {dateFrom || "..."} → {dateTo || "..."}
                <button onClick={() => { setDateFrom(""); setDateTo(""); }} className="hover:bg-gray-200 rounded-full p-0.5"><X className="h-3 w-3" /></button>
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : contests.length === 0 ? (
        <Card className="p-16 text-center border-dashed">
          <Trophy className="h-16 w-16 mx-auto mb-4 text-yellow-200" />
          <h3 className="text-lg font-semibold text-gray-800 mb-1">
            {activeFilterCount > 0 ? "Không tìm thấy cuộc thi" : "Chưa có cuộc thi nào"}
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            {activeFilterCount > 0
              ? "Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm"
              : "Các cuộc thi sẽ được hiển thị ở đây khi giáo viên tạo mới"}
          </p>
          {activeFilterCount > 0 ? (
            <Button variant="outline" onClick={resetFilters}>Xóa bộ lọc</Button>
          ) : isTeacher ? (
            <Link href="/teacher/contests/create">
              <Button><Plus className="h-4 w-4 mr-2" />Tạo cuộc thi đầu tiên</Button>
            </Link>
          ) : null}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contests.map(c => <ContestCard key={c.id} contest={c} />)}
        </div>
      )}
    </div>
  );
}
