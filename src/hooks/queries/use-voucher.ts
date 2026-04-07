/**
 * React Query hooks for voucher operations
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { voucherService } from "@/services/voucher.service";

export const voucherKeys = {
  all: ["vouchers"] as const,
  public: () => [...voucherKeys.all, "public"] as const,
  mine: () => [...voucherKeys.all, "my"] as const,
  byCode: (code: string) => [...voucherKeys.all, "code", code] as const,
  stats: (id: string) => [...voucherKeys.all, "stats", id] as const,
};

/** Fetch publicly visible vouchers */
export function usePublicVouchers() {
  return useQuery({
    queryKey: voucherKeys.public(),
    queryFn: () => voucherService.getPublicVouchers(),
  });
}

/** Fetch current user's saved vouchers */
export function useMyVouchers() {
  return useQuery({
    queryKey: voucherKeys.mine(),
    queryFn: () => voucherService.getMyVouchers(),
  });
}

/** Fetch a voucher by code */
export function useVoucherByCode(code: string) {
  return useQuery({
    queryKey: voucherKeys.byCode(code),
    queryFn: () => voucherService.getVoucherByCode(code),
    enabled: !!code,
  });
}

/** Validate a voucher code against a list of course IDs */
export function useValidateVoucher() {
  return useMutation({
    mutationFn: ({ code, courseIds }: { code: string; courseIds: string[] }) =>
      voucherService.validate(code, courseIds),
    onError: () => {
      toast.error("Mã voucher không hợp lệ");
    },
  });
}

/** Apply a voucher to an order */
export function useApplyVoucher() {
  return useMutation({
    mutationFn: ({ code, orderId }: { code: string; orderId: string }) =>
      voucherService.apply(code, orderId),
    onSuccess: () => {
      toast.success("Áp dụng voucher thành công");
    },
    onError: () => {
      toast.error("Không thể áp dụng voucher");
    },
  });
}

/** Save a voucher to user's collection */
export function useSaveVoucher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => voucherService.saveVoucher(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: voucherKeys.mine() });
      toast.success("Đã lưu voucher");
    },
  });
}

/** Remove a voucher from user's collection */
export function useUnsaveVoucher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => voucherService.unsaveVoucher(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: voucherKeys.mine() });
      toast.success("Đã bỏ lưu voucher");
    },
  });
}
