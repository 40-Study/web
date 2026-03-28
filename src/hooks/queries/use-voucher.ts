/**
 * React Query hooks for voucher operations
 */

import { useMutation, useQuery } from "@tanstack/react-query";
import { voucherService } from "@/services/voucher.service";
import type { VoucherValidateRequest } from "@/types/voucher";

export const voucherKeys = {
  all: ["vouchers"] as const,
  mine: () => [...voucherKeys.all, "my"] as const,
};

/** Fetch current user's vouchers */
export function useMyVouchers() {
  return useQuery({
    queryKey: voucherKeys.mine(),
    queryFn: () => voucherService.getMyVouchers(),
  });
}

/** Validate and apply a voucher code */
export function useValidateVoucher() {
  return useMutation({
    mutationFn: (request: VoucherValidateRequest) =>
      voucherService.validateVoucher(request),
  });
}
