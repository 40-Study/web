import { useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { coinService, type CoinPurchase } from "@/services/coin.service";
import { useAuthStore } from "@/stores/auth.store";
import { ApiError } from "@/lib/errors";

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
    onSuccess: (data) => {
      // status="PENDING" KHÔNG phải lỗi — backend chưa thấy giao dịch ngân hàng
      // khớp mã, client cần poll lại (xem usePurchaseVerificationPolling).
      if (data.status === "COMPLETED") {
        qc.invalidateQueries({ queryKey: coinKeys.all });
        toast.success("Xu đã được cộng vào ví");
      }
    },
    onError: (error) => {
      const message =
        error instanceof ApiError && error.message ? error.message : "Không thể xác thực đơn mua";
      toast.error(message);
    },
  });
}

const VERIFY_POLL_INTERVAL_MS = 5_000;
const VERIFY_POLL_TIMEOUT_MS = 10 * 60 * 1000;

/**
 * Poll POST /coins/purchases/:id/verify mỗi 5s cho tới khi COMPLETED, lỗi
 * thật (vd "payment amount mismatch"), hoặc hết ~10 phút. status="PENDING"
 * không phải lỗi — tiếp tục poll, không hiển thị toast lỗi.
 */
export function usePurchaseVerificationPolling(purchaseId: string, enabled: boolean) {
  const qc = useQueryClient();
  // Mốc bắt đầu poll — ổn định trong suốt vòng đời hook (không đổi mỗi lần
  // refetch), dùng để tính hết hạn ~10 phút thay vì so sánh nhầm với thời
  // điểm fetch gần nhất (luôn ~0ms sau mỗi lần poll thành công).
  const startedAtRef = useRef<number | null>(null);
  if (enabled && startedAtRef.current === null) {
    startedAtRef.current = Date.now();
  }
  if (!enabled) {
    startedAtRef.current = null;
  }

  return useQuery({
    queryKey: [...coinKeys.all, "verify-poll", purchaseId],
    queryFn: async (): Promise<CoinPurchase> => {
      const result = await coinService.verifyPurchase(purchaseId);
      if (result.status === "COMPLETED") {
        qc.invalidateQueries({ queryKey: coinKeys.all });
      }
      return result;
    },
    enabled: enabled && !!purchaseId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === "COMPLETED" || status === "FAILED" || status === "REFUNDED") return false;
      const startedAt = startedAtRef.current ?? Date.now();
      if (Date.now() - startedAt > VERIFY_POLL_TIMEOUT_MS) return false;
      return VERIFY_POLL_INTERVAL_MS;
    },
    retry: false,
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
