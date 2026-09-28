/**
 * React Query hooks for wallet and transaction history
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  walletService,
  type PaginationParams,
  type UpdateBankInfoRequest,
  type WithdrawalListParams,
  type AdminWithdrawalListParams,
} from "@/services/wallet.service";
import { ApiError } from "@/lib/errors";

export const walletKeys = {
  all: ["wallet"] as const,
  summary: () => [...walletKeys.all, "summary"] as const,
  transactions: (params?: PaginationParams) =>
    [...walletKeys.all, "transactions", params] as const,
  teacherSummary: () => [...walletKeys.all, "teacher-summary"] as const,
  teacherTransactions: (params?: PaginationParams) =>
    [...walletKeys.all, "teacher-transactions", params] as const,
};

export const withdrawalKeys = {
  all: ["withdrawals"] as const,
  mine: (params?: WithdrawalListParams) => [...withdrawalKeys.all, "mine", params ?? {}] as const,
  admin: (params?: AdminWithdrawalListParams) => [...withdrawalKeys.all, "admin", params ?? {}] as const,
  adminNegativeBalances: () => [...withdrawalKeys.all, "admin-negative-balances"] as const,
};

// Mã lỗi máy đọc (snake_case) mà nhóm endpoint rút tiền trả ở field `error` — xem
// withdrawal-contract.md. Interceptor DÙNG CHUNG của api-client.ts (extractErrorMessage) lại ưu
// tiên ĐÚNG field `error` khi dựng message cho ApiError bị ném ra, nên `ApiError.message` ở các
// endpoint này THỰC RA là mã lỗi (vd "below_minimum"), không phải câu tiếng Việt — khác quy ước
// auth/cart/review handler mà interceptor giả định (nơi field `error` mới là message chi tiết).
// Dịch qua bảng dưới; mã lạ hoặc message thật (vd "Validation failed") thì giữ nguyên.
const WITHDRAWAL_ERROR_MESSAGES: Record<string, string> = {
  invalid_amount: "Số tiền không hợp lệ.",
  below_minimum: "Số tiền rút chưa đạt mức tối thiểu cho phép.",
  bank_info_required: "Vui lòng thêm thông tin tài khoản ngân hàng trước khi rút tiền.",
  negative_balance: "Số dư của bạn đang âm — tạm thời không thể rút tới khi có doanh thu mới bù lại.",
  insufficient_balance: "Số tiền rút vượt quá số dư khả dụng.",
  withdrawal_already_open: "Bạn đang có một yêu cầu rút tiền chưa xử lý xong.",
  teacher_profile_required: "Chỉ giảng viên mới có thể yêu cầu rút tiền.",
  invalid_id: "Mã yêu cầu rút tiền không hợp lệ.",
  withdrawal_not_found: "Không tìm thấy yêu cầu rút tiền này.",
  invalid_status_transition: "Yêu cầu này đã được xử lý trước đó, vui lòng tải lại trang.",
  // Lỗi validate trả {message:"Validation failed", errors:[...]} (không có field `error`).
  "Validation failed": "Dữ liệu gửi lên không hợp lệ.",
};

export function withdrawalErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof ApiError)) return fallback;
  const mapped = WITHDRAWAL_ERROR_MESSAGES[error.message];
  if (mapped) return mapped;
  // 403 từ middleware quyền trả message tiếng Anh kỹ thuật ("forbidden: missing permission ...").
  if (error.status === 403) return "Bạn không có quyền thực hiện thao tác này.";
  return fallback;
}

// ─── Student hooks ──────────────────────────────────────────────────────────

/** Current user's wallet summary (student/buyer) */
export function useWallet() {
  return useQuery({
    queryKey: walletKeys.summary(),
    queryFn: () => walletService.getWallet(),
  });
}

/** Paginated transaction history (student/buyer) */
export function useWalletTransactions(params?: PaginationParams) {
  return useQuery({
    queryKey: walletKeys.transactions(params),
    queryFn: () => walletService.getTransactions(params),
  });
}

// ─── Teacher hooks ──────────────────────────────────────────────────────────

/** Teacher's earnings wallet summary */
export function useTeacherWallet() {
  return useQuery({
    queryKey: walletKeys.teacherSummary(),
    queryFn: () => walletService.getTeacherWallet(),
  });
}

/** Teacher's paginated transaction history */
export function useTeacherTransactions(params?: PaginationParams) {
  return useQuery({
    queryKey: walletKeys.teacherTransactions(params),
    queryFn: () => walletService.getTeacherTransactions(params),
  });
}

