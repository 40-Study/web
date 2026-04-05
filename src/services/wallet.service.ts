/**
 * Wallet service — user wallet balance and transaction history
 */

import { api } from "@/lib/api-client";

// ─── Types ───────────────────────────────────────────────────────────────────

export type TransactionType = "purchase" | "refund" | "reward" | "withdrawal";
export type TransactionStatus = "pending" | "completed" | "failed" | "cancelled";

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
  status: TransactionStatus;
  payment_method?: string;
  description: string;
  created_at: string;
  paid_at?: string;
}

export interface WalletTransactionListResponse {
  transactions: WalletTransaction[];
  total: number;
  page: number;
  limit: number;
}

export interface WalletTransactionParams {
  page?: number;
  limit?: number;
}

type ApiResponse<T> = { message: string; data: T };

// ─── Service ─────────────────────────────────────────────────────────────────

export const walletService = {
  /** GET /wallet/me — current user's wallet summary */
  getWallet: () =>
    api
      .get<ApiResponse<WalletResponse>>("/wallet/me")
      .then((r) => r.data.data),

  /** GET /wallet/transactions — paginated transaction history */
  getTransactions: (params?: WalletTransactionParams) =>
    api
      .get<ApiResponse<WalletTransactionListResponse>>("/wallet/transactions", { params })
      .then((r) => r.data.data),
};
