"use client";

/**
 * Hooks for role CRUD operations (org-level roles)
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { roleService } from "@/services/role.service";
import type { CreateRoleData, UpdateRoleData } from "@/types/role";

export const roleKeys = {
  all: ["roles"] as const,
  list: (orgId?: string) => [...roleKeys.all, "list", orgId ?? "global"] as const,
  detail: (id: string) => [...roleKeys.all, "detail", id] as const,
};

/** List roles, optionally scoped to an organization */
export function useRoles(organizationId?: string) {
  return useQuery({
    queryKey: roleKeys.list(organizationId),
    queryFn: () => roleService.listOrgRoles(),
  });
}

/** Fetch a single role by ID */
export function useRole(id: string) {
  return useQuery({
    queryKey: roleKeys.detail(id),
    queryFn: () => roleService.getOrgRole(id),
    enabled: !!id,
  });
}

/** Create a new role */
export function useCreateRole(organizationId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRoleData) => roleService.createOrgRole(data as { name: string; organization_id: string; description?: string }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: roleKeys.list(organizationId) });
      toast.success("Tạo vai trò thành công");
    },
    onError: (err: Error) => {
      toast.error("Tạo vai trò thất bại", { description: err.message });
    },
  });
}

/** Update an existing role */
export function useUpdateRole(organizationId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRoleData }) =>
      roleService.updateOrgRole(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: roleKeys.list(organizationId) });
      qc.invalidateQueries({ queryKey: roleKeys.detail(id) });
      toast.success("Cập nhật vai trò thành công");
    },
    onError: (err: Error) => {
      toast.error("Cập nhật thất bại", { description: err.message });
    },
  });
}

/** Delete a role */
export function useDeleteRole(organizationId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => roleService.deleteOrgRole(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: roleKeys.list(organizationId) });
      toast.success("Xóa vai trò thành công");
    },
    onError: (err: Error) => {
      toast.error("Xóa vai trò thất bại", { description: err.message });
    },
  });
}