/** Mutation to update teacher bank info */
export function useUpdateBankInfo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateBankInfoRequest) => walletService.updateBankInfo(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: walletKeys.teacherSummary() });
    },
  });
}

// ─── Teacher withdrawal hooks ───────────────────────────────────────────────

/** GET /wallet/teacher/withdrawals — lịch sử yêu cầu rút của chính giáo viên. */
export function useMyWithdrawals(params?: WithdrawalListParams) {
  return useQuery({
    queryKey: withdrawalKeys.mine(params),
    queryFn: () => walletService.getMyWithdrawals(params),
  });
}

/** POST /wallet/teacher/withdrawals — tạo yêu cầu rút tiền. */
export function useCreateWithdrawal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (amount: number) => walletService.createWithdrawal(amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: walletKeys.teacherSummary() });
      queryClient.invalidateQueries({ queryKey: withdrawalKeys.all });
      toast.success("Đã gửi yêu cầu rút tiền, chờ admin duyệt.");
    },
    onError: (error) => {
      toast.error(withdrawalErrorMessage(error, "Không thể tạo yêu cầu rút tiền, thử lại sau."));
    },
  });
}

/**
 * POST /wallet/teacher/withdrawals/:id/cancel — giảng viên tự huỷ yêu cầu còn pending (QA vòng 2,
 * Q2). Làm mới cả ví: huỷ xong số dư khả dụng được trả lại và nút "Yêu cầu rút tiền" mở lại.
 */
export function useCancelWithdrawal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => walletService.cancelMyWithdrawal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: walletKeys.teacherSummary() });
      queryClient.invalidateQueries({ queryKey: withdrawalKeys.all });
      toast.success("Đã huỷ yêu cầu rút tiền. Số dư đã được trả lại.");
    },
    onError: (error) => {
      // Admin vừa duyệt/từ chối cùng lúc -> 409: làm mới để giáo viên thấy trạng thái thật.
      queryClient.invalidateQueries({ queryKey: withdrawalKeys.all });
      queryClient.invalidateQueries({ queryKey: walletKeys.teacherSummary() });
      toast.error(withdrawalErrorMessage(error, "Không thể huỷ yêu cầu rút tiền, thử lại sau."));
    },
  });
}

// ─── Admin withdrawal hooks (quyền WALLET_WITHDRAWALS_MANAGE) ──────────────

/** GET /admin/withdrawals — toàn bộ yêu cầu rút trên hệ thống. */
export function useAdminWithdrawals(params?: AdminWithdrawalListParams) {
  return useQuery({
    queryKey: withdrawalKeys.admin(params),
    queryFn: () => walletService.adminListWithdrawals(params),
  });
}

/** GET /admin/withdrawals/negative-balances — giáo viên đang có số dư âm. */
export function useAdminNegativeBalances() {
  return useQuery({
    queryKey: withdrawalKeys.adminNegativeBalances(),
    queryFn: () => walletService.adminNegativeBalances(),
  });
}

/** POST /admin/withdrawals/:id/approve */
export function useAdminApproveWithdrawal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => walletService.adminApproveWithdrawal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: withdrawalKeys.all });
      toast.success("Đã duyệt yêu cầu rút tiền");
    },
    onError: (error) => {
      toast.error(withdrawalErrorMessage(error, "Không thể duyệt yêu cầu này, thử lại sau."));
    },
  });
}

/** POST /admin/withdrawals/:id/reject — reason bắt buộc. */
export function useAdminRejectWithdrawal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      walletService.adminRejectWithdrawal(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: withdrawalKeys.all });
      toast.success("Đã từ chối yêu cầu rút tiền");
    },
    onError: (error) => {
      toast.error(withdrawalErrorMessage(error, "Không thể từ chối yêu cầu này, thử lại sau."));
    },
  });
}

/** POST /admin/withdrawals/:id/mark-completed — mã giao dịch ngân hàng bắt buộc. */
export function useAdminMarkWithdrawalCompleted() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, transactionId }: { id: string; transactionId: string }) =>
      walletService.adminMarkWithdrawalCompleted(id, transactionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: withdrawalKeys.all });
      toast.success("Đã đánh dấu chuyển khoản thành công");
    },
    onError: (error) => {
      toast.error(withdrawalErrorMessage(error, "Không thể cập nhật trạng thái, thử lại sau."));
    },
  });
}
