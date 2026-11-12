"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import { QueryState } from "@/components/common/query-state";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { PaginationControls } from "@/components/common/pagination-controls";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { getErrorMessage } from "@/lib/error-messages";
import { formatVnDateTime } from "@/lib/vn-datetime";
import { categoryService, type Tag } from "@/services/category.service";

const PAGE_SIZE = 20;
// Khớp validate backend CreateTagDTO/UpdateTagDTO (min=1, max=50).
const TAG_NAME_MAX = 50;
const tagKeys = { all: ["admin", "tags"] as const };

/**
 * Quản lý tag khoá học (QA-C-19): backend đã có CRUD /tags (quyền CATEGORIES_SYSTEM_MANAGE) nhưng khu admin chưa có
 * màn nào. Trang này liệt kê, tìm, tạo, đổi tên và xoá tag. Lỗi từ backend (tên trùng...) hiện ngay dưới form.
 */
export default function AdminTagsPage() {
  const qc = useQueryClient();
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);
  const debounced = useDebouncedValue(keyword.trim(), 300);
  const tags = useQuery({
    queryKey: [...tagKeys.all, debounced, page],
    queryFn: () => categoryService.searchTags({ keyword: debounced, page, page_size: PAGE_SIZE }),
    placeholderData: (prev) => prev,
  });

  const [name, setName] = useState("");
  const [editing, setEditing] = useState<Tag | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<Tag | null>(null);

  const save = useMutation({
    mutationFn: (value: string) => (editing ? categoryService.updateTag(editing.id, value) : categoryService.createTag(value)),
    onSuccess: () => {
      toast.success(editing ? "Đã đổi tên tag" : "Đã tạo tag");
      setName("");
      setEditing(null);
      qc.invalidateQueries({ queryKey: tagKeys.all });
    },
    onError: (e) => setFormError(getErrorMessage(e, "Không lưu được tag, thử lại sau.")),
  });
  const remove = useMutation({
    mutationFn: (id: string) => categoryService.deleteTag(id),
    onSuccess: () => {
      toast.success("Đã xoá tag");
      setToDelete(null);
      qc.invalidateQueries({ queryKey: tagKeys.all });
    },
    onError: (e) => toast.error(getErrorMessage(e, "Không xoá được tag, thử lại sau.")),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = name.trim();
    if (!value) {
      setFormError("Nhập tên tag.");
      return;
    }
    setFormError(null);
    save.mutate(value);
  };

  const items = tags.data?.tags ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Tag khoá học</h1>
        <p className="mt-1 text-sm text-muted-foreground">Nhãn để giảng viên gắn vào khoá học và học viên lọc khi tìm khoá.</p>
      </div>

      <form onSubmit={submit} className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <h2 className="text-base font-semibold text-foreground">{editing ? `Đổi tên tag "${editing.name}"` : "Tạo tag mới"}</h2>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Input
            value={name}
            maxLength={TAG_NAME_MAX}
            onChange={(e) => {
              setName(e.target.value);
              if (formError) setFormError(null);
            }}
            placeholder="Tên tag, ví dụ: Python"
            aria-label="Tên tag"
            aria-invalid={formError ? true : undefined}
          />
          <div className="flex gap-2">
            <Button type="submit" isLoading={save.isPending} disabled={save.isPending}>
              {editing ? "Lưu" : "Tạo tag"}
            </Button>
            {editing && (
              <Button type="button" variant="outline" onClick={() => (setEditing(null), setName(""), setFormError(null))}>
                Huỷ sửa
              </Button>
            )}
          </div>
        </div>
        {formError && (
          <p role="alert" className="mt-2 text-xs text-red-600 dark:text-red-400">
            {formError}
          </p>
        )}
      </form>

      <div className="space-y-3">
        <Input
          value={keyword}
          onChange={(e) => (setKeyword(e.target.value), setPage(1))}
          placeholder="Tìm tag"
          aria-label="Tìm tag"
          className="sm:w-72"
        />
        <QueryState
          isLoading={tags.isLoading}
          isError={tags.isError}
          error={tags.error}
          onRetry={() => tags.refetch()}
          isEmpty={items.length === 0}
          emptyTitle={debounced ? "Không có tag phù hợp" : "Chưa có tag nào"}
        >
          <ul className="divide-y divide-border rounded-xl border border-border bg-card">
            {items.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground">{t.name}</p>
                  {t.created_at && <p className="text-xs text-muted-foreground">Tạo lúc {formatVnDateTime(t.created_at)}</p>}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  aria-label={`Đổi tên tag ${t.name}`}
                  onClick={() => (setEditing(t), setName(t.name), setFormError(null))}
                >
                  <Pencil className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
                  Đổi tên
                </Button>
                <Button size="sm" variant="destructiveGhost" aria-label={`Xoá tag ${t.name}`} onClick={() => setToDelete(t)}>
                  <Trash2 className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
                  Xoá
                </Button>
              </li>
            ))}
          </ul>
        </QueryState>
        <PaginationControls page={page} totalCount={tags.data?.total ?? 0} pageSize={PAGE_SIZE} onPageChange={setPage} />
      </div>

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title={`Xoá tag "${toDelete?.name ?? ""}"?`}
        description="Tag bị xoá hẳn khỏi hệ thống. Hành động này không thể hoàn tác."
        confirmLabel="Xoá tag"
        destructive
        pending={remove.isPending}
        onConfirm={() => toDelete && remove.mutate(toDelete.id)}
      />
    </div>
  );
}
