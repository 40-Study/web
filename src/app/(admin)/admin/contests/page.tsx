"use client";

/**
 * /admin/contests — hàng đợi duyệt (PENDING_REVIEW) và danh sách mọi cuộc thi (GET /admin/contests,
 * backend không trả bản nháp của người khác). Thao tác duyệt/từ chối/huỷ/chốt ở trang chi tiết.
 */

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { lastPageToClampTo } from "@/app/(admin)/admin/_lib/clamp-page";
import { QueryState } from "@/components/common/query-state";
import { Badge } from "@/components/ui/badge";
import { useAdminContests } from "@/hooks/queries/use-contest-manage";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { contestListEmptyCopy } from "./_lib/contest-list-empty-copy";
import { parseContestPage, parseContestStatus, parseContestTab, patchContestQuery, type ContestTab } from "./_lib/contest-list-query";
import { formatVnDateTime } from "@/lib/contest-manage/format";
import { CONTEST_STATUS_LABEL, phaseLabel, phaseVariant } from "@/lib/contest-manage/labels";
import { cn } from "@/lib/utils";
import { CONTEST_STATUSES } from "@/types/contest";

const PAGE_SIZE = 20;

export default function AdminContestsPage() {
  // useSearchParams cần Suspense boundary khi Next prerender trang client.
  return (
    <Suspense fallback={null}>
      <AdminContestsContent />
    </Suspense>
  );
}

function AdminContestsContent() {
  // QA7-A08: URL là nguồn sự thật cho tab/status/page; ô tìm kiếm ghi lên URL sau debounce.
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = parseContestTab(searchParams.get("tab"));
  const status = parseContestStatus(searchParams.get("status"));
  const page = parseContestPage(searchParams.get("page"));
  const urlQuery = searchParams.get("q") ?? "";
  const [keyword, setKeyword] = useState(urlQuery);
  const q = useDebouncedValue(keyword.trim(), 300);

  const updateQuery = (patch: Record<string, string | number | null>) => {
    const qs = patchContestQuery(searchParams.toString(), patch);
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  // Back/Forward đổi ?q= thì ô tìm kiếm theo URL; bỏ qua khi URL vừa do chính ô này ghi (urlQuery === q).
  useEffect(() => {
    if (urlQuery !== q) setKeyword(urlQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlQuery]);
  useEffect(() => {
    if (urlQuery !== q) updateQuery({ q, page: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const { data, isLoading, isError, error, refetch } = useAdminContests({
    status: tab === "pending" ? "PENDING_REVIEW" : status || undefined,
    q: q || undefined,
    page,
    limit: PAGE_SIZE,
  });
  const contests = data?.items ?? [];

  // QA7-A06 (M1): ?page=9999 vượt trang cuối -> trạng thái rỗng che mất thanh phân trang; kéo về trang cuối thật.
  const clampTo = lastPageToClampTo(page, data?.total_pages);
  useEffect(() => {
    if (clampTo !== null) updateQuery({ page: clampTo });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clampTo]);

  // Đổi tab: tab "Chờ duyệt" không có bộ lọc trạng thái nên bỏ status; luôn về trang 1.
  const switchTab = (next: ContestTab) => updateQuery({ tab: next, status: null, page: null });
  const setPage = (updater: (p: number) => number) => updateQuery({ page: updater(page) });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Cuộc thi</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Duyệt cuộc thi giảng viên gửi lên, gắn giải voucher, huỷ và chốt kết quả sau khi cuộc thi kết thúc.
        </p>
      </div>

      <div className="flex gap-2" role="tablist" aria-label="Lọc cuộc thi">
        {(
          [
            ["pending", "Chờ duyệt"],
            ["all", "Tất cả"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            data-testid={`tab-${key}`}
            onClick={() => switchTab(key)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium",
              tab === key
                ? "bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300"
                : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <section className="grid gap-3 rounded-xl border bg-white p-4 shadow-sm sm:grid-cols-2 dark:border-gray-800 dark:bg-gray-950">
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Tìm theo tên cuộc thi..."
          aria-label="Tìm cuộc thi"
          className="h-10 rounded-lg border border-gray-200 px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
        />
        {tab === "all" && (
          <select
            value={status}
            aria-label="Lọc theo trạng thái"
            onChange={(e) => updateQuery({ status: parseContestStatus(e.target.value), page: null })}
            className="h-10 rounded-lg border border-gray-200 px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
          >
            <option value="">Tất cả trạng thái</option>
            {CONTEST_STATUSES.map((s) => (
              <option key={s} value={s}>
                {CONTEST_STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        )}
      </section>

      <QueryState
        hasData={contests.length > 0}
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={() => refetch()}
        isEmpty={!isLoading && !isError && contests.length === 0}
        emptyTitle={contestListEmptyCopy(tab, q).title}
        emptyDescription={contestListEmptyCopy(tab, q).description}
      >
        <ul className="space-y-3" data-testid="admin-contest-list">
          {contests.map((c) => (
            <li
              key={c.id}
              data-testid={`admin-contest-${c.id}`}
              className="flex flex-col gap-2 rounded-xl border bg-white p-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800 dark:bg-gray-950"
            >
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="break-words font-semibold">{c.title}</span>
                  <Badge variant={phaseVariant(c.phase)}>{phaseLabel(c.phase)}</Badge>
                  {c.has_voucher_prize && <Badge variant="secondary">Có voucher</Badge>}
                </div>
                <p className="break-words text-xs text-gray-500">
                  {c.creator_name} · {formatVnDateTime(c.start_time)} → {formatVnDateTime(c.end_time)}
                  {c.submitted_at ? ` · gửi duyệt ${formatVnDateTime(c.submitted_at)}` : ""}
                </p>
              </div>
              <Link
                href={`/admin/contests/${c.id}`}
                className="shrink-0 rounded-lg bg-gray-100 px-3 py-1.5 text-center text-sm font-medium hover:bg-gray-200 dark:bg-gray-800"
              >
                Xem và xử lý
              </Link>
            </li>
          ))}
        </ul>
        {data && data.total_pages > 1 && (
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>
              Trang {page}/{data.total_pages} — {data.total_count} cuộc thi
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded border px-3 py-1 disabled:opacity-40 dark:border-gray-700"
              >
                Trước
              </button>
              <button
                disabled={page >= data.total_pages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded border px-3 py-1 disabled:opacity-40 dark:border-gray-700"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </QueryState>
    </div>
  );
}
