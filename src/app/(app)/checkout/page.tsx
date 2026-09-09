"use client";

import { useState, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import {
  Building2,
  ShieldCheck,
  ArrowLeft,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCart, useClearCart } from "@/hooks/queries/use-cart";
import { useCreateOrder, useCancelOrder } from "@/hooks/queries/use-orders";
import { VoucherInput } from "@/components/checkout/voucher-input";
import { OrderPaymentDialog } from "@/components/checkout/order-payment-dialog";
import type { VoucherValidateResponse } from "@/types/voucher";
import type { Order } from "@/services/order.service";
import { v4 as uuidv4 } from "uuid";

function formatPrice(price: number | string | null | undefined): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(Number(price ?? 0));
}

// Backend chỉ hỗ trợ payment_method="bank_transfer"|"qr_transfer" (xem
// dto.CreatePaymentIntentRequest) — thẻ/MoMo trước đây chỉ là UI chọn cho
// vui, không có gateway nào đứng sau. Bỏ để không hứa hẹn sai; chỉ còn
// chuyển khoản ngân hàng (mục 13).

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedItemsParam = searchParams.get("items");

  const [voucherResult, setVoucherResult] = useState<VoucherValidateResponse | null>(null);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  const { data: cartData, isLoading } = useCart();
  const createOrderMutation = useCreateOrder();
  const clearCartMutation = useClearCart();
  const cancelOrderMutation = useCancelOrder();

  // Filter items based on URL params
  const items = useMemo(() => {
    const allItems = cartData?.items ?? [];
    const ids = selectedItemsParam ? selectedItemsParam.split(",") : [];
    if (ids.length === 0) return allItems;
    return allItems.filter((item) => ids.includes(item.course_id));
  }, [cartData?.items, selectedItemsParam]);

  const subtotal = items.reduce((sum, item) => sum + Number(item.course?.price ?? 0), 0);
  const discount = voucherResult?.discount_amount ?? 0;
  const total = Math.max(0, subtotal - discount);

  const goToSuccess = async (orderId: string) => {
    // Dọn giỏ hàng chỉ sau khi ĐÃ thanh toán xong (hoặc đơn 0đ) — không dọn
    // ngay sau khi tạo order nữa, vì trước đó order có thể chưa được trả tiền.
    try {
      await clearCartMutation.mutateAsync();
    } catch {
      // Không chặn điều hướng nếu dọn giỏ hàng lỗi — đơn đã thanh toán xong.
    }
    toast.success("Thanh toán thành công!");
    router.push(`/checkout/success?order_id=${orderId}`);
  };

  const handleCheckout = async () => {
    try {
      const courseIds = items.map((item) => item.course_id);
      const order = await createOrderMutation.mutateAsync({
        source: "cart",
        course_ids: courseIds,
        coupon_code: voucherResult?.voucher?.code || undefined,
        idempotency_key: uuidv4(),
      });

      if (Number(order.total_amount) <= 0) {
        // Đơn 0đ (voucher giảm 100%): backend KHÔNG tự hoàn tất đơn 0đ (đã
        // đọc order_service.go#CreateOrder — status luôn "pending", không có
        // nhánh auto-complete cho total=0). Enrollment thật ra sẽ KHÔNG được
        // tạo cho tới khi có thanh toán — đây là khoảng trống backend cần xử
        // lý, ghi rõ trong báo cáo. Web tạm điều hướng thẳng theo yêu cầu.
        await goToSuccess(order.id);
        return;
      }

      setActiveOrder(order);
      setPaymentDialogOpen(true);
    } catch (error) {
      // Lỗi tạo đơn đã có toast riêng trong useCreateOrder.onError (kể cả 402
      // "khóa học cần thanh toán" từ backend); ở đây chỉ log để debug.
      console.error("Checkout error:", error);
    }
  };

  const handleRetryExpiredOrder = async () => {
    if (!activeOrder) return;
    setPaymentDialogOpen(false);
    try {
      await cancelOrderMutation.mutateAsync(activeOrder.id);
    } catch {
      // Đơn có thể đã ở trạng thái không hủy được — vẫn tiếp tục tạo đơn mới,
      // đơn cũ (nếu còn "processing") không ảnh hưởng vì không cộng tiền/enroll.
    }
    setActiveOrder(null);
    await handleCheckout();
  };

  const isProcessing = createOrderMutation.isPending || clearCartMutation.isPending;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Không có khóa học nào</h1>
        <p className="text-gray-500 mb-6">
          Vui lòng thêm khóa học vào giỏ hàng trước khi thanh toán
        </p>
        <Link href="/courses">
          <Button className="bg-primary-600 hover:bg-primary-700">Khám phá khóa học</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container max-w-5xl mx-auto px-4 py-8 bg-white min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/cart" className="p-2 hover:bg-neutral-100 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5 text-neutral-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-light text-black">Thanh toán</h1>
          <p className="text-neutral-500">{items.length} khóa học</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left column - Payment method & courses */}
        <div className="flex-1 space-y-6">
          {/* Payment method — hiện chỉ hỗ trợ chuyển khoản ngân hàng (backend
              chưa có gateway thẻ/MoMo, xem ghi chú ở trên) */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-light text-black mb-4">Phương thức thanh toán</h2>
              <div
                className="w-full flex items-center gap-4 rounded-xl px-4 py-3 bg-neutral-50"
                style={{ boxShadow: "rgba(0,0,0,0.1) 0px 0px 0px 1px inset" }}
              >
                <div className="p-2 rounded-lg bg-black text-white">
                  <Building2 className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-black">Chuyển khoản ngân hàng</p>
                  <p className="text-sm text-neutral-500">
                    Sau khi đặt hàng, bạn sẽ nhận thông tin chuyển khoản và mã đơn hàng
                  </p>
                </div>
                <CheckCircle2 className="w-5 h-5 text-black" />
              </div>
            </CardContent>
          </Card>

          {/* Order items */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-light text-black mb-4">
                Khóa học ({items.length})
              </h2>
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex items-start gap-4">
                    <div className="relative w-24 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-neutral-100">
                      {item.course?.thumbnail ? (
                        <Image
                          src={item.course.thumbnail}
                          alt={item.course.title || ""}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-neutral-200 to-neutral-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-black line-clamp-2">
                        {item.course?.title || "Khóa học"}
                      </p>
                      {item.course?.instructor && (
                        <p className="text-sm text-neutral-500 mt-0.5">
                          {item.course.instructor.name}
                        </p>
                      )}
                    </div>
                    <p className="font-medium text-black flex-shrink-0">
                      {formatPrice(item.course?.price ?? 0)}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column - Order summary */}
        <div className="lg:w-80 flex-shrink-0">
          <Card className="sticky top-24">
            <CardContent className="p-6">
              <h2 className="text-lg font-light text-black mb-4">Tóm tắt đơn hàng</h2>

              {/* Voucher */}
              <div className="mb-4">
                <label className="text-sm font-medium text-neutral-700 mb-2 block">Mã giảm giá</label>
                <VoucherInput
                  courseIds={items.map((item) => item.course_id)}
                  subtotal={subtotal}
                  onApplied={setVoucherResult}
                />
              </div>

              {/* Price breakdown */}
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-600">Tạm tính ({items.length} khóa học)</span>
                  <span className="font-medium">{formatPrice(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex items-center justify-between text-green-600">
                    <span>Giảm giá</span>
                    <span>-{formatPrice(discount)}</span>
                  </div>
                )}
                <div className="pt-3 flex items-center justify-between" style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                  <span className="font-medium text-black">Tổng cộng</span>
                  <span className="text-xl font-medium text-black">{formatPrice(total)}</span>
                </div>
              </div>

              <Button
                className="w-full mt-6"
                size="lg"
                onClick={handleCheckout}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  `Thanh toán ${formatPrice(total)}`
                )}
              </Button>

              {/* Security note */}
              <div className="flex items-center gap-2 mt-4 text-xs text-neutral-500">
                <ShieldCheck className="w-4 h-4 text-green-600" />
                <span>Giao dịch được bảo mật bởi SSL 256-bit</span>
              </div>

              <p className="text-xs text-center text-neutral-500 mt-3">
                Bằng việc thanh toán, bạn đồng ý với{" "}
                <Link href="/terms" className="text-black hover:underline">
                  Điều khoản dịch vụ
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <OrderPaymentDialog
        orderId={activeOrder?.id ?? null}
        amount={activeOrder ? Number(activeOrder.total_amount) : total}
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        onPaid={() => {
          setPaymentDialogOpen(false);
          if (activeOrder) goToSuccess(activeOrder.id);
        }}
        onRetryExpired={handleRetryExpiredOrder}
      />
    </div>
  );
}
