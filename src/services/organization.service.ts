/**
 * Organization service
 * Endpoints: /organizations
 */

import { api } from "@/lib/api-client";
import { ApiError } from "@/lib/errors";

/** Code backend trả ở 404 của user-lookup khi email không thuộc người dùng nào đang hoạt động. */
export const USER_NOT_FOUND_CODE = "USER_NOT_FOUND";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface Organization {
  id: string;
  name: string;
  description?: string;
  /** "active" mặc định (model Organization); giá trị khác hiện nguyên văn qua nhãn trạng thái. */
  status?: string;
  code?: string;
  logo?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateOrgDTO {
  name: string;
  description?: string;
}

export interface UpdateOrgDTO {
  name?: string;
  description?: string;
}

/** Kết quả tra người dùng theo email trong phạm vi tổ chức (user-lookup). */
export interface OrgUserLookup {
  id: string;
  user_name: string;
  full_name: string | null;
  avatar_url: string | null;
  email: string;
}

/** Lớp thuộc tổ chức (một dòng danh sách). */
export interface OrgClass {
  id: string;
  name: string;
  description?: string;
  status: string;
  course_id?: string;
  max_students?: number;
  teacher_count: number;
  student_count: number;
  created_at?: string;
}

/** Một dòng thành viên = một lần gán vai trò tổ chức (user_organization_roles); một người có thể có nhiều dòng. */
export interface OrgMemberRow {
  id: string;
  user_id: string;
  role_id: string;
  status: string;
  granted_at?: string;
  user?: { id: string; user_name: string; full_name?: string; email: string; avatar_url?: string };
  role?: { id: string; name: string };
}

/** Một lần gán vai trò đang hiệu lực: `id` là mã dòng gán (dùng để gỡ), `role_id` là mã vai trò (dùng để gán). */
export interface OrgMemberAssignment {
  id: string;
  role_id: string;
  name: string;
}

/** Thành viên đã gộp theo người, để hiện tên/email và tất cả vai trò đang giữ. */
export interface OrgMember {
  user_id: string;
  name: string;
  email: string;
  avatar_url?: string;
  roles: string[];
  /** Cùng thứ tự với `roles`; cần `id` để gỡ từng vai trò (DELETE /users/:userId/org-roles/:id). */
  assignments: OrgMemberAssignment[];
  granted_at?: string;
}

/** Gộp các dòng gán vai trò thành từng người; chỉ tính vai trò đang active. */
export function groupOrgMembers(rows: OrgMemberRow[]): OrgMember[] {
  const byUser = new Map<string, OrgMember>();
  for (const row of rows) {
    if (row.status !== "active") continue;
    const existing = byUser.get(row.user_id);
    const roleName = row.role?.name;
    const assignment = { id: row.id, role_id: row.role_id, name: roleName ?? "" };
    if (existing) {
      if (roleName && !existing.roles.includes(roleName)) {
        existing.roles.push(roleName);
        existing.assignments.push(assignment);
      }
      continue;
    }
    byUser.set(row.user_id, {
      user_id: row.user_id,
      name: row.user?.full_name?.trim() || row.user?.user_name || "Người dùng không rõ",
      email: row.user?.email ?? "",
      avatar_url: row.user?.avatar_url,
      roles: roleName ? [roleName] : [],
      assignments: roleName ? [assignment] : [],
      granted_at: row.granted_at,
    });
  }
  return Array.from(byUser.values());
}

type R<T> = { message: string; data: T };

/** Số dòng gán vai trò xin mỗi lần khi tải thành viên tổ chức. */
const ORG_MEMBERS_PAGE_SIZE = 100;
/** Trần số trang khi backend không trả `total` (phải đi từng trang); vượt trần thì báo lỗi thay vì cắt im lặng. */
const ORG_MEMBERS_MAX_PAGES = 100;

// ─── Service ────────────────────────────────────────────────────────────────

export const organizationService = {
  /** POST /organizations */
  create: (data: CreateOrgDTO) =>
    api.post<R<Organization>>("/organizations", data).then((r) => r.data.data),

  /** GET /organizations */
  list: () =>
    api.get<R<{ organizations: Organization[] }>>("/organizations").then((r) => r.data.data.organizations),

  /** GET /organizations?keyword=&page=&page_size= — một trang kèm tổng số (backend giới hạn page_size ≤ 100). */
  search: (params: { keyword?: string; page?: number; page_size?: number }) =>
    api
      .get<R<{ organizations: Organization[]; total: number; page: number; page_size: number }>>("/organizations", {
        params: { ...params, keyword: params.keyword?.trim() || undefined },
      })
      .then((r) => r.data.data),

  /** GET /organizations/:orgId */
  getById: (orgId: string) =>
    api.get<R<Organization>>(`/organizations/${orgId}`).then((r) => r.data.data),

  /** PUT /organizations/:orgId */
  update: (orgId: string, data: UpdateOrgDTO) =>
    api.put<R<Organization>>(`/organizations/${orgId}`, data).then((r) => r.data.data),

  /** DELETE /organizations/:orgId */
  delete: (orgId: string) =>
    api.delete<R<null>>(`/organizations/${orgId}`).then((r) => r.data),

  /**
   * GET /organizations/:orgId/user-lookup?email= (backend PR #144) — chủ tổ chức tìm ĐÚNG một người theo email
   * (khớp chính xác, không phân biệt hoa thường) để thêm vào tổ chức. Cần ORG_MEMBERS_MANAGE và active_org_id khớp
   * tổ chức. 404 USER_NOT_FOUND, 400 INVALID_EMAIL, 403 (không có code) khi thiếu quyền hoặc khác tổ chức.
   */
  lookupUserByEmail: async (orgId: string, email: string): Promise<OrgUserLookup> => {
    // Interceptor chung đổi mọi 404 thành NotFoundError và bỏ mất `code` của body, nên không phân biệt được
    // "không có người dùng" (USER_NOT_FOUND) với 404 khác (vd route chưa deploy). Nhận 404 về đây để đọc code.
    const res = await api.get<R<OrgUserLookup> & { code?: string }>(`/organizations/${orgId}/user-lookup`, {
      params: { email: email.trim() },
      validateStatus: (status) => (status >= 200 && status < 300) || status === 404,
    });
    if (res.status === 404) {
      throw res.data?.code === USER_NOT_FOUND_CODE
        ? new ApiError(404, USER_NOT_FOUND_CODE, res.data.message ?? "no active user with this email")
        : new ApiError(404, "NOT_FOUND", "Resource not found");
    }
    return res.data.data;
  },

  /**
   * GET /organizations/:orgId/members — mọi trang. QA6-A14: trước đây chỉ đọc trang đầu 100 dòng gán vai trò và bỏ
   * `total`, nên tổ chức lớn bị cắt im lặng và "Thành viên (N)" đếm thiếu. `total` đếm DÒNG GÁN VAI TRÒ (một người
   * nhiều vai chiếm nhiều dòng) nên kết quả vẫn được gộp theo người ở `groupOrgMembers`.
   */
  getMembers: async (orgId: string): Promise<OrgMember[]> => {
    const fetchPage = (page: number) =>
      api
        .get<R<{ user_organization_roles: OrgMemberRow[]; total: number; page_size?: number }>>(`/organizations/${orgId}/members`, {
          params: { page, page_size: ORG_MEMBERS_PAGE_SIZE, status: "active" },
        })
        .then((r) => r.data.data);

    const first = await fetchPage(1);
    const rows = [...first.user_organization_roles];
    // Q6 #132 L1: backend cũ/đổi không trả `total` mà trang đầu đã đầy -> không biết còn bao nhiêu. Đi từng trang tới khi gặp
    // trang chưa đầy, thay vì dừng ở trang đầu và cắt im lặng (đúng lỗi A14 từng sửa).
    if (typeof first.total !== "number") {
      // Q7 #134 L-7: "trang đầy" so với cỡ trang THẬT mà backend báo (`page_size`, nó có thể chặn trần thấp hơn 100 đã xin);
      // không báo thì mới dùng cỡ đã xin. So với 100 khi backend chặn ở 50 làm vòng dừng ngay sau trang đầu và cắt im lặng.
      const fullPage =
        typeof first.page_size === "number" && first.page_size > 0
          ? Math.min(first.page_size, ORG_MEMBERS_PAGE_SIZE)
          : ORG_MEMBERS_PAGE_SIZE;
      let last = first;
      for (let page = 2; last.user_organization_roles.length >= fullPage; page++) {
        if (page > ORG_MEMBERS_MAX_PAGES) {
          throw new Error(`Danh sách thành viên vượt ${ORG_MEMBERS_MAX_PAGES} trang mà máy chủ không trả tổng số; không thể tải đủ.`);
        }
        last = await fetchPage(page);
        rows.push(...last.user_organization_roles);
      }
      return groupOrgMembers(rows);
    }
    // Cỡ trang thật là số dòng backend trả (nó có thể chặn trần thấp hơn page_size đã xin).
    const pageSize = first.user_organization_roles.length;
    if (pageSize > 0 && first.total > pageSize) {
      const pageCount = Math.ceil(first.total / pageSize);
      const rest = await Promise.all(Array.from({ length: pageCount - 1 }, (_, i) => fetchPage(i + 2)));
      for (const page of rest) rows.push(...page.user_organization_roles);
    }
    return groupOrgMembers(rows);
  },

  /** GET /organizations/:orgId/classes — lớp thuộc tổ chức (chủ/quản trị tổ chức). */
  getClasses: (orgId: string, params: { page?: number; page_size?: number; keyword?: string; status?: string } = {}) =>
    api
      .get<R<{ classes: OrgClass[]; total: number; page: number; page_size: number }>>(
        `/organizations/${orgId}/classes`,
        { params: { page: 1, page_size: 20, ...params } }
      )
      .then((r) => r.data.data),
};
