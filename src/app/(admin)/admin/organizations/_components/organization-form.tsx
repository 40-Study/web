"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useCreateOrganization, useUpdateOrganization } from "@/hooks/queries/use-admin";

export type OrgFormState = { id?: string; name: string; description: string };

export const EMPTY_ORG_FORM: OrgFormState = { name: "", description: "" };

// Khớp validate backend CreateOrganizationDTO/UpdateOrganizationDTO (name min=2 max=100 sau trim, description max=500).
const ORG_NAME_MIN_LENGTH = 2;
const ORG_DESCRIPTION_MAX_LENGTH = 500;

interface OrganizationFormProps {
  form: OrgFormState;
  onChange: (form: OrgFormState) => void;
}

/** Form tạo/sửa tổ chức: tên + mô tả (QA-C-06: trước chỉ có ô tên dù API nhận cả mô tả). */
export function OrganizationForm({ form, onChange }: OrganizationFormProps) {
  const createOrg = useCreateOrganization();
  const updateOrg = useUpdateOrganization();
  const [nameError, setNameError] = useState<string | null>(null);
  const pending = createOrg.isPending || updateOrg.isPending;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // QA vòng 2 (G2/G8): "   " từng lọt qua `!form.name` và tạo tổ chức tên rỗng; ô trống thì bấm "Tạo" không phản
    // hồi. Trim + báo lỗi ngay trên form; backend vẫn validate lại.
    const name = form.name.trim();
    if (name.length < ORG_NAME_MIN_LENGTH) {
      setNameError(`Tên tổ chức phải có ít nhất ${ORG_NAME_MIN_LENGTH} ký tự (không tính khoảng trắng).`);
      return;
    }
    setNameError(null);
    const description = form.description.trim();
    // QA3-10: chỉ xoá form khi server nhận (onSuccess), để lỗi "Tên tổ chức đã tồn tại" không làm mất chữ đã gõ.
    const onSuccess = () => onChange(EMPTY_ORG_FORM);
    if (form.id) {
      // Sửa: luôn gửi description (kể cả rỗng) để xoá được mô tả cũ.
      updateOrg.mutate({ id: form.id, data: { name, description } }, { onSuccess });
    } else {
      createOrg.mutate(description ? { name, description } : { name }, { onSuccess });
    }
  };

  return (
    <form onSubmit={onSubmit} className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <h2 className="text-base font-semibold text-foreground">{form.id ? "Cập nhật tổ chức" : "Tạo tổ chức mới"}</h2>
      <div className="mt-3 space-y-2">
        <input
          placeholder="Tên tổ chức"
          aria-label="Tên tổ chức"
          aria-invalid={nameError ? true : undefined}
          value={form.name}
          maxLength={100}
          onChange={(e) => {
            onChange({ ...form, name: e.target.value });
            if (nameError) setNameError(null);
          }}
          className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
        />
        {nameError && (
          <p role="alert" className="text-xs text-red-600">
            {nameError}
          </p>
        )}
        <textarea
          placeholder="Mô tả ngắn (không bắt buộc)"
          aria-label="Mô tả tổ chức"
          value={form.description}
          maxLength={ORG_DESCRIPTION_MAX_LENGTH}
          rows={3}
          onChange={(e) => onChange({ ...form, description: e.target.value })}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
        <p className="text-right text-xs text-muted-foreground">
          {form.description.length}/{ORG_DESCRIPTION_MAX_LENGTH}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" size="sm" isLoading={pending} disabled={pending}>
            {form.id ? "Lưu" : "Tạo"}
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => onChange(EMPTY_ORG_FORM)}>
            {form.id ? "Huỷ sửa" : "Xoá nội dung đã nhập"}
          </Button>
        </div>
      </div>
    </form>
  );
}
