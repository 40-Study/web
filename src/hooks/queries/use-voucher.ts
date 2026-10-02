/**
 * React Query hooks for voucher operations
 */

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "@/lib/errors";
import {
  voucherService,
  type CreateVoucherDTO,
  type UpdateVoucherDTO,
  type Voucher,
  type UserSavedVoucher,
} from "@/services/voucher.service";

/** Số voucher mỗi trang ở trang admin (backend giới hạn tối đa 100/lần). */
export const ADMIN_VOUCHER_PAGE_SIZE = 20;

export const voucherKeys = {
  all: ["vouchers"] as const,
  admin: (page = 1, pageSize = ADMIN_VOUCHER_PAGE_SIZE) => [...voucherKeys.all, "admin", page, pageSize] as const,
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

/** Fetch current user's saved vouchers (chỉ id/voucher_id — chưa có chi tiết) */
export function useMyVouchers() {
  return useQuery({
    queryKey: voucherKeys.mine(),
    queryFn: () => voucherService.getMyVouchers(),
  });
}

export interface MyVoucherWithDetails extends UserSavedVoucher {
  voucher: Voucher | null;
}

/**
 * Fetch current user's saved vouchers KÈM chi tiết voucher (code, discount…).
 * H-02 (plans/reports/code-reviewer-260909-1412-web-review.md): trước đây
 * join client-side qua GET /vouchers/:id — route đó yêu cầu quyền admin
 * (SYSTEM_SETTINGS_MANAGE), luôn 403 với user thường → trang không chạy
 * được. Backend giờ preload quan hệ Voucher trong GET /vouchers/me, đọc
 * thẳng field nested `sv.voucher`.
 */
export function useMyVouchersWithDetails() {
  const savedQuery = useMyVouchers();
  const saved = savedQuery.data ?? [];

  const data: MyVoucherWithDetails[] = saved.map((sv) => ({
    ...sv,
    voucher: sv.voucher ?? null,
  }));

  return {
    data,
    isLoading: savedQuery.isLoading,
    isError: savedQuery.isError,
  };
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

/**
 * Admin: voucher (kể cả voucher dành riêng, đang tắt) theo TRANG (L6 mục 8). Trước đây chỉ tải 100 voucher
 * đầu nên voucher thứ 101 trở đi không bao giờ hiện để sửa. page bắt đầu từ 1.
 */
export function useAdminVouchers(page = 1, pageSize = ADMIN_VOUCHER_PAGE_SIZE) {
  return useQuery({
    queryKey: voucherKeys.admin(page, pageSize),
    queryFn: () =>
      voucherService.getAllVouchers({ limit: pageSize, offset: (page - 1) * pageSize }).then((r) => ({
        vouchers: r.vouchers ?? [],
        total: r.total_count,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(r.total_count / pageSize)),
      })),
    // Giữ trang cũ trên màn hình khi chuyển trang để danh sách không nhấp nháy về trống.
    placeholderData: keepPreviousData,
  });
}

/** Admin: tạo voucher. */
export function useCreateVoucher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateVoucherDTO) => voucherService.createVoucher(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: voucherKeys.all });
      toast.success("Đã tạo voucher");
    },
    onError: () => toast.error("Không thể tạo voucher. Mã hoặc tên có thể đã tồn tại."),
  });
}

/** Admin: sửa voucher. */
export function useUpdateVoucher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateVoucherDTO }) => voucherService.updateVoucher(id, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: voucherKeys.all });
      toast.success("Đã cập nhật voucher");
    },
    onError: () => toast.error("Không thể cập nhật voucher"),
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

/** Mã lỗi 403 của backend khi bỏ lưu voucher dành riêng (L6 mục 6). */
export const VOUCHER_HOLDERS_ONLY_NOT_REMOVABLE = "VOUCHER_HOLDERS_ONLY_NOT_REMOVABLE";

/** Câu báo lỗi bỏ lưu voucher: voucher dành riêng được cấp cho bạn nên không bỏ lưu được. */
export function unsaveVoucherErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.code === VOUCHER_HOLDERS_ONLY_NOT_REMOVABLE) {
    return "Voucher này được cấp riêng cho bạn nên không thể bỏ lưu.";
  }
  return "Không thể bỏ lưu voucher, thử lại sau.";
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
    onError: (error) => toast.error(unsaveVoucherErrorMessage(error)),
  });
}
