"use client";

import { useState, useMemo, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { Building2, ShieldCheck, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCart, cartKeys } from "@/hooks/queries/use-cart";
import { useCreateOrder } from "@/hooks/queries/use-orders";
import { VoucherInput } from "@/components/checkout/voucher-input";
import { OrderPaymentDialog } from "@/components/checkout/order-payment-dialog";
import type { VoucherValidateResponse } from "@/types/voucher";
import type { CartItem } from "@/services/cart.service";
import type { Order } from "@/services/order.service";
import { useQueryClient } from "@tanstack/react-query";
import { QueryState } from "@/components/common/query-state";
import { getErrorMessage } from "@/lib/error-messages";
import "@/components/commerce/commerce.css";
import { v4 as uuidv4 } from "uuid";
import { sumCartItemPrices } from "@/lib/cart-pricing";
import { CartItemPrice } from "@/components/cart/cart-item-price";
import { CourseThumbnailPlaceholder } from "@/components/course/course-thumbnail-placeholder";

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
  const voucherParam = searchParams.get("voucher"); // M-01: /cart truyền qua nhưng trước đây không đọc

  const [voucherResult, setVoucherResult] = useState<VoucherValidateResponse | null>(null);
  const [orderedItems, setOrderedItems] = useState<CartItem[] | null>(null);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  const { data: cartData, isLoading, isError, error, refetch } = useCart();
  const qc = useQueryClient();
  const submitting = useRef(false);
  const redirecting = useRef(false);
  const requestKey = useRef<{ fingerprint: string; key: string } | null>(null);
  const [checkoutError, setCheckoutError] = useState("");
  const createOrderMutation = useCreateOrder();

  // Filter items based on URL params
  const items = useMemo(() => {
    const allItems = orderedItems ?? cartData?.items ?? [];
    const ids = selectedItemsParam ? selectedItemsParam.split(",") : [];
    if (ids.length === 0) return allItems;
    return allItems.filter((item) => ids.includes(item.course_id));
  }, [cartData?.items, selectedItemsParam, orderedItems]);

  // Theo GIÁ BÁN — order_service tính subtotal bằng Course.EffectivePrice, không phải giá niêm yết.
  const subtotal = sumCartItemPrices(items);
  const discount = voucherResult?.discount_amount ?? 0;
  const total = Math.max(0, subtotal - discount);

  const goToSuccess = async (orderId: string) => {
    if (redirecting.current) return;
    redirecting.current = true;
    // The backend removes exactly the selected items when creating the order.
    void qc.invalidateQueries({ queryKey: cartKeys.all, refetchType: "none" });
    toast.success("Thanh toán thành công!");
    router.push(`/checkout/success?order_id=${orderId}`);
  };

  const handleCheckout = async () => {
    if (submitting.current || !items.length) return;
    if (activeOrder) {
      setPaymentDialogOpen(true);
      return;
    }
    submitting.current = true;
    setCheckoutError("");
    try {
      const courseIds = items.map((item) => item.course_id);
      const fingerprint = JSON.stringify([
        courseIds.slice().sort(),
        voucherResult?.voucher?.code ?? "",
      ]);
      if (requestKey.current?.fingerprint !== fingerprint)
        requestKey.current = { fingerprint, key: uuidv4() };
      const order = await createOrderMutation.mutateAsync({
        source: "cart",
        course_ids: courseIds,
        coupon_code: voucherResult?.voucher?.code || undefined,
        idempotency_key: requestKey.current.key,
      });

      if (order.status === "completed") {
        await goToSuccess(order.id);
        return;
      }

      setOrderedItems(items);
      setActiveOrder(order);
      setPaymentDialogOpen(true);
    } catch (failure) {
      setCheckoutError(
        getErrorMessage(failure, "Chưa tạo được đơn. Kiểm tra kết nối rồi thử lại.")
      );
    } finally {
      submitting.current = false;
    }
  };

  const handleRetryExpiredOrder = async () => {
    if (!activeOrder) return;
    // A closed order can still have received money. Resume from Orders, which checks it first.
    router.push("/orders");
  };

  const isProcessing = createOrderMutation.isPending;
  if (isError && !cartData)
    return (
      <QueryState isError error={error} onRetry={() => refetch()} className="commerce-page">
        {null}
      </QueryState>
    );

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
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Không có khoá học nào</h1>
        <p className="text-gray-500 mb-6">
          Giỏ hàng không có khoá học được chọn. Nếu đã tạo đơn, bạn có thể tiếp tục trong Đơn hàng
          của tôi.
        </p>
        <Link href="/orders" className="mr-3">
          <Button variant="outline">Đơn hàng của tôi</Button>
        </Link>
        <Link href="/courses">
          <Button className="bg-primary-600 hover:bg-primary-700">Khám phá khoá học</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="commerce-page">
      <nav className="commerce-stepper" aria-label="Tiến trình mua khoá học">
        <span>
          <b>1</b>Giỏ hàng
        </span>
        <span className="active">
          <b>2</b>Thanh toán
        </span>
        <span>
          <b>3</b>Vào học
        </span>
      </nav>
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/cart" className="p-2 hover:bg-neutral-100 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5 text-neutral-600" />
        </Link>
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight text-slate-900">Thanh toán</h1>
          <p className="text-neutral-500">{items.length} khoá học</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left column - Payment method & courses */}
        <div className="flex-1 space-y-6">
          {/* Payment method — hiện chỉ hỗ trợ chuyển khoản ngân hàng (backend
              chưa có gateway thẻ/MoMo, xem ghi chú ở trên) */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-base font-semibold text-slate-900 mb-4">
                Phương thức thanh toán
              </h2>
              <div
                className="w-full flex items-center gap-4 rounded-xl px-4 py-3 bg-neutral-50"
                style={{ boxShadow: "rgba(0,0,0,0.1) 0px 0px 0px 1px inset" }}
              >
                <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                  <Building2 className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-black">
                    {total === 0 ? "Đăng ký miễn phí" : "Chuyển khoản ngân hàng"}
                  </p>
                  <p className="text-sm text-neutral-500">
                    {total === 0
                      ? "Khoá học sẽ được thêm vào tài khoản sau khi xác nhận đăng ký."
                      : "Sau khi đặt hàng, bạn sẽ nhận thông tin chuyển khoản và mã đơn hàng"}
                  </p>
                </div>
                <CheckCircle2 className="w-5 h-5 text-black" />
              </div>
            </CardContent>
          </Card>

          {/* Order items */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-base font-semibold text-slate-900 mb-4">
                Khoá học ({items.length})
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
                          sizes="96px"
                          className="object-cover"
                        />
                      ) : (
                        <CourseThumbnailPlaceholder iconClassName="h-6 w-6" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-black line-clamp-2">
                        {item.course?.title || "Khoá học"}
                      </p>
                      {item.course?.instructor && (
                        <p className="text-sm text-neutral-500 mt-0.5">
                          {item.course.instructor.name}
                        </p>
                      )}
                    </div>
                    <p className="font-medium text-black flex-shrink-0">
                      <CartItemPrice item={item} />
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column - Order summary */}
        <div className="lg:w-80 flex-shrink-0">
          <Card className="sticky top-24 commerce-panel">
            <CardContent className="p-6">
              <h2 className="text-base font-semibold text-slate-900 mb-4">Tóm tắt đơn hàng</h2>

              {/* Voucher */}
              <fieldset disabled={!!activeOrder} className="mb-4 disabled:opacity-60">
                <label className="text-sm font-medium text-neutral-700 mb-2 block">
                  Mã giảm giá
                </label>
                <VoucherInput
                  courseIds={items.map((item) => item.course_id)}
                  subtotal={subtotal}
                  onApplied={setVoucherResult}
                  initialCode={voucherParam || undefined}
                />
              </fieldset>

              {/* Price breakdown */}
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-600">Tạm tính ({items.length} khoá học)</span>
                  <span className="font-medium">{formatPrice(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex items-center justify-between text-green-600">
                    <span>Giảm giá</span>
                    <span>-{formatPrice(discount)}</span>
                  </div>
                )}
                <div
                  className="pt-3 flex items-center justify-between"
                  style={{ borderTop: "1px solid rgba(0,0,0,0.05)" }}
                >
                  <span className="font-medium text-black">Tổng cộng</span>
                  <span className="text-xl font-medium text-black">
                    {formatPrice(activeOrder ? Number(activeOrder.total_amount) : total)}
                  </span>
                </div>
              </div>

              <Button
                className="w-full mt-6"
                size="lg"
                onClick={handleCheckout}
                disabled={isProcessing || isError}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Đang xử lý...
                  </>
                ) : activeOrder ? (
                  "Tiếp tục thanh toán"
                ) : total === 0 ? (
                  "Đăng ký miễn phí"
                ) : (
                  `Thanh toán ${formatPrice(total)}`
                )}
              </Button>

              {checkoutError && (
                <p role="alert" className="mt-3 text-xs text-red-600">
                  {checkoutError}
                </p>
              )}
              {activeOrder && (
                <p className="mt-3 text-xs leading-relaxed text-slate-500">
                  Đơn {activeOrder.order_number} đã được lưu. Đóng cửa sổ vẫn có thể thanh toán lại
                  tại{" "}
                  <Link href="/orders" className="text-indigo-600 underline">
                    Đơn hàng của tôi
                  </Link>
                  .
                </p>
              )}
              {/* Security note */}
              <div className="flex items-center gap-2 mt-4 text-xs text-neutral-500">
                <ShieldCheck className="w-4 h-4 text-green-600" />
                <span>
                  {total === 0
                    ? "Xác nhận để thêm khoá học vào tài khoản"
                    : "Khoá học mở sau khi thanh toán được xác nhận"}
                </span>
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
