import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/error-messages";
import { friendService, type PageParams, type RequestDirection } from "@/services/friend.service";

/** Backend từ chối `q` ngắn hơn 3 ký tự; web chặn trước để khỏi tốn lượt (30 lượt/phút) cho câu sẽ bị từ chối. */
export const MIN_SEARCH_LENGTH = 3;
export const SEARCH_DEBOUNCE_MS = 400;
/** Chu kỳ làm mới số lời mời chờ (badge ở sidebar), cùng nhịp với `useUnreadCount`. */
export const FRIEND_SUMMARY_POLL_MS = 30_000;

export const friendKeys = {
  all: ["friends"] as const,
  list: (params?: PageParams & { keyword?: string }) => [...friendKeys.all, "list", params] as const,
  summary: () => [...friendKeys.all, "summary"] as const,
  requests: (direction: RequestDirection, params?: PageParams) =>
    [...friendKeys.all, "requests", direction, params] as const,
  search: (q: string) => [...friendKeys.all, "search", q] as const,
  relationship: (userId: string) => [...friendKeys.all, "relationship", userId] as const,
  blocks: (params?: PageParams) => [...friendKeys.all, "blocks", params] as const,
};

/**
 * `enabled` phải do nơi gọi truyền: mọi `/friends/*` chỉ dành cho STUDENT, vai khác gọi sẽ nhận 403
 * `FRIEND_ROLE_NOT_ALLOWED` — đừng để sidebar/hồ sơ của phụ huynh, giáo viên bắn request vô ích.
 */
export function useFriends(params?: PageParams & { keyword?: string }, enabled = true) {
  return useQuery({
    queryKey: friendKeys.list(params),
    queryFn: () => friendService.list(params),
    enabled,
  });
}

export function useFriendSummary(enabled = true) {
  return useQuery({
    queryKey: friendKeys.summary(),
    queryFn: () => friendService.summary(),
    refetchInterval: FRIEND_SUMMARY_POLL_MS,
    enabled,
  });
}

export function useFriendRequests(direction: RequestDirection, params?: PageParams, enabled = true) {
  return useQuery({
    queryKey: friendKeys.requests(direction, params),
    queryFn: () => friendService.requests({ direction, ...params }),
    enabled,
  });
}

/** Chỉ gọi khi đã đủ `MIN_SEARCH_LENGTH` ký tự (sau trim). */
export function useFriendSearch(q: string) {
  const term = q.trim();
  return useQuery({
    queryKey: friendKeys.search(term),
    queryFn: () => friendService.search(term),
    enabled: term.length >= MIN_SEARCH_LENGTH,
  });
}

export function useRelationship(userId: string, enabled = true) {
  return useQuery({
    queryKey: friendKeys.relationship(userId),
    queryFn: () => friendService.relationship(userId),
    enabled: !!userId && enabled,
    // 404 FRIEND_USER_NOT_FOUND (người kia không phải học viên): không phải lỗi tạm, đừng thử lại.
    retry: false,
  });
}

export function useBlocks(params?: PageParams, enabled = true) {
  return useQuery({
    queryKey: friendKeys.blocks(params),
    queryFn: () => friendService.blocks(params),
    enabled,
  });
}

/**
 * Khuôn chung cho mutation bạn bè: toast thành công, toast lỗi theo `code`, và LUÔN làm mới dữ liệu
 * (kể cả khi lỗi) — lỗi như FRIEND_REQUEST_NOT_PENDING nghĩa là màn hình đang cũ so với server.
 */
function useFriendMutation<V, R>(
  mutationFn: (vars: V) => Promise<R>,
  successMessage: string | ((result: R) => string),
  errorFallback: string
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (result) => {
      toast.success(typeof successMessage === "function" ? successMessage(result) : successMessage);
    },
    onError: (err) => toast.error(getErrorMessage(err, errorFallback)),
    onSettled: () => qc.invalidateQueries({ queryKey: friendKeys.all }),
  });
}

export function useSendFriendRequest() {
  return useFriendMutation(
    (userId: string) => friendService.sendRequest(userId),
    (r) => (r.status === "ACCEPTED" ? "Hai bạn đã trở thành bạn bè" : "Đã gửi lời mời kết bạn"),
    "Không thể gửi lời mời kết bạn"
  );
}

export function useAcceptFriendRequest() {
  return useFriendMutation(
    (requestId: string) => friendService.accept(requestId),
    "Đã chấp nhận lời mời kết bạn",
    "Không thể chấp nhận lời mời"
  );
}

export function useDeclineFriendRequest() {
  return useFriendMutation(
    (requestId: string) => friendService.decline(requestId),
    "Đã từ chối lời mời",
    "Không thể từ chối lời mời"
  );
}

export function useCancelFriendRequest() {
  return useFriendMutation(
    (requestId: string) => friendService.cancel(requestId),
    "Đã huỷ lời mời",
    "Không thể huỷ lời mời"
  );
}

export function useUnfriend() {
  return useFriendMutation(
    (userId: string) => friendService.unfriend(userId),
    "Đã huỷ kết bạn",
    "Không thể huỷ kết bạn"
  );
}

export function useBlockUser() {
  return useFriendMutation(
    (userId: string) => friendService.block(userId),
    "Đã chặn người dùng",
    "Không thể chặn người dùng"
  );
}

export function useUnblockUser() {
  return useFriendMutation(
    (userId: string) => friendService.unblock(userId),
    "Đã bỏ chặn",
    "Không thể bỏ chặn"
  );
}
