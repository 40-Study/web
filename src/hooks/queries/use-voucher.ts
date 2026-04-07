/**
 * React Query hooks for voucher operations
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { voucherService, type Voucher } from "@/services/voucher.service";

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

/** Look up a voucher by code (mutation-style for form submission) */
export function useVoucherLookup() {
  return useMutation({
    mutationFn: (code: string) => voucherService.getVoucherByCode(code),
    onError: () => {
      toast.error("Mã voucher không hợp lệ");
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
