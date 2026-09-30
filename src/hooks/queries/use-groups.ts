import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage, HAS_VIETNAMESE_DIACRITICS } from "@/lib/error-messages";
import {
  groupService,
  type CreateGroupDTO,
  type GroupMemberStatus,
  type InviteMembersResponse,
} from "@/services/group.service";

interface MembersParams {
  page?: number;
  limit?: number;
  status?: GroupMemberStatus;
}

export const groupKeys = {
  all: ["groups"] as const,
  list: (params?: Record<string, unknown>) => [...groupKeys.all, "list", params] as const,
  detail: (slug: string) => [...groupKeys.all, "detail", slug] as const,
  myJoined: () => [...groupKeys.all, "my-joined"] as const,
  myOwned: () => [...groupKeys.all, "my-owned"] as const,
  // Không thêm phần tử `undefined` khi thiếu params: invalidate theo tiền tố `members(id)` phải khớp
  // mọi biến thể (trang, trạng thái) — React Query so `undefined` với `{...}` là KHÔNG khớp.
  members: (id: string, params?: MembersParams) =>
    (params ? [...groupKeys.all, "members", id, params] : [...groupKeys.all, "members", id]) as readonly unknown[],
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

/** `enabled=false` để tab Thành viên không gọi API khi người xem không được phép (nhóm PRIVATE/SECRET). */
export function useGroupMembers(id: string, params?: MembersParams, enabled = true) {
  return useQuery({
    queryKey: groupKeys.members(id, params),
    queryFn: () => groupService.listMembers(id, params),
    enabled: !!id && enabled,
  });
}

/** Danh sách bị cấm: backend chỉ trả cho OWNER/ADMIN (403 với người khác) nên caller phải truyền `enabled`. */
export function useBannedMembers(id: string, enabled: boolean, params?: { page?: number; limit?: number }) {
  return useGroupMembers(id, { ...params, status: "BANNED" }, enabled);
}

export function useGroupJoinRequests(id: string, enabled = true) {
  return useQuery({
    queryKey: groupKeys.requests(id),
    queryFn: () => groupService.listJoinRequests(id),
    enabled: !!id && enabled,
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
    onError: (err) => toast.error(getErrorMessage(err, "Không thể tạo nhóm")),
  });
}

export function useUpdateGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateGroupDTO> }) => groupService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: groupKeys.all });
      toast.success("Đã lưu cài đặt nhóm");
    },
    onError: (err) => toast.error(getErrorMessage(err, "Không thể lưu cài đặt nhóm")),
  });
}

export function useDeleteGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => groupService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: groupKeys.all });
      toast.success("Đã xoá nhóm");
    },
    onError: (err) => toast.error(getErrorMessage(err, "Không thể xoá nhóm")),
  });
}

export function useJoinGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, message }: { id: string; message?: string }) =>
      groupService.join(id, message),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: groupKeys.all });
      // Nhóm PUBLIC vào luôn; PRIVATE chỉ tạo yêu cầu — câu toast phải nói đúng điều đã xảy ra.
      toast.success(result?.status === "joined" ? "Bạn đã tham gia nhóm" : "Đã gửi yêu cầu tham gia");
    },
    // Đọc `code` (GROUP_FULL, GROUP_BANNED, GROUP_ALREADY_MEMBER, GROUP_JOIN_REQUEST_EXISTS) qua bảng lỗi chung.
    onError: (err) => toast.error(getErrorMessage(err, "Không thể tham gia nhóm")),
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

/**
 * Toast sau khi mời. Câu do web dựng từ SỐ LƯỢNG thật (không tin `res.message` của backend, có thể là
 * tiếng Anh); riêng 403 toàn NOT_ALLOWED giữ thông điệp tiếng Việt của backend nếu có.
 */
