/**
 * React Query hooks for order operations
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { orderService, type CreateOrderDTO } from "@/services/order.service";

export const orderKeys = {
  all: ["orders"] as const,
  mine: () => [...orderKeys.all, "mine"] as const,
  detail: (id: string) => [...orderKeys.all, "detail", id] as const,
  paymentStatus: (id: string) => [...orderKeys.all, "payment-status", id] as const,
};

/** Fetch all orders for the current user */
export function useMyOrders() {
  return useQuery({
    queryKey: orderKeys.mine(),
    queryFn: () => orderService.getMyOrders(),
  });
}

/** Fetch a specific order by ID */
export function useOrder(id: string) {
  return useQuery({
    queryKey: orderKeys.detail(id),
    queryFn: () => orderService.getOrder(id),
    enabled: !!id,
  });
}

/** Poll payment status of an order */
export function usePaymentStatus(id: string, enabled = false) {
  return useQuery({
    queryKey: orderKeys.paymentStatus(id),
    queryFn: () => orderService.getPaymentStatus(id),
    enabled: !!id && enabled,
    refetchInterval: enabled ? 3000 : false,
  });
}

/** Create a new order */
export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateOrderDTO) => orderService.createOrder(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: orderKeys.mine() });
    },
    onError: () => {
      toast.error("Không thể tạo đơn hàng");
    },
  });
}

/** Cancel an existing order */
export function useCancelOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => orderService.cancelOrder(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: orderKeys.mine() });
      qc.invalidateQueries({ queryKey: orderKeys.detail(id) });
      toast.success("Đã hủy đơn hàng");
    },
    onError: () => {
      toast.error("Không thể hủy đơn hàng");
    },
  });
}

/** Create a Stripe payment intent for an order */
export function useCreatePaymentIntent() {
  return useMutation({
    mutationFn: (id: string) => orderService.createPaymentIntent(id),
    onError: () => {
      toast.error("Không thể tạo phiên thanh toán");
    },
  });
}

/** Verify if an order's payment was completed */
export function useCheckPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => orderService.checkPayment(id),
    onSuccess: (data, id) => {
      if (data.paid) {
        qc.invalidateQueries({ queryKey: orderKeys.detail(id) });
        qc.invalidateQueries({ queryKey: orderKeys.mine() });
      }
    },
  });
}
