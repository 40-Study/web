/**
 * React Query hooks for wallet and transaction history
 */

import { useQuery } from "@tanstack/react-query";
import { walletService, type WalletTransactionParams } from "@/services/wallet.service";

export const walletKeys = {
  all: ["wallet"] as const,
  summary: () => [...walletKeys.all, "summary"] as const,
  transactions: (params?: WalletTransactionParams) =>
    [...walletKeys.all, "transactions", params] as const,
};

/** Current user's wallet summary */
export function useWallet() {
  return useQuery({
    queryKey: walletKeys.summary(),
    queryFn: () => walletService.getWallet(),
  });
}

/** Paginated transaction history */
export function useWalletTransactions(params?: WalletTransactionParams) {
  return useQuery({
    queryKey: walletKeys.transactions(params),
    queryFn: () => walletService.getTransactions(params),
  });
}
