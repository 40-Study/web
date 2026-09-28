/**
 * Permission service
 * Endpoints: /permissions
 */

import { api } from "@/lib/api-client";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface Permission {
  id: string;
  name: string;
  description?: string;
  category?: string;
  created_at?: string;
}

type R<T> = { message: string; data: T };

// ─── Service ────────────────────────────────────────────────────────────────

// Backend mặc định page_size=20 (cap 100 — permission_service.go GetAllPermissions), trong khi hệ
// thống hiện có 23 quyền. Trang phân quyền cần TOÀN BỘ danh sách để hiển thị đúng và để tick
// checkbox khi gán quyền cho role — không phân trang UI, chỉ xin đủ trong 1 lần (page_size=100
// đủ dư cho quy mô hiện tại; nếu số quyền vượt 100 cần đổi sang phân trang thật).
const MAX_PAGE_SIZE = 100;

export const permissionService = {
  /** GET /permissions?page_size=100 — lấy đủ, không bị cắt 20/tổng như UI cũ */
  getAll: () =>
    api
      .get<R<{ permissions: Permission[]; total: number }>>("/permissions", {
        params: { page_size: MAX_PAGE_SIZE },
      })
      .then((r) => r.data.data.permissions),

  /** GET /permissions/:id */
  getById: (id: string) =>
    api.get<R<Permission>>(`/permissions/${id}`).then((r) => r.data.data),

  /** PUT /permissions/:id */
  update: (id: string, data: { description: string }) =>
    api.put<R<Permission>>(`/permissions/${id}`, data).then((r) => r.data.data),
};
