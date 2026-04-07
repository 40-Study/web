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
};
