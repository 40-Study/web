/**
 * Wallet service — user wallet balance and transaction history
 */

import { api } from "@/lib/api-client";

// ─── Common Types ────────────────────────────────────────────────────────────

export type TransactionType = "income" | "expense";
export type TransactionStatus = "pending" | "completed" | "failed" | "cancelled" | "refunded";

export interface PaginationParams {
  page?: number;
  limit?: number;
  type?: string;
}

// ─── Student Types ───────────────────────────────────────────────────────────

export interface WalletResponse {
  user_id: string;
  total_spent: number;
  currency: string;
  order_count: number;
}

export interface WalletTransaction {
  id: string;
  order_number: string;
  amount: number;
  currency: string;
  type: TransactionType;
  status: string;
  payment_method?: string;
  description: string;
  created_at: string;
  paid_at?: string;
}

export interface WalletTransactionListResponse {
  transactions: WalletTransaction[];
  total_count: number;
  page: number;
  limit: number;
  total_pages: number;
}

// ─── Teacher Types ───────────────────────────────────────────────────────────

export interface TeacherWalletResponse {
  user_id: string;
  total_earnings: number;
  total_paid_out: number;
  available_balance: number;
  currency: string;
  order_count: number;
  bank_name?: string;
  bank_account_number?: string;
  bank_account_name?: string;
  // Phase 4 (rút tiền giảng viên). Tiền là NUMBER JSON: backend bật
  // decimal.MarshalJSONWithoutQuotes = true (cmd/api/main.go), giống các field tiền ở trên.
  // available_balance có thể ÂM (hoàn tiền sau khi giảng viên đã rút).
  /** Tổng các yêu cầu rút đang ở trạng thái pending + approved (chưa hoàn tất). */
  pending_withdrawal: number;
  /** Mức rút tối thiểu (cấu hình WITHDRAWAL_MIN_AMOUNT ở backend, mặc định 100.000đ). */
  min_withdrawal_amount: number;
  /** true khi đang có 1 yêu cầu rút pending/approved — chỉ cho phép 1 yêu cầu mở tại 1 thời điểm. */
  has_open_withdrawal: boolean;
}

export interface TeacherTransaction {
  order_id: string;
  order_number: string;
  course_name: string;
  course_id: string;
  buyer_name: string;
  amount: number;
  currency: string;
  type: TransactionType;
  status: string;
  payment_method?: string;
  created_at: string;
  paid_at?: string;
}

export interface TeacherTransactionListResponse {
  transactions: TeacherTransaction[];
  total_count: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface UpdateBankInfoRequest {
  bank_name: string;
  bank_account_number: string;
  bank_account_name: string;
}

// ─── Withdrawal types (Phase 4 — xem withdrawal-contract.md, SSOT chung backend + web) ────────

export type WithdrawalStatus = "pending" | "approved" | "rejected" | "completed";

/** amount là number JSON (decimal.MarshalJSONWithoutQuotes ở backend). */
export interface WithdrawalItem {
  id: string;
  amount: number;
  currency: string;
  status: WithdrawalStatus;
  rejection_reason: string | null;
  transaction_id: string | null;
  bank_name: string | null;
  bank_account_number: string | null;
  bank_account_name: string | null;
  created_at: string;
  processed_at: string | null;
}

export interface AdminWithdrawalItem extends WithdrawalItem {
  teacher_id: string;
  teacher_name: string;
  teacher_email: string;
  /** Số dư khả dụng hiện tại của giảng viên — âm thì UI cảnh báo. */
  teacher_available_balance: number;
}

export interface WithdrawalListResponse<T = WithdrawalItem> {
  items: T[];
  total_count: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface WithdrawalListParams {
  status?: WithdrawalStatus | "";
  page?: number;
  limit?: number;
}

export interface AdminWithdrawalListParams extends WithdrawalListParams {
  teacher_id?: string;
}

export interface NegativeBalanceItem {
  teacher_id: string;
  teacher_name: string;
  teacher_email: string;
  available_balance: number;
}

export interface WithdrawalActionResult {
  id: string;
  status: WithdrawalStatus;
}

/** Envelope chuẩn `{message, data}` — CHỈ áp dụng cho nhóm endpoint rút tiền (khác
 * /wallet/teacher/me — endpoint đó trả object trực tiếp, không bọc envelope). */
type Envelope<T> = { message: string; data: T };

// ─── Service ─────────────────────────────────────────────────────────────────

export const walletService = {
  // Student endpoints
  getWallet: () =>
    api.get<WalletResponse>("/wallet/me").then((r) => r.data),

  getTransactions: (params?: PaginationParams) =>
    api
      .get<WalletTransactionListResponse>("/wallet/transactions", { params })
      .then((r) => r.data),

  // Teacher endpoints
  getTeacherWallet: () =>
    api.get<TeacherWalletResponse>("/wallet/teacher/me").then((r) => r.data),

  getTeacherTransactions: (params?: PaginationParams) =>
    api
      .get<TeacherTransactionListResponse>("/wallet/teacher/transactions", { params })
      .then((r) => r.data),

  updateBankInfo: (data: UpdateBankInfoRequest) =>
    api.put("/wallet/teacher/bank-info", data).then((r) => r.data),

  // ─── Teacher withdrawal endpoints ────────────────────────────────────────

  /** POST /wallet/teacher/withdrawals — tạo yêu cầu rút tiền. */
  createWithdrawal: (amount: number) =>
    api
      .post<Envelope<WithdrawalItem>>("/wallet/teacher/withdrawals", { amount })
      .then((r) => r.data.data),

  /** GET /wallet/teacher/withdrawals — lịch sử yêu cầu rút của CHÍNH giáo viên đang đăng nhập. */
  getMyWithdrawals: (params?: WithdrawalListParams) =>
    api
      .get<Envelope<WithdrawalListResponse>>("/wallet/teacher/withdrawals", { params })
      .then((r) => r.data.data),

  // ─── Admin withdrawal endpoints (quyền WALLET_WITHDRAWALS_MANAGE) ────────

  /** GET /admin/withdrawals — toàn bộ yêu cầu rút trên hệ thống, lọc theo status/teacher_id. */
  adminListWithdrawals: (params?: AdminWithdrawalListParams) =>
    api
      .get<Envelope<WithdrawalListResponse<AdminWithdrawalItem>>>("/admin/withdrawals", { params })
      .then((r) => r.data.data),

  /** GET /admin/withdrawals/negative-balances — giáo viên đang có số dư âm. */
  adminNegativeBalances: () =>
    api
      .get<Envelope<{ items: NegativeBalanceItem[] }>>("/admin/withdrawals/negative-balances")
      .then((r) => r.data.data.items),

  /** POST /admin/withdrawals/:id/approve — body rỗng. */
  adminApproveWithdrawal: (id: string) =>
    api
      .post<Envelope<WithdrawalActionResult>>(`/admin/withdrawals/${id}/approve`)
      .then((r) => r.data.data),

  /** POST /admin/withdrawals/:id/reject — reason bắt buộc, không rỗng. */
  adminRejectWithdrawal: (id: string, reason: string) =>
    api
      .post<Envelope<WithdrawalActionResult>>(`/admin/withdrawals/${id}/reject`, { reason })
      .then((r) => r.data.data),

  /** POST /admin/withdrawals/:id/mark-completed — mã giao dịch ngân hàng bắt buộc. */
  adminMarkWithdrawalCompleted: (id: string, transactionId: string) =>
    api
      .post<Envelope<WithdrawalActionResult>>(`/admin/withdrawals/${id}/mark-completed`, {
        transaction_id: transactionId,
      })
      .then((r) => r.data.data),
};
