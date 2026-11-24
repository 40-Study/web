import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { contestService } from "@/services/contest.service";
import { contestErrorMessage } from "@/lib/contest/contest-errors";
import { useAuthStore } from "@/stores/auth.store";
import type { ContestListParams, ContestSubmitRequest } from "@/types/contest";

export const contestKeys = {
  all: ["contests"] as const,
  list: (params?: ContestListParams) => [...contestKeys.all, "list", params ?? {}] as const,
  mine: (params?: { page?: number; limit?: number }) => [...contestKeys.all, "mine", params ?? {}] as const,
  detail: (slug: string) => [...contestKeys.all, "detail", slug] as const,
  leaderboard: (contestId: string, page: number) => [...contestKeys.all, "leaderboard", contestId, page] as const,
  myResult: (contestId: string) => [...contestKeys.all, "my-result", contestId] as const,
  certificate: (contestId: string) => [...contestKeys.all, "certificate", contestId] as const,
};

export function usePublicContests(params?: ContestListParams) {
  return useQuery({
    queryKey: contestKeys.list(params),
    queryFn: () => contestService.list(params),
  });
}

export function useMyContests(params?: { page?: number; limit?: number }, enabled = true) {
  return useQuery({
    queryKey: contestKeys.mine(params),
    queryFn: () => contestService.listMine(params),
    enabled,
  });
}

/**
 * `GET /contests/:slug` là OptionalAuth: `viewer` (can_join, join_block_reason) phụ thuộc người gọi. Tải lại trang
 * thì token chưa có cho tới khi phiên khôi phục xong; lượt tải đầu khi đó trả `LOGIN_REQUIRED` và nút hiện
 * "Đăng nhập để tham gia" vài giây rồi mới đổi (QA5 S5-10). Nên chờ phiên có kết quả (báo `isLoading` trong lúc
 * chờ), và đưa trạng thái đăng nhập vào khoá để đăng nhập/xuất phiên tải lại đúng `viewer`.
 */
export function useContestDetail(slug: string) {
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const sessionStatus = useAuthStore((s) => s.sessionStatus);
  const sessionResolved = hasHydrated && sessionStatus !== "checking";
  // Round 2 (QA5 S5 item 6): `viewer` còn phụ thuộc NGƯỜI và VAI đang dùng (học viên tham gia được, giảng viên thì không),
  // nên khoá phải mang cả hai: đổi vai/đổi tài khoản không được dùng lại `viewer` của lượt trước trong 30 s staleTime.
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const activeRole = useAuthStore((s) => s.activeRole);
  const query = useQuery({
    queryKey: [...contestKeys.detail(slug), sessionStatus === "authenticated", userId, activeRole],
    queryFn: () => contestService.getBySlug(slug),
    enabled: !!slug && sessionResolved,
  });
  return sessionResolved ? query : { ...query, isLoading: true };
}

export function useContestLeaderboard(contestId: string | undefined, page: number, enabled: boolean) {
  return useQuery({
    queryKey: contestKeys.leaderboard(contestId ?? "", page),
    queryFn: () => contestService.leaderboard(contestId as string, { page, limit: 20 }),
    enabled: !!contestId && enabled,
  });
}

export function useContestMyResult(contestId: string | undefined) {
  return useQuery({
    queryKey: contestKeys.myResult(contestId ?? ""),
    queryFn: () => contestService.myResult(contestId as string),
    enabled: !!contestId,
    retry: false,
  });
}

export function useContestCertificate(contestId: string | undefined) {
  return useQuery({
    queryKey: contestKeys.certificate(contestId ?? ""),
    queryFn: () => contestService.certificate(contestId as string),
    enabled: !!contestId,
    retry: false,
  });
}

// `onError` riêng ở mọi mutation dưới đây THAY toast mặc định của queryClient (vốn in message
// tiếng Anh của backend): thông điệp lấy theo `code` qua contestErrorMessage.

export function useJoinContest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (contestId: string) => contestService.join(contestId),
    onSuccess: () => toast.success("Đăng ký cuộc thi thành công"),
    onError: (error) => toast.error("Không thể đăng ký", { description: contestErrorMessage(error) }),
    onSettled: () => qc.invalidateQueries({ queryKey: contestKeys.all }),
  });
}

/**
 * Lỗi hiển thị thành khối thông báo trên trang làm bài (không toast). Bắt đầu xong thì làm mới chi tiết cuộc thi:
 * trạng thái lượt làm đổi NOT_STARTED -> IN_PROGRESS, cache cũ (staleTime 30 s) sẽ cho bước "Sẵn sàng làm bài?"
 * hiện lại khi quay lại trong lúc đồng hồ server đã chạy (review #124, S11).
 */
export function useStartContest(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (contestId: string) => contestService.start(contestId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: contestKeys.detail(slug) });
    },
    onError: () => undefined,
  });
}

export function useSubmitContest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ contestId, body }: { contestId: string; body: ContestSubmitRequest }) =>
      contestService.submit(contestId, body),
    onError: (error) => toast.error("Nộp bài không thành công", { description: contestErrorMessage(error) }),
    onSettled: () => qc.invalidateQueries({ queryKey: contestKeys.all }),
  });
}
