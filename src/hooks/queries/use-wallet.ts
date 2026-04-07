/**
 * React Query hooks for wallet and transaction history
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  walletService,
  type PaginationParams,
  type UpdateBankInfoRequest,
} from "@/services/wallet.service";

export const walletKeys = {
  all: ["wallet"] as const,
  summary: () => [...walletKeys.all, "summary"] as const,
  transactions: (params?: PaginationParams) =>
    [...walletKeys.all, "transactions", params] as const,
  teacherSummary: () => [...walletKeys.all, "teacher-summary"] as const,
  teacherTransactions: (params?: PaginationParams) =>
    [...walletKeys.all, "teacher-transactions", params] as const,
};

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
