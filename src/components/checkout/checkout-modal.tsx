"use client";

/**
 * CheckoutModal - purchase flow overlay for a single course
 * Shows course summary, voucher input, payment method selector, and confirm button
 */

import { useEffect, useRef, useState } from "react";
import { CreditCard, Loader2, Wallet, ShoppingCart } from "lucide-react";
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
  /** true trong lúc đơn đang được tạo — khoá nút "Thanh toán", hiện spinner. */
  isConfirming?: boolean;
}

export function CheckoutModal({
  open,
  onOpenChange,
  course,
  onConfirm,
  isConfirming = false,
}: CheckoutModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [voucherResult, setVoucherResult] = useState<VoucherValidateResponse | null>(null);

  const originalPrice = course.originalPrice ?? course.price;
  const courseDiscount = originalPrice > course.price ? originalPrice - course.price : 0;
  const voucherDiscount = voucherResult?.discount_amount ?? 0;
  const finalPrice = Math.max(0, course.price - voucherDiscount);

  // Review PR #25 (BLOCKER #1): `isConfirming` (từ React Query's isPending)
  // chỉ cập nhật ở lượt render SAU khi mutate() được gọi — có 1 khung hình mà
  // 2 click liên tiếp (double-click, hoặc click ngay trước khi Dialog kịp
  // unmount) đều lọt qua trước khi `disabled` kịp bật. Ref đồng bộ chặn ngay
  // trong CÙNG tick, độc lập với chu kỳ render, làm lớp chặn thứ 2 bên cạnh
  // `disabled={isConfirming}`.
  const submittingRef = useRef(false);

  // KHÔNG dùng dependency array [isConfirming] ở đây: khi mutation reject/
  // resolve cực nhanh (mock trong test, hoặc 1 request rất nhanh ở production),
  // React 18 gộp 2 lượt cập nhật idle->pending->error vào MỘT lần commit duy
  // nhất — isConfirming không bao giờ được render ra `true` ở một lượt riêng,
  // nên effect phụ thuộc [isConfirming] không thấy thay đổi (false -> false)
  // và KHÔNG BAO GIỜ reset submittingRef, khoá nút "Thanh toán" vĩnh viễn dù
  // `disabled` đã hiển thị false. Chạy lại sau MỖI lần render thay vì chỉ khi
  // isConfirming đổi giá trị để luôn đồng bộ đúng trạng thái đã commit.
  useEffect(() => {
    if (!isConfirming) submittingRef.current = false;
  });

  useEffect(() => {
    // Modal đóng (huỷ, hoặc cha tự đóng sau khi biết kết quả) -> mở lại lần
    // sau phải bấm được, không bị kẹt ở trạng thái khoá.
    if (!open) submittingRef.current = false;
  }, [open]);

  function handleConfirm() {
    if (submittingRef.current || isConfirming) return;
    submittingRef.current = true;
    onConfirm?.(paymentMethod, voucherResult?.voucher?.code);
    // KHÔNG tự đóng modal ở đây nữa — component cha (course-detail-sidebar)
    // đóng khi đã biết kết quả tạo đơn (thành công), và GIỮ MỞ khi lỗi để
    // người dùng bấm lại (retry) với cùng idempotency_key.
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
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
            disabled={isConfirming}
          >
            Hủy
          </Button>
          <Button
            className="flex-1 bg-primary-600 hover:bg-primary-700 text-white"
            onClick={handleConfirm}
            disabled={isConfirming}
          >
            {isConfirming ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              `Thanh toán ${formatCurrency(finalPrice)}`
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
