"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { EnrollableStudent } from "@/services/class.service";

const DEBOUNCE_MS = 300;

/**
 * Ô tìm người (giảng viên / học viên) rồi bấm "Thêm": thay cho việc bắt người dùng dán id thô.
 * `search` trả danh sách ứng viên theo từ khoá; ứng viên đã nằm trong lớp do backend loại hoặc do `excludeIds`.
 */
export function PersonPicker({
  queryKey,
  search,
  onPick,
  isPicking,
  placeholder,
  addLabel,
  emptyText,
  excludeIds = [],
}: {
  /** Khoá cache; phải khác nhau giữa các ô (giảng viên / học viên / từng lớp). */
  queryKey: readonly unknown[];
  search: (keyword: string) => Promise<EnrollableStudent[]>;
  onPick: (id: string) => void;
  isPicking?: boolean;
  placeholder: string;
  addLabel: string;
  emptyText: string;
  excludeIds?: string[];
}) {
  const [keyword, setKeyword] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(keyword.trim()), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [keyword]);

  const { data = [], isFetching, isError, refetch } = useQuery({
    queryKey: [...queryKey, debounced],
    queryFn: () => search(debounced),
  });
  const candidates = data.filter((c) => !excludeIds.includes(c.id));

  return (
    <div className="space-y-2 rounded-xl border border-border p-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          className="pl-9"
        />
      </div>
      {isError ? (
        <p className="text-sm text-destructive" role="alert">
          Không tải được danh sách.{" "}
          <button type="button" className="underline" onClick={() => refetch()}>
            Thử lại
          </button>
        </p>
      ) : isFetching && candidates.length === 0 ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Đang tìm...
        </p>
      ) : candidates.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <ul className="max-h-48 divide-y divide-border overflow-y-auto">
          {candidates.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-2 py-1.5">
              <span className="truncate text-sm">{c.name}</span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isPicking}
                onClick={() => onPick(c.id)}
                aria-label={`${addLabel} ${c.name}`}
              >
                <Plus className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
                {addLabel}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
