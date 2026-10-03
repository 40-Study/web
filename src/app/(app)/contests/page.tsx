"use client";

/**
 * Danh sách cuộc thi (contract §7, route `/contests`) — khách, học viên, phụ huynh, giảng viên,
 * admin đều xem được. Backend (#1) chỉ trả cuộc thi PUBLISHED + công khai. Tab "Cuộc thi của tôi"
 * (#2) chỉ hiện với học viên vì chỉ học viên đăng ký được.
 */
import { useState } from "react";
import { ChevronLeft, ChevronRight, Search, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { useMyContests, usePublicContests } from "@/hooks/queries/use-contests";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { CONTEST_PHASE_LABELS } from "@/lib/contest/contest-format";
import { normalizeRole } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth.store";
import type { ContestPage, ContestSummary, MyParticipation, PublicContestPhase } from "@/types/contest";
import { PUBLIC_CONTEST_PHASES } from "@/types/contest";
import { ContestCard } from "./_components/contest-card";
import { ContestErrorState, ContestLoading } from "./_components/contest-states";

type TabValue = "ALL" | PublicContestPhase | "MINE";
const PAGE_SIZE = 12;

export default function ContestsPage() {
  const { isAuthenticated, activeRole } = useAuthStore();
  const isStudent = isAuthenticated && normalizeRole(activeRole) === "STUDENT";

  const [tab, setTab] = useState<TabValue>("ALL");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search.trim(), 400);

  const isMine = tab === "MINE";
  const publicQuery = usePublicContests({
    phase: tab === "ALL" || tab === "MINE" ? undefined : tab,
    q: debouncedSearch || undefined,
    page,
    limit: PAGE_SIZE,
  });
  const mineQuery = useMyContests({ page, limit: PAGE_SIZE }, isMine && isStudent);
  const query = isMine ? mineQuery : publicQuery;

  const tabs: { value: TabValue; label: string }[] = [
    { value: "ALL", label: "Tất cả" },
    ...PUBLIC_CONTEST_PHASES.map((p) => ({ value: p as TabValue, label: CONTEST_PHASE_LABELS[p] })),
    ...(isStudent ? [{ value: "MINE" as TabValue, label: "Cuộc thi của tôi" }] : []),
  ];

  const selectTab = (value: TabValue) => {
    setTab(value);
    setPage(1);
  };

  return (
    <div className="page-container space-y-5 py-6">
      <header className="space-y-1">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
          <Trophy className="h-6 w-6 text-amber-500" aria-hidden="true" />
          Cuộc thi
        </h1>
        <p className="text-sm text-gray-600">Thi trắc nghiệm có giờ, xếp hạng và nhận chứng nhận, voucher.</p>
      </header>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div role="tablist" aria-label="Lọc theo trạng thái" className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
          {tabs.map((t) => (
            <button
              key={t.value}
              role="tab"
              aria-selected={tab === t.value}
              onClick={() => selectTab(t.value)}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium transition",
                tab === t.value ? "border-primary-600 bg-primary-600 text-white" : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        {!isMine && (
          <label className="relative block w-full md:w-72">
            <span className="sr-only">Tìm cuộc thi</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Tìm theo tên cuộc thi…"
              className="pl-9"
            />
          </label>
        )}
      </div>

      <ContestListBody
        isLoading={query.isLoading}
        error={query.error}
        onRetry={() => query.refetch()}
        data={query.data}
        isMine={isMine}
        hasFilter={!!debouncedSearch || tab !== "ALL"}
      />

      {query.data && query.data.total_pages > 1 && (
        <nav className="flex items-center justify-center gap-3" aria-label="Phân trang">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            <ChevronLeft className="mr-1 h-4 w-4" aria-hidden="true" />
            Trước
          </Button>
          <span className="text-sm text-gray-600">
            Trang {query.data.page}/{query.data.total_pages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= query.data.total_pages} onClick={() => setPage((p) => p + 1)}>
            Sau
            <ChevronRight className="ml-1 h-4 w-4" aria-hidden="true" />
          </Button>
        </nav>
      )}
    </div>
  );
}

type ListItem = ContestSummary & { my_participation?: MyParticipation | null };

function ContestListBody({
  isLoading,
  error,
  onRetry,
  data,
  isMine,
  hasFilter,
}: {
  isLoading: boolean;
  error: unknown;
  onRetry: () => void;
  data: ContestPage<ListItem> | undefined;
  isMine: boolean;
  hasFilter: boolean;
}) {
  if (isLoading) return <ContestLoading label="Đang tải danh sách cuộc thi…" />;
  if (error) return <ContestErrorState error={error} onRetry={onRetry} title="Không tải được danh sách cuộc thi" backHref="/" backLabel="Về trang chủ" />;
  if (!data || data.items.length === 0) {
    return (
      <EmptyState
        icon={Trophy}
        title={isMine ? "Bạn chưa đăng ký cuộc thi nào" : hasFilter ? "Không có cuộc thi phù hợp" : "Chưa có cuộc thi nào"}
        description={isMine ? "Chọn một cuộc thi ở tab Tất cả để đăng ký." : hasFilter ? "Thử đổi bộ lọc hoặc từ khoá tìm kiếm." : "Các cuộc thi mới sẽ hiện ở đây khi được công bố."}
      />
    );
  }
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {data.items.map((c) => (
        <ContestCard key={c.id} contest={c} participation={c.my_participation ?? null} />
      ))}
    </div>
  );
}
