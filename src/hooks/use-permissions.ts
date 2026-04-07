"use client";

/**
 * Hooks for permission queries and creation
 */

import { useQuery } from "@tanstack/react-query";
import { permissionService } from "@/services/permission.service";

export const permissionKeys = {
  all: ["permissions"] as const,
  list: () => [...permissionKeys.all, "list"] as const,
  detail: (id: string) => [...permissionKeys.all, "detail", id] as const,
};

/** List all permissions */
export function usePermissions() {
  return useQuery({
    queryKey: permissionKeys.list(),
    queryFn: permissionService.getAll,
    staleTime: 10 * 60 * 1000,
  });
}

/** Fetch a single permission by ID */
export function usePermission(id: string) {
  return useQuery({
    queryKey: permissionKeys.detail(id),
    queryFn: () => permissionService.getById(id),
    enabled: !!id,
  });
}
