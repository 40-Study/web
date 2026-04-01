"use client";

/**
 * CheckoutModal - purchase flow overlay for a single course
 * Shows course summary, voucher input, payment method selector, and confirm button
 */

import { useState } from "react";
import { CreditCard, Wallet, ShoppingCart } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency } from "@/lib/utils";
import { VoucherInput } from "./voucher-input";
import type { CourseDetail } from "@/types/course";
import type { VoucherValidateResponse } from "@/types/voucher";

type PaymentMethod = "card" | "momo" | "banking";

interface PaymentOption {
  id: PaymentMethod;
  label: string;
  icon: React.ReactNode;
}

const PAYMENT_OPTIONS: PaymentOption[] = [
  { id: "card", label: "Thẻ tín dụng / Ghi nợ", icon: <CreditCard className="h-4 w-4" /> },
  { id: "momo", label: "Ví MoMo", icon: <Wallet className="h-4 w-4" /> },
  { id: "banking", label: "Chuyển khoản ngân hàng", icon: <ShoppingCart className="h-4 w-4" /> },
];

interface CheckoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course: CourseDetail;
  /** Called when user confirms purchase */
  onConfirm?: (paymentMethod: PaymentMethod, voucherCode?: string) => void;
}

export function CheckoutModal({ open, onOpenChange, course, onConfirm }: CheckoutModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [voucherResult, setVoucherResult] = useState<VoucherValidateResponse | null>(null);

  const originalPrice = course.originalPrice ?? course.price;
  const courseDiscount = originalPrice > course.price ? originalPrice - course.price : 0;
  const voucherDiscount = voucherResult?.discount_amount ?? 0;
  const finalPrice = Math.max(0, course.price - voucherDiscount);

  function handleConfirm() {
    onConfirm?.(paymentMethod, voucherResult?.voucher?.code);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Xác nhận mua khóa học</DialogTitle>
        </DialogHeader>

        {/* Course summary */}
        <div className="flex gap-3 rounded-xl border p-3">
          <img
            src={course.thumbnail}
            alt={course.title}
            className="h-16 w-28 rounded-lg object-cover shrink-0"
          />
          <div className="min-w-0">
            <p className="font-medium text-sm line-clamp-2 text-gray-900">{course.title}</p>
            <p className="text-xs text-gray-500 mt-1">{course.instructor.name}</p>
            <div className="mt-1 flex items-center gap-2">
              <span className="font-semibold text-primary-600">{formatCurrency(course.price)}</span>
              {courseDiscount > 0 && (
                <span className="text-xs text-gray-400 line-through">{formatCurrency(originalPrice)}</span>
              )}
            </div>
          </div>
        </div>

        {/* Voucher */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Mã giảm giá</p>
          <VoucherInput
            courseIds={[String(course.id)]}
            onApplied={setVoucherResult}
          />
        </div>

        {/* Payment method */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Phương thức thanh toán</p>
          <div className="space-y-2">
            {PAYMENT_OPTIONS.map((option) => (
              <button
                key={option.id}
                onClick={() => setPaymentMethod(option.id)}
                className={cn(
                  "w-full flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors",
                  paymentMethod === option.id
                    ? "border-primary-500 bg-primary-50 text-primary-700"
                    : "border-gray-200 hover:border-gray-300 text-gray-700"
                )}
              >
                <span className={cn(paymentMethod === option.id ? "text-primary-600" : "text-gray-400")}>
                  {option.icon}
                </span>
                {option.label}
                {paymentMethod === option.id && (
                  <span className="ml-auto h-2 w-2 rounded-full bg-primary-500" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Price breakdown */}
        <div className="rounded-xl bg-gray-50 p-3 space-y-1.5 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Giá gốc</span>
            <span>{formatCurrency(course.price)}</span>
          </div>
          {voucherDiscount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Voucher ({voucherResult?.voucher?.code})</span>
              <span>- {formatCurrency(voucherDiscount)}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold text-gray-900 pt-1 border-t border-gray-200">
            <span>Tổng thanh toán</span>
            <span className="text-primary-600">{formatCurrency(finalPrice)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button className="flex-1 bg-primary-600 hover:bg-primary-700 text-white" onClick={handleConfirm}>
            Thanh toán {formatCurrency(finalPrice)}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
