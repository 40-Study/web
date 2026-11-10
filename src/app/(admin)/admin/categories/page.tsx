"use client";

import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  useCategoryList,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from "@/hooks/queries/use-categories";
import {
  isUncertainOutcomeError,
  reconcileUncertainOutcome,
  UNCERTAIN_OUTCOME_TITLE,
  uncertainOutcomeDescription,
} from "@/lib/uncertain-mutation";
import type { Category } from "@/services/category.service";
import { QueryState } from "@/components/common/query-state";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";

// Danh mục khoá học: backend đã có CRUD đầy đủ (GET/POST/PUT/DELETE /api/categories) và hook
// react-query có sẵn ở src/hooks/queries/use-categories.ts (dùng cho trang này nguyên trạng,
// không viết lại) — chỉ THIẾU trang admin để dùng. Trang này lấp đúng chỗ thiếu đó.
//
// Ghi chú phạm vi (đã ghi trong báo cáo QA A-P0-2): POST/PUT/DELETE /api/categories hiện CHƯA có
// permission gate ở backend — mọi user đã đăng nhập gọi được, không riêng admin. Việc đó thuộc
// lane sửa backend, KHÔNG thuộc phạm vi lane web này. Trang admin này vẫn nằm sau RoleGuard
// (SYSTEM_ADMIN/ORG_OWNER) ở layout.

type CategoryFormState = {
  id?: string;
  name: string;
  description: string;
};

const emptyForm: CategoryFormState = { name: "", description: "" };

/** Khớp ràng buộc backend (tên bắt buộc); trả thông báo cụ thể thay vì để bấm mà không có phản hồi. */
function validateCategoryName(name: string): string | null {
  return name.trim() ? null : "Vui lòng nhập tên danh mục";
}

