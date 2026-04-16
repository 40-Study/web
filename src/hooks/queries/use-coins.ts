import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { coinService } from "@/services/coin.service";
import { useAuthStore } from "@/stores/auth.store";

export const coinKeys = {
  all: ["coins"] as const,
  wallet: () => [...coinKeys.all, "wallet"] as const,
  transactions: (params?: Record<string, unknown>) =>
    [...coinKeys.all, "transactions", params] as const,
  packages: () => [...coinKeys.all, "packages"] as const,
  purchases: () => [...coinKeys.all, "purchases"] as const,
};

export function useCoinWallet() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: coinKeys.wallet(),
    queryFn: () => coinService.getWallet(),
    enabled: isAuthenticated,
  });
}

export function useCoinTransactions(params?: { type?: string; page?: number; limit?: number }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: coinKeys.transactions(params),
    queryFn: () => coinService.getTransactions(params),
    enabled: isAuthenticated,
  });
}

export function useCoinPackages() {
  return useQuery({
    queryKey: coinKeys.packages(),
    queryFn: () => coinService.listPackages(),
  });
}

export function usePurchaseCoins() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ packageId, paymentMethod }: { packageId: string; paymentMethod: string }) =>
      coinService.createPurchase(packageId, paymentMethod),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: coinKeys.all });
      toast.success("Tạo đơn mua xu thành công");
    },
    onError: () => toast.error("Không thể mua xu"),
  });
}

export function useVerifyPurchase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (purchaseId: string) => coinService.verifyPurchase(purchaseId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: coinKeys.all });
      toast.success("Xu đã được cộng vào ví");
    },
    onError: () => toast.error("Không thể xác thực đơn mua"),
  });
}

export function useSendCoinGift() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      receiverId,
      amount,
      message,
    }: {
      receiverId: string;
      amount: number;
      message?: string;
    }) => coinService.sendGift(receiverId, amount, message),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: coinKeys.wallet() });
      qc.invalidateQueries({ queryKey: coinKeys.transactions() });
      toast.success("Tặng xu thành công");
    },
    onError: () => toast.error("Không thể tặng xu"),
  });
}
