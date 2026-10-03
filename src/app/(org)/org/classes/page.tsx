"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { QueryState } from "@/components/common/query-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useActiveOrgId, useOrgClasses } from "@/hooks/queries/use-org-area";
import { CLASS_STATUS_LABELS, getClassStatusLabel, getClassStatusVariant } from "@/lib/class-status";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;
const STATUS_FILTERS = [{ value: "", label: "Tất cả" }, ...Object.entries(CLASS_STATUS_LABELS).map(([value, label]) => ({ value, label }))];

function OrgClassesList() {
  const orgId = useActiveOrgId();
  const initialStatus = useSearchParams().get("status") ?? "";
  const [status, setStatus] = useState(initialStatus);
  const [keyword, setKeyword] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(keyword.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [keyword]);

  const { data, isLoading, isError, error, refetch, isFetching } = useOrgClasses(orgId, { keyword: debounced, status, page });
  const classes = data?.classes ?? [];
  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / PAGE_SIZE));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-heading text-xl font-semibold">Lớp học{data ? ` (${data.total})` : ""}</h2>
        <Input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Tìm theo tên lớp"
          aria-label="Tìm lớp học"
          className="w-full sm:w-72"
        />
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Lọc theo trạng thái">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value || "all"}
            type="button"
            aria-pressed={status === f.value}
            onClick={() => {
              setStatus(f.value);
              setPage(1);
            }}
            className={cn(
              "rounded-full border px-3 py-1 text-sm transition-colors",
              status === f.value ? "border-primary-600 bg-primary-50 text-primary-700" : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <QueryState
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={() => refetch()}
        isEmpty={classes.length === 0}
        emptyTitle={debounced || status ? "Không có lớp phù hợp" : "Tổ chức chưa có lớp nào"}
        emptyDescription={debounced || status ? "Thử đổi bộ lọc hoặc từ khoá." : "Lớp do giảng viên của tổ chức tạo sẽ hiện ở đây."}
      >
        <ul className={cn("divide-y divide-border rounded-2xl border border-border bg-card", isFetching && "opacity-70")}>
          {classes.map((c) => (
            <li key={c.id}>
              <Link href={`/org/classes/${c.id}`} className="flex flex-wrap items-center gap-3 p-4 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{c.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {c.student_count}
                    {c.max_students ? ` / ${c.max_students}` : ""} học viên · {c.teacher_count} giảng viên
                  </p>
                </div>
                <Badge variant={getClassStatusVariant(c.status)}>{getClassStatusLabel(c.status)}</Badge>
              </Link>
            </li>
          ))}
        </ul>
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 pt-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Trước
            </Button>
            <span className="text-sm text-muted-foreground">
              Trang {page} / {totalPages}
            </span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Sau
            </Button>
          </div>
        )}
      </QueryState>
    </div>
  );
}

export default function OrgClassesPage() {
  return (
    <Suspense fallback={null}>
      <OrgClassesList />
    </Suspense>
  );
}