export default function AdminCategoriesPage() {
  const { data = [], isLoading, isError, refetch } = useCategoryList();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const [reconcilingDelete, setReconcilingDelete] = useState(false);
  const deleteBusy = deleteCategory.isPending || reconcilingDelete;

  const [form, setForm] = useState<CategoryFormState>(emptyForm);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);

  const selected = useMemo(() => data.find((c) => c.id === selectedId) || null, [data, selectedId]);
  const confirmDeleteCategory = useMemo(
    () => data.find((c) => c.id === confirmDeleteId) || null,
    [data, confirmDeleteId]
  );

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // B-15: tên rỗng trước đây bị bỏ qua im lặng (bấm "Tạo" không có phản hồi nào).
    const nameError = validateCategoryName(form.name);
    setNameError(nameError);
    if (nameError) return;
    const name = form.name.trim();

    if (form.id) {
      updateCategory.mutate(
        { id: form.id, data: { name, description: form.description || undefined } },
        { onSuccess: () => setForm(emptyForm) }
      );
    } else {
      createCategory.mutate(
        { name, description: form.description || undefined },
        { onSuccess: () => setForm(emptyForm) }
      );
    }
  };

  // QA-C-16: trước đây hộp thoại đóng NGAY khi bấm và không có trạng thái chờ; server chậm thì
  // danh mục vẫn nằm trên màn mà không một phản hồi nào. Giờ giữ hộp thoại kèm spinner tới khi có
  // kết quả; timeout thì tải lại danh sách và đối chiếu xem danh mục còn không.
  const confirmDelete = async () => {
    const id = confirmDeleteId;
    if (!id || deleteBusy) return;
    try {
      await deleteCategory.mutateAsync(id);
    } catch (error) {
      if (!isUncertainOutcomeError(error)) return; // lỗi dứt khoát: hook đã toast, giữ hộp thoại
      setReconcilingDelete(true);
      const result = await reconcileUncertainOutcome(async () => {
        const fresh = await refetch();
        if (fresh.isError) throw fresh.error; // server vẫn chậm: chưa kết luận được
        return !(fresh.data ?? []).some((c) => c.id === id);
      });
      setReconcilingDelete(false);
      if (result === "unconfirmed") {
        toast.warning(UNCERTAIN_OUTCOME_TITLE, { description: uncertainOutcomeDescription("xoá danh mục"), duration: 10_000 });
        return;
      }
      toast.success("Đã xoá danh mục", { description: "Máy chủ phản hồi chậm nhưng danh mục đã được xoá." });
    }
    if (selectedId === id) setSelectedId(null);
    setConfirmDeleteId(null);
  };

  const startEdit = (c: Category) => {
    setForm({ id: c.id, name: c.name, description: c.description || "" });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Danh mục khoá học</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Tạo, sửa, xoá danh mục dùng để phân loại khoá học.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
        <div className="space-y-3">
          <QueryState
            isLoading={isLoading}
            isError={isError}
            isEmpty={data.length === 0}
            emptyTitle="Chưa có danh mục nào"
            onRetry={() => refetch()}
          >
            {data.map((cat) => (
              <div
                key={cat.id}
                className={`rounded-xl bg-white p-4 shadow-sm ${selected?.id === cat.id ? "ring-2 ring-primary-200" : ""}`}
              >
                <button className="w-full text-left" onClick={() => setSelectedId(cat.id)}>
                  <h3 className="font-semibold text-gray-900">{cat.name}</h3>
                  <p className="text-sm text-gray-500">{cat.description || "Không có mô tả"}</p>
                  {cat.is_active === false && (
                    <span className="mt-1 inline-block rounded bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-500">
                      Đã ẩn
                    </span>
                  )}
                </button>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => startEdit(cat)}
                    className="rounded bg-primary-100 px-3 py-1 text-xs font-medium text-primary-700"
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(cat.id)}
                    className="rounded bg-red-100 px-3 py-1 text-xs font-medium text-red-700"
                  >
                    Xoá
                  </button>
                </div>
              </div>
            ))}
          </QueryState>
        </div>

        <div className="space-y-4">
          <form onSubmit={onSubmit} className="rounded-xl bg-white p-4 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900">
              {form.id ? "Cập nhật danh mục" : "Tạo danh mục mới"}
            </h2>
            <div className="mt-3 space-y-2">
              <input
                placeholder="Tên danh mục"
                aria-label="Tên danh mục"
                aria-invalid={nameError ? true : undefined}
                aria-describedby={nameError ? "category-name-error" : undefined}
                value={form.name}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, name: e.target.value }));
                  if (nameError) setNameError(null);
                }}
                className="h-10 w-full rounded border border-gray-200 px-3 text-sm"
              />
              {nameError && (
                <p id="category-name-error" role="alert" className="text-xs text-red-600">
                  {nameError}
                </p>
              )}
              <input
                placeholder="Mô tả (tuỳ chọn)"
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                className="h-10 w-full rounded border border-gray-200 px-3 text-sm"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={createCategory.isPending || updateCategory.isPending}
                  className="rounded bg-primary-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
                >
                  {form.id ? "Lưu" : "Tạo"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setForm(emptyForm);
                    setNameError(null);
                  }}
                  className="rounded bg-gray-100 px-3 py-2 text-sm font-medium"
                >
                  Xoá nội dung đã nhập
                </button>
              </div>
            </div>
          </form>

          <div className="rounded-xl bg-white p-4 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900">Chi tiết danh mục</h2>
            {selected ? (
              <div className="mt-3 space-y-2 text-sm">
                <p><span className="text-gray-500">ID:</span> {selected.id}</p>
                <p><span className="text-gray-500">Tên:</span> {selected.name}</p>
                <p><span className="text-gray-500">Mô tả:</span> {selected.description || "-"}</p>
                {selected.created_at && (
                  <p><span className="text-gray-500">Tạo lúc:</span> {new Date(selected.created_at).toLocaleString("vi-VN")}</p>
                )}
              </div>
            ) : (
              <p className="mt-2 text-sm text-gray-500">Chọn một danh mục để xem chi tiết.</p>
            )}
          </div>
        </div>
      </div>

      <Dialog open={!!confirmDeleteId} onOpenChange={(open) => !open && !deleteBusy && setConfirmDeleteId(null)}>
        <DialogContent>
          <DialogTitle>Xoá danh mục &quot;{confirmDeleteCategory?.name}&quot;?</DialogTitle>
          <DialogDescription>
            Hành động này không thể hoàn tác. Khoá học đang gắn danh mục này có thể bị ảnh hưởng.
          </DialogDescription>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeleteId(null)} disabled={deleteBusy}>
              Huỷ
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleteBusy}>
              {deleteBusy && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
              {reconcilingDelete ? "Đang kiểm tra lại…" : "Xoá danh mục"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
