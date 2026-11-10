"use client";

import { useMemo, useState } from "react";
import { useOrganizationsPage } from "@/hooks/queries/use-admin";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { Can } from "@/components/guards";
import { PERMISSIONS } from "@/lib/permissions";
import { QueryState } from "@/components/common/query-state";
import { PaginationControls } from "@/components/common/pagination-controls";
import { Input } from "@/components/ui/input";
import { OrgMembersPanel } from "@/components/org-members/org-members-panel";
import { useAuthStore } from "@/stores/auth.store";
import { cn } from "@/lib/utils";
import type { Organization } from "@/services/organization.service";
import { EMPTY_ORG_FORM, OrganizationForm, type OrgFormState } from "./_components/organization-form";
import { OrganizationDetail, OrgStatusBadge } from "./_components/organization-detail";
import { DeleteOrganizationDialog } from "./_components/delete-organization-dialog";

const PAGE_SIZE = 20;

/**
 * Quản lý tổ chức. QA-C-06: có tìm kiếm + phân trang theo `total` của API (trước chỉ đọc trang đầu 20 tổ chức và
 * cắt im lặng), thẻ có mô tả/trạng thái, và chi tiết + thành viên nằm cùng cột phải để không phải cuộn xuống dưới
 * cả danh sách mới thấy.
 */
export default function OrganizationsPage() {
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);
  const debouncedKeyword = useDebouncedValue(keyword.trim(), 300);
  const orgs = useOrganizationsPage({ keyword: debouncedKeyword, page, pageSize: PAGE_SIZE });
  const data = useMemo(() => orgs.data?.organizations ?? [], [orgs.data]);

  const currentUserId = useAuthStore((s) => s.user?.id);
  const [form, setForm] = useState<OrgFormState>(EMPTY_ORG_FORM);
  // Giữ cả object (không chỉ id) để chi tiết vẫn hiện khi đổi trang/tìm kiếm làm tổ chức đang chọn rời khỏi trang.
  const [selected, setSelected] = useState<Organization | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Organization | null>(null);
  const selectedFresh = (selected && data.find((o) => o.id === selected.id)) || selected;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Quản lý tổ chức</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tạo, sửa, xoá tổ chức; chọn một tổ chức để xem chi tiết và quản lý thành viên.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
        <div className="space-y-3">
          <Input
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value);
              setPage(1);
            }}
            placeholder="Tìm tổ chức theo tên"
            aria-label="Tìm tổ chức"
          />
          {orgs.data && (
            <p className="text-xs text-muted-foreground" aria-live="polite">
              {orgs.data.total} tổ chức{debouncedKeyword ? ` khớp "${debouncedKeyword}"` : ""}
            </p>
          )}
          <QueryState
            isLoading={orgs.isLoading}
            isError={orgs.isError}
            error={orgs.error}
            isEmpty={data.length === 0}
            emptyTitle={debouncedKeyword ? "Không có tổ chức phù hợp" : "Chưa có tổ chức nào"}
            emptyDescription={debouncedKeyword ? "Thử từ khoá khác." : "Tạo tổ chức đầu tiên bằng form bên cạnh."}
            onRetry={() => orgs.refetch()}
          >
            {data.map((org) => (
              <div
                key={org.id}
                className={cn(
                  "rounded-xl border border-border bg-card p-4 shadow-sm",
                  selectedFresh?.id === org.id && "ring-2 ring-primary-300"
                )}
              >
                <button
                  className="w-full text-left"
                  aria-pressed={selectedFresh?.id === org.id}
                  onClick={() => setSelected(org)}
                >
                  <span className="flex items-start justify-between gap-2">
                    <span className="min-w-0 font-semibold text-foreground">{org.name}</span>
                    <OrgStatusBadge status={org.status} />
                  </span>
                  <span className="mt-1 line-clamp-2 block text-sm text-muted-foreground">
                    {org.description?.trim() || "Chưa có mô tả"}
                  </span>
                </button>
                <Can permission={PERMISSIONS.MANAGE_ORGANIZATIONS}>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => setForm({ id: org.id, name: org.name, description: org.description ?? "" })}
                      className="rounded bg-primary-100 px-3 py-1 text-xs font-medium text-primary-700"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => setConfirmDelete(org)}
                      className="rounded bg-red-100 px-3 py-1 text-xs font-medium text-red-700"
                    >
                      Xoá
                    </button>
                  </div>
                </Can>
              </div>
            ))}
          </QueryState>
          <PaginationControls page={page} totalCount={orgs.data?.total ?? 0} pageSize={PAGE_SIZE} onPageChange={setPage} />
        </div>

        <div className="min-w-0 space-y-4">
          <Can permission={PERMISSIONS.MANAGE_ORGANIZATIONS}>
            <OrganizationForm form={form} onChange={setForm} />
          </Can>

          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <h2 className="text-base font-semibold text-foreground">Chi tiết tổ chức</h2>
            {selectedFresh ? (
              <OrganizationDetail org={selectedFresh} />
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">Chọn một tổ chức để xem chi tiết và thành viên.</p>
            )}
          </div>

          {selectedFresh && (
            <section
              aria-label={`Thành viên của ${selectedFresh.name}`}
              className="rounded-xl border border-border bg-card p-4 shadow-sm"
            >
              <OrgMembersPanel key={selectedFresh.id} orgId={selectedFresh.id} canAddMember currentUserId={currentUserId} />
            </section>
          )}
        </div>
      </div>

      <DeleteOrganizationDialog
        org={confirmDelete}
        currentUserId={currentUserId}
        onClose={() => setConfirmDelete(null)}
        onDeleted={(id) => {
          if (selected?.id === id) setSelected(null);
          if (form.id === id) setForm(EMPTY_ORG_FORM);
        }}
      />
    </div>
  );
}
