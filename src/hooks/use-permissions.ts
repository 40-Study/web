"use client";

/**
 * Hooks for permission queries and creation
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { permissionService } from "@/services/permission.service";
import type { CreatePermissionData } from "@/types/permission";

export const permissionKeys = {
  all: ["permissions"] as const,
  list: () => [...permissionKeys.all, "list"] as const,
  detail: (id: string) => [...permissionKeys.all, "detail", id] as const,
};

/** List all permissions */
export function usePermissions() {
  return useQuery({
    queryKey: permissionKeys.list(),
    queryFn: permissionService.getPermissions,
    staleTime: 10 * 60 * 1000,
  });
}

/** Fetch a single permission by ID */
export function usePermission(id: string) {
  return useQuery({
    queryKey: permissionKeys.detail(id),
    queryFn: () => permissionService.getPermission(id),
    enabled: !!id,
  });
}

/** Create a new permission */
export function useCreatePermission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePermissionData) => permissionService.createPermission(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: permissionKeys.list() });
      toast.success("Tạo quyền thành công");
    },
    onError: (err: Error) => {
      toast.error("Tạo quyền thất bại", { description: err.message });
    },
  });
}
