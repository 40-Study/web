"use client";

/**
 * Hooks for system-level role management (super-admin)
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { systemRoleService } from "@/services/system-role.service";
import type { CreateRoleData, UpdateRoleData } from "@/types/role";

export const systemRoleKeys = {
  all: ["system-roles"] as const,
  list: () => [...systemRoleKeys.all, "list"] as const,
};

/** List all system roles */
export function useSystemRoles() {
  return useQuery({
    queryKey: systemRoleKeys.list(),
    queryFn: systemRoleService.getSystemRoles,
  });
}

/** Create a new system role */
export function useCreateSystemRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRoleData) => systemRoleService.createSystemRole(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: systemRoleKeys.list() });
      toast.success("Tạo vai trò hệ thống thành công");
    },
    onError: (err: Error) => {
      toast.error("Tạo vai trò hệ thống thất bại", { description: err.message });
    },
  });
}

/** Update a system role */
export function useUpdateSystemRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRoleData }) =>
      systemRoleService.updateSystemRole(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: systemRoleKeys.list() });
      toast.success("Cập nhật vai trò hệ thống thành công");
    },
    onError: (err: Error) => {
      toast.error("Cập nhật thất bại", { description: err.message });
    },
  });
}

/** Delete a system role */
export function useDeleteSystemRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => systemRoleService.deleteSystemRole(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: systemRoleKeys.list() });
      toast.success("Xóa vai trò hệ thống thành công");
    },
    onError: (err: Error) => {
      toast.error("Xóa vai trò hệ thống thất bại", { description: err.message });
    },
  });
}
