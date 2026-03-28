/**
 * Voucher service - handles voucher API calls
 * Uses mock data until backend voucher API is available
 */

import { BaseService } from "./base.service";
import type { Voucher, VoucherValidateRequest, VoucherValidateResponse } from "@/types/voucher";

// Mock vouchers for development
const MOCK_VOUCHERS: Voucher[] = [
  {
    id: "1",
    code: "WELCOME20",
    discountType: "percentage",
    discountValue: 20,
    maxDiscount: 100000,
    minOrderValue: 0,
    expiresAt: "2026-06-30T23:59:59Z",
    status: "active",
    description: "Giảm 20% cho đơn hàng đầu tiên",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "2",
    code: "SUMMER50K",
    discountType: "fixed",
    discountValue: 50000,
    minOrderValue: 200000,
    expiresAt: "2026-05-31T23:59:59Z",
    status: "active",
    description: "Giảm 50,000₫ cho đơn từ 200,000₫",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "3",
    code: "USED2025",
    discountType: "percentage",
    discountValue: 15,
    expiresAt: "2025-12-31T23:59:59Z",
    status: "used",
    description: "Voucher đã dùng",
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
  },
];

class VoucherService extends BaseService<Voucher> {
  constructor() {
    super("/vouchers");
  }

  /** Get current user's vouchers (mock) */
  async getMyVouchers(): Promise<Voucher[]> {
    // TODO: replace with real API call when backend is ready
    // return apiClient.get<Voucher[]>(`${this.endpoint}/my`);
    return Promise.resolve(MOCK_VOUCHERS);
  }

  /** Validate voucher code and calculate discount */
  async validateVoucher(request: VoucherValidateRequest): Promise<VoucherValidateResponse> {
    // TODO: replace with real API call when backend is ready
    // return apiClient.post<VoucherValidateResponse>(`${this.endpoint}/validate`, request);

    const voucher = MOCK_VOUCHERS.find(
      (v) => v.code.toUpperCase() === request.code.toUpperCase()
    );

    if (!voucher) {
      return { valid: false, discountAmount: 0, finalPrice: request.coursePrice, message: "Mã voucher không tồn tại" };
    }

    if (voucher.status === "used") {
      return { valid: false, discountAmount: 0, finalPrice: request.coursePrice, message: "Voucher này đã được sử dụng" };
    }

    if (voucher.status === "expired" || new Date(voucher.expiresAt) < new Date()) {
      return { valid: false, discountAmount: 0, finalPrice: request.coursePrice, message: "Voucher đã hết hạn" };
    }

    if (voucher.minOrderValue && request.coursePrice < voucher.minOrderValue) {
      return {
        valid: false,
        discountAmount: 0,
        finalPrice: request.coursePrice,
        message: `Đơn hàng tối thiểu ${voucher.minOrderValue.toLocaleString("vi-VN")}₫`,
      };
    }

    let discountAmount: number;
    if (voucher.discountType === "percentage") {
      discountAmount = Math.floor(request.coursePrice * (voucher.discountValue / 100));
      if (voucher.maxDiscount) {
        discountAmount = Math.min(discountAmount, voucher.maxDiscount);
      }
    } else {
      discountAmount = Math.min(voucher.discountValue, request.coursePrice);
    }

    return {
      valid: true,
      voucher,
      discountAmount,
      finalPrice: request.coursePrice - discountAmount,
    };
  }
}

export const voucherService = new VoucherService();
