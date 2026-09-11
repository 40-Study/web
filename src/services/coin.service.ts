import { api } from "@/lib/api-client";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface CoinWallet {
  id: string;
  user_id: string;
  balance: number;
  total_earned: number;
  total_spent: number;
  created_at: string;
  updated_at: string;
}

export interface CoinTransaction {
  id: string;
  type: string;
  amount: number;
  balance_after: number;
  reference_type?: string;
  reference_id?: string;
  description?: string;
  created_at: string;
}

export interface CoinPackage {
  id: string;
  name: string;
  description?: string;
  coin_amount: number;
  bonus_amount: number;
  total_coins: number;
  price: number;
  currency: string;
  discount_percent: number;
  is_featured: boolean;
  sort_order: number;
}

export type CoinPurchaseStatus = "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";

export interface CoinPurchase {
  id: string;
  user_id: string;
  package_id?: string;
  coin_amount: number;
  bonus_amount: number;
  price: number;
  currency: string;
  status: CoinPurchaseStatus;
  payment_method?: string;
  /** Mã nội dung chuyển khoản — user phải ghi đúng mã này khi chuyển tiền. */
  payment_reference?: string;
  completed_at?: string;
  created_at: string;
}

export interface CoinGiftResult {
  sender_id: string;
  receiver_id: string;
  amount: number;
  message?: string;
  sender_balance: number;
  receiver_balance: number;
}

type R<T> = { message: string; data: T };

// ─── Service ────────────────────────────────────────────────────────────────

export const coinService = {
  // Wallet
  getWallet: () =>
    api.get<R<CoinWallet>>("/coins/wallet").then((r) => r.data.data),

  getTransactions: (params?: { type?: string; page?: number; limit?: number }) =>
    api
      .get<R<{ transactions: CoinTransaction[]; total_count: number }>>("/coins/wallet/transactions", {
        params,
      })
      .then((r) => r.data.data),

  // Packages
  listPackages: () =>
    api.get<R<CoinPackage[]>>("/coins/packages").then((r) => r.data.data),

  getPackage: (id: string) =>
    api.get<R<CoinPackage>>(`/coins/packages/${id}`).then((r) => r.data.data),

  // Purchases
  createPurchase: (packageId: string, paymentMethod: string) =>
    api
      .post<R<CoinPurchase>>("/coins/purchases", {
        package_id: packageId,
        payment_method: paymentMethod,
      })
      .then((r) => r.data.data),

  listPurchases: (params?: { page?: number; limit?: number }) =>
    api
      .get<R<{ purchases: CoinPurchase[]; total_count: number }>>("/coins/purchases", { params })
      .then((r) => r.data.data),

  verifyPurchase: (purchaseId: string) =>
    api
      .post<R<CoinPurchase>>(`/coins/purchases/${purchaseId}/verify`)
      .then((r) => r.data.data),

  // Gift
  sendGift: (receiverId: string, amount: number, message?: string) =>
    api
      .post<R<CoinGiftResult>>("/coins/gift", {
        receiver_id: receiverId,
        amount,
        message,
      })
      .then((r) => r.data.data),
};