export function inviteToast(res: InviteMembersResponse): { level: "success" | "warning" | "error"; text: string } {
  const invited = res.data.invited.length;
  const rejected = res.data.rejected.length;
  if (res.allRejected) {
    const backend = res.message?.trim() ?? "";
    return {
      level: "error",
      text: HAS_VIETNAMESE_DIACRITICS.test(backend) ? backend : "Bạn chỉ có thể mời người có quan hệ hợp lệ với bạn",
    };
  }
  if (isPartialInvite(res)) {
    return {
      level: "warning",
      text: invited > 0 ? `Đã mời ${invited} người, ${rejected} người chưa mời được` : `Không mời được ai (${rejected} người bị từ chối)`,
    };
  }
  return { level: "success", text: invited > 0 ? `Đã mời ${invited} người` : "Không có ai mới để mời" };
}

export function useInviteGroupMembers() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, userIds }: { groupId: string; userIds: string[] }) =>
      groupService.inviteMembers(groupId, userIds),
    onSuccess: (res, { groupId }) => {
      qc.invalidateQueries({ queryKey: groupKeys.members(groupId) });
      qc.invalidateQueries({ queryKey: [...groupKeys.all, "detail"] });
      const { level, text } = inviteToast(res);
      toast[level](text);
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
    onError: (err) => toast.error(getErrorMessage(err, "Không thể rời nhóm")),
  });
}

/** Mutation quản lý thành viên: cùng một khuôn (gọi API, làm mới danh sách + chi tiết nhóm, toast). */
function useMemberMutation<V extends { groupId: string }>(
  mutationFn: (vars: V) => Promise<unknown>,
  successMessage: string,
  errorFallback: string
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (_, { groupId }) => {
      // Danh sách thành viên/bị cấm đổi, và `member_count` trong chi tiết nhóm cũng đổi.
      qc.invalidateQueries({ queryKey: groupKeys.members(groupId) });
      qc.invalidateQueries({ queryKey: [...groupKeys.all, "detail"] });
      toast.success(successMessage);
    },
    onError: (err) => toast.error(getErrorMessage(err, errorFallback)),
  });
}

export function useUpdateMemberRole() {
  return useMemberMutation(
    ({ groupId, userId, role }: { groupId: string; userId: string; role: string }) =>
      groupService.updateMemberRole(groupId, userId, role),
    "Đã đổi vai trò thành viên",
    "Không thể đổi vai trò"
  );
}

export function useRemoveMember() {
  return useMemberMutation(
    ({ groupId, userId }: { groupId: string; userId: string }) => groupService.removeMember(groupId, userId),
    "Đã gỡ thành viên khỏi nhóm",
    "Không thể gỡ thành viên"
  );
}

export function useBanMember() {
  return useMemberMutation(
    ({ groupId, userId }: { groupId: string; userId: string }) => groupService.banMember(groupId, userId),
    "Đã cấm thành viên",
    "Không thể cấm thành viên"
  );
}

export function useUnbanMember() {
  return useMemberMutation(
    ({ groupId, userId }: { groupId: string; userId: string }) => groupService.unbanMember(groupId, userId),
    "Đã bỏ cấm thành viên",
    "Không thể bỏ cấm thành viên"
  );
}

export function useApproveJoinRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, requestId }: { groupId: string; requestId: string }) =>
      groupService.approveRequest(groupId, requestId),
    onSuccess: (_, { groupId }) => {
      qc.invalidateQueries({ queryKey: groupKeys.requests(groupId) });
      qc.invalidateQueries({ queryKey: groupKeys.members(groupId) });
      qc.invalidateQueries({ queryKey: [...groupKeys.all, "detail"] });
      toast.success("Đã chấp nhận yêu cầu");
    },
    // GROUP_FULL / GROUP_ALREADY_MEMBER khi duyệt (contract §2): nói đúng lý do thay vì câu chung.
    onError: (err) => toast.error(getErrorMessage(err, "Không thể chấp nhận yêu cầu")),
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
    onError: (err) => toast.error(getErrorMessage(err, "Không thể từ chối yêu cầu")),
  });
}
