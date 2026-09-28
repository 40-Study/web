/**
 * React Query hooks — quản lý cuộc thi (giảng viên) và duyệt/chốt (admin). Lane W2.
 * Mọi lỗi đi qua `contestErrorMessage` để toast luôn là tiếng Việt (403/404/409 có câu riêng).
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { contestErrorMessage } from "@/lib/contest-manage/errors";
import { contestKeys } from "@/hooks/queries/use-contests";
import { contestManageService, type ContestManageListParams } from "@/services/contest-manage.service";
import { voucherService } from "@/services/voucher.service";
import type {
  ContestPrizeInput,
  ContestUpsertRequest,
} from "@/types/contest";

export const contestManageKeys = {
  all: ["contest-manage"] as const,
  mine: (params?: ContestManageListParams) =>
    [...contestManageKeys.all, "mine", params ?? {}] as const,
  admin: (params?: ContestManageListParams) =>
    [...contestManageKeys.all, "admin", params ?? {}] as const,
  detail: (id: string) => [...contestManageKeys.all, "detail", id] as const,
  participants: (id: string, page: number) =>
    [...contestManageKeys.all, "participants", id, page] as const,
  quizOptions: () => [...contestManageKeys.all, "quiz-options"] as const,
};

export function useMyManagedContests(params?: ContestManageListParams) {
  return useQuery({
    queryKey: contestManageKeys.mine(params),
    queryFn: () => contestManageService.listMine(params),
  });
}

export function useAdminContests(params?: ContestManageListParams) {
  return useQuery({
    queryKey: contestManageKeys.admin(params),
    queryFn: () => contestManageService.adminList(params),
  });
}

export function useManagedContest(id: string | undefined) {
  return useQuery({
    queryKey: contestManageKeys.detail(id ?? ""),
    queryFn: () => contestManageService.getManage(id as string),
    enabled: !!id,
  });
}

export function useContestParticipants(id: string | undefined, page: number) {
  return useQuery({
    queryKey: contestManageKeys.participants(id ?? "", page),
    queryFn: () => contestManageService.participants(id as string, { page, limit: 20 }),
    enabled: !!id,
  });
}

export function useContestQuizOptions() {
  return useQuery({
    queryKey: contestManageKeys.quizOptions(),
    queryFn: () => contestManageService.quizOptions(),
  });
}

/**
 * Voucher còn bật để admin gắn vào giải (GET /vouchers, quyền admin). Backend vẫn kiểm lại lúc
 * duyệt/sửa giải/chốt (409 CONTEST_VOUCHER_UNAVAILABLE nếu voucher bị tắt/hết hạn sau đó).
 */
export function useContestVoucherOptions(enabled: boolean) {
  return useQuery({
    queryKey: [...contestManageKeys.all, "voucher-options"] as const,
    queryFn: () => voucherService.getAllVouchers({ limit: 100 }),
    select: (res) => res.vouchers.filter((v) => v.is_active),
    enabled,
  });
}

/** Mọi thay đổi trạng thái đều ảnh hưởng danh sách + chi tiết → xoá cache cả nhánh. */
function useInvalidateContests() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: contestManageKeys.all });
    // Duyệt/huỷ/chốt đổi cả dữ liệu công khai (danh sách, chi tiết, BXH) của lane W1.
    qc.invalidateQueries({ queryKey: contestKeys.all });
  };
}

export function useCreateContest() {
  const invalidate = useInvalidateContests();
  return useMutation({
    mutationFn: (body: ContestUpsertRequest) => contestManageService.create(body),
    onSuccess: () => {
      invalidate();
      toast.success("Đã tạo cuộc thi ở trạng thái bản nháp");
    },
    onError: (error) => toast.error(contestErrorMessage(error, "Không thể tạo cuộc thi, thử lại sau.")),
  });
}

export function useUpdateContest() {
  const invalidate = useInvalidateContests();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: ContestUpsertRequest }) =>
      contestManageService.update(id, body),
    onSuccess: () => {
      invalidate();
      toast.success("Đã lưu thay đổi");
    },
    onError: (error) => toast.error(contestErrorMessage(error, "Không thể lưu cuộc thi, thử lại sau.")),
  });
}

export function useDeleteContest() {
  const invalidate = useInvalidateContests();
  return useMutation({
    mutationFn: (id: string) => contestManageService.remove(id),
    onSuccess: () => {
      invalidate();
      toast.success("Đã xoá cuộc thi");
    },
    onError: (error) => toast.error(contestErrorMessage(error, "Không thể xoá cuộc thi, thử lại sau.")),
  });
}

export function useSubmitContestReview() {
  const invalidate = useInvalidateContests();
  return useMutation({
    mutationFn: (id: string) => contestManageService.submitReview(id),
    onSuccess: () => {
      invalidate();
      toast.success("Đã gửi cuộc thi cho quản trị viên duyệt");
    },
    onError: (error) => toast.error(contestErrorMessage(error, "Không thể gửi duyệt, thử lại sau.")),
  });
}

export function useApproveContest() {
  const invalidate = useInvalidateContests();
  return useMutation({
    mutationFn: ({ id, prizes }: { id: string; prizes?: ContestPrizeInput[] }) =>
      contestManageService.approve(id, prizes),
    onSuccess: () => {
      invalidate();
      toast.success("Đã duyệt và công bố cuộc thi");
    },
    onError: (error) => toast.error(contestErrorMessage(error, "Không thể duyệt cuộc thi, thử lại sau.")),
  });
}

export function useRejectContest() {
  const invalidate = useInvalidateContests();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      contestManageService.reject(id, reason),
    onSuccess: () => {
      invalidate();
      toast.success("Đã từ chối cuộc thi");
    },
    onError: (error) => toast.error(contestErrorMessage(error, "Không thể từ chối cuộc thi, thử lại sau.")),
  });
}

export function useCancelContest() {
  const invalidate = useInvalidateContests();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      contestManageService.cancel(id, reason),
    onSuccess: () => {
      invalidate();
      toast.success("Đã huỷ cuộc thi");
    },
    onError: (error) => toast.error(contestErrorMessage(error, "Không thể huỷ cuộc thi, thử lại sau.")),
  });
}

export function useUpdateContestPrizes() {
  const invalidate = useInvalidateContests();
  return useMutation({
    mutationFn: ({ id, prizes }: { id: string; prizes: ContestPrizeInput[] }) =>
      contestManageService.updatePrizes(id, prizes),
    onSuccess: () => {
      invalidate();
      toast.success("Đã cập nhật cơ cấu giải");
    },
    onError: (error) => toast.error(contestErrorMessage(error, "Không thể cập nhật giải, thử lại sau.")),
  });
}

export function useFinalizeContest() {
  const invalidate = useInvalidateContests();
  return useMutation({
    mutationFn: (id: string) => contestManageService.finalize(id),
    onSuccess: (result) => {
      invalidate();
      if (result.already_finalized) {
        toast.info("Cuộc thi đã được chốt trước đó, không phát thưởng thêm.");
      } else {
        toast.success(
          `Đã chốt kết quả: xếp hạng ${result.ranked_count} người, phát ${result.certificate_count} chứng nhận và ${result.voucher_count} voucher.`
        );
      }
    },
    onError: (error) => toast.error(contestErrorMessage(error, "Không thể chốt kết quả, thử lại sau.")),
  });
}
