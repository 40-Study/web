/**
 * React Query hooks for admin operations
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { organizationService } from "@/services/organization.service";
import { roleService } from "@/services/role.service";

// Query Keys
export const adminKeys = {
  all: ["admin"] as const,
  orgs: () => [...adminKeys.all, "organizations"] as const,
  org: (id: string) => [...adminKeys.all, "organization", id] as const,
  orgMembers: (id: string) => [...adminKeys.all, "org-members", id] as const,
  orgRoles: (orgId: string) => [...adminKeys.all, "org-roles", orgId] as const,
  systemRoles: () => [...adminKeys.all, "system-roles"] as const,
  permissions: () => [...adminKeys.all, "permissions"] as const,
};

// Organizations
export function useOrganizations() {
  return useQuery({
    queryKey: adminKeys.orgs(),
    queryFn: organizationService.list,
  });
}

export function useOrganization(id: string) {
  return useQuery({
    queryKey: adminKeys.org(id),
    queryFn: () => organizationService.getById(id),
    enabled: !!id,
  });
}

export function useCreateOrganization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: organizationService.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.orgs() });
      toast.success("Tạo tổ chức thành công");
    },
  });
}

export function useUpdateOrganization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof organizationService.update>[1] }) =>
      organizationService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.orgs() });
      toast.success("Cập nhật thành công");
    },
  });
}

export function useDeleteOrganization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: organizationService.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.orgs() });
      toast.success("Xóa tổ chức thành công");
    },
  });
}

export function useOrgMembers(orgId: string) {
  return useQuery({
    queryKey: adminKeys.orgMembers(orgId),
    queryFn: () => organizationService.getMembers(orgId),
    enabled: !!orgId,
  });
}

// Roles
export function useOrgRoles(orgId: string) {
  return useQuery({
    queryKey: adminKeys.orgRoles(orgId),
    queryFn: () => roleService.listOrgRoles(orgId),
    enabled: !!orgId,
  });
}

export function useSystemRoles() {
  return useQuery({
    queryKey: adminKeys.systemRoles(),
    queryFn: roleService.listSystemRoles,
  });
}

export function usePermissions() {
  return useQuery({
    queryKey: adminKeys.permissions(),
    queryFn: roleService.listPermissions,
  });
}

export function useCreateOrgRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orgId, data }: { orgId: string; data: Parameters<typeof roleService.createOrgRole>[1] }) =>
      roleService.createOrgRole(orgId, data),
    onSuccess: (_, { orgId }) => {
      qc.invalidateQueries({ queryKey: adminKeys.orgRoles(orgId) });
      toast.success("Tạo vai trò thành công");
    },
  });
}

export function useAssignOrgRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, orgId, roleId }: { userId: string; orgId: string; roleId: string }) =>
      roleService.assignOrgRole(userId, orgId, roleId),
    onSuccess: (_, { orgId }) => {
      qc.invalidateQueries({ queryKey: adminKeys.orgMembers(orgId) });
      toast.success("Gán vai trò thành công");
    },
  });
}
