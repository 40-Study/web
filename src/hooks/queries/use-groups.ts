import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/error-messages";
import { groupService, type CreateGroupDTO } from "@/services/group.service";

export const groupKeys = {
  all: ["groups"] as const,
  list: (params?: Record<string, unknown>) => [...groupKeys.all, "list", params] as const,
  detail: (slug: string) => [...groupKeys.all, "detail", slug] as const,
  myJoined: () => [...groupKeys.all, "my-joined"] as const,
  myOwned: () => [...groupKeys.all, "my-owned"] as const,
  members: (id: string) => [...groupKeys.all, "members", id] as const,
  requests: (id: string) => [...groupKeys.all, "requests", id] as const,
};

export function useGroups(params?: { keyword?: string; privacy?: string; page?: number }) {
  return useQuery({
    queryKey: groupKeys.list(params),
    queryFn: () => groupService.list(params),
  });
}

export function useGroup(slug: string) {
  return useQuery({
    queryKey: groupKeys.detail(slug),
    queryFn: () => groupService.getBySlug(slug),
    enabled: !!slug,
  });
}

export function useMyJoinedGroups() {
  return useQuery({
    queryKey: groupKeys.myJoined(),
    queryFn: () => groupService.getMyJoined(),
  });
}

export function useMyOwnedGroups() {
  return useQuery({
    queryKey: groupKeys.myOwned(),
    queryFn: () => groupService.getMyOwned(),
  });
}

export function useGroupMembers(id: string) {
  return useQuery({
    queryKey: groupKeys.members(id),
    queryFn: () => groupService.listMembers(id),
    enabled: !!id,
  });
}

export function useGroupJoinRequests(id: string) {
  return useQuery({
    queryKey: groupKeys.requests(id),
    queryFn: () => groupService.listJoinRequests(id),
    enabled: !!id,
  });
}

export function useCreateGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateGroupDTO) => groupService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: groupKeys.all });
      toast.success("Tạo nhóm thành công");
    },
    onError: () => toast.error("Không thể tạo nhóm"),
  });
}

export function useJoinGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, message }: { id: string; message?: string }) =>
      groupService.join(id, message),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: groupKeys.all });
      toast.success("Đã gửi yêu cầu tham gia");
    },
    onError: () => toast.error("Không thể tham gia nhóm"),
  });
}

/** Câu báo lỗi mời thành viên: giữ thông điệp tiếng Việt của backend (403 GROUP_INVITE_NOT_ALLOWED). */
export function inviteErrorMessage(err: unknown): string {
  return getErrorMessage(err, "Không thể mời thành viên");
}

/** Kết quả mời một phần (có người bị từ chối) cần cảnh báo, không phải thành công trơn. */
export function isPartialInvite(res: { data?: { rejected?: unknown[] } }): boolean {
  return (res.data?.rejected?.length ?? 0) > 0;
}

export function useInviteGroupMembers() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, userIds }: { groupId: string; userIds: string[] }) =>
      groupService.inviteMembers(groupId, userIds),
    onSuccess: (res, { groupId }) => {
      qc.invalidateQueries({ queryKey: groupKeys.members(groupId) });
      if (isPartialInvite(res)) {
        // Mời được một phần: báo rõ ai không được mời, dùng thông điệp của backend.
        toast.warning(res.message);
      } else {
        toast.success("Đã mời thành viên");
      }
    },
    // 403 GROUP_INVITE_NOT_ALLOWED mang thông điệp tiếng Việt của backend; getErrorMessage giữ nguyên.
    onError: (err) => toast.error(inviteErrorMessage(err)),
  });
}

export function useLeaveGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => groupService.leave(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: groupKeys.all });
      toast.success("Đã rời nhóm");
    },
    onError: () => toast.error("Không thể rời nhóm"),
  });
}

export function useApproveJoinRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, requestId }: { groupId: string; requestId: string }) =>
      groupService.approveRequest(groupId, requestId),
    onSuccess: (_, { groupId }) => {
      qc.invalidateQueries({ queryKey: groupKeys.requests(groupId) });
      qc.invalidateQueries({ queryKey: groupKeys.members(groupId) });
      toast.success("Đã chấp nhận yêu cầu");
    },
    onError: () => toast.error("Không thể chấp nhận yêu cầu"),
  });
}

export function useRejectJoinRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      groupId,
      requestId,
      reason,
    }: {
      groupId: string;
      requestId: string;
      reason?: string;
    }) => groupService.rejectRequest(groupId, requestId, reason),
    onSuccess: (_, { groupId }) => {
      qc.invalidateQueries({ queryKey: groupKeys.requests(groupId) });
      toast.success("Đã từ chối yêu cầu");
    },
    onError: () => toast.error("Không thể từ chối yêu cầu"),
  });
}
