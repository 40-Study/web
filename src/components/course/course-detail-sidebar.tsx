"use client";

/**
 * CourseDetailSidebar - sticky right sidebar for course detail page
 * Handles 4 course states: free, paid+trial, paid+no-trial, enrolled
 * Contains video preview, price, CTAs, course includes, voucher input
 */

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { Play, ShoppingCart, Clock, BookOpen, Award, Infinity, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VoucherInput } from "@/components/checkout/voucher-input";
import { CheckoutModal } from "@/components/checkout/checkout-modal";
import { OrderPaymentDialog } from "@/components/checkout/order-payment-dialog";
import { cn, formatCurrency } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth.store";
import { useAddToCart, useRemoveFromCart, useIsInCart } from "@/hooks/queries/use-cart";
import { useCreateOrder } from "@/hooks/queries/use-orders";
import { CourseDetail } from "@/types/course";
import type { Order } from "@/services/order.service";

interface CourseDetailSidebarProps {
  course: CourseDetail;
  isEnrolled: boolean;
  progress: number;
  onEnroll: () => void;
  onStartLearning: () => void;
  onTrial: () => void;
}

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} phút`;
  if (m === 0) return `${h} giờ`;
  return `${h} giờ ${m} phút`;
}

/** Determine if course has any free-preview lesson */
function hasTrial(course: CourseDetail): boolean {
  return course.sections.some((s) => s.lessons.some((l) => l.isFreePreview));
}

export function CourseDetailSidebar({
  course,
  isEnrolled,
  progress,
  onEnroll,
  onStartLearning,
  onTrial,
}: CourseDetailSidebarProps) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  // Review PR #25 (BLOCKER #1): idempotency_key phải CỐ ĐỊNH theo 1 phiên
  // checkout, không sinh mới mỗi lần handleCheckoutConfirm chạy — trước đây
  // `uuidv4()` gọi inline trong hàm khiến 2 lần bấm "Thanh toán" liên tiếp
  // (double-click, hoặc click trước khi Dialog kịp unmount) tạo 2 key khác
  // nhau -> backend không nhận ra là cùng 1 yêu cầu -> tạo 2 đơn hàng thật
  // độc lập. Key chỉ đổi khi đóng modal (huỷ, hoặc đơn đã tạo xong) — xem
  // resetIdempotencyKey() + handleCheckoutOpenChange().
  const idempotencyKeyRef = useRef<string>(uuidv4());

  const courseId = String(course.id);
  const addToCartMutation = useAddToCart();
  const removeFromCartMutation = useRemoveFromCart();
  const { data: inCartServer } = useIsInCart(courseId);
  const createOrderMutation = useCreateOrder();

  // Server là nguồn duy nhất cho trạng thái giỏ hàng — khách chưa đăng nhập
  // không có giỏ nào để đọc nên luôn coi là chưa thêm (S-P0-1).
  const inCart = isAuthenticated ? Boolean(inCartServer) : false;
  const isFree = course.price === 0;
  const courseHasTrial = hasTrial(course);

  const discountPct =
    course.originalPrice && course.originalPrice > course.price
      ? Math.round((1 - course.price / course.originalPrice) * 100)
      : 0;

  /** Khách chưa đăng nhập bấm mua/thêm giỏ → sang login, quay lại đúng khóa học sau khi đăng nhập. */
  function goToLoginWithReturn() {
    router.push(`/login?redirect=${encodeURIComponent(`/courses/${course.slug}`)}`);
  }

  function handleCartToggle() {
    if (!isAuthenticated) {
      goToLoginWithReturn();
      return;
    }
    if (inCart) {
      removeFromCartMutation.mutate(courseId);
    } else {
      addToCartMutation.mutate(courseId);
    }
  }

  function handleBuyNowClick() {
    if (!isAuthenticated) {
      goToLoginWithReturn();
      return;
    }
    setCheckoutOpen(true);
  }

  /**
   * Đóng/mở CheckoutModal. Khi ĐÓNG (huỷ, hoặc do handleCheckoutConfirm tự
   * đóng sau khi tạo đơn xong) -> sinh idempotency_key MỚI cho phiên checkout
   * tiếp theo, để lần mua sau không vô tình tái dùng key của lần mua trước.
   */
  function handleCheckoutOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      idempotencyKeyRef.current = uuidv4();
    }
    setCheckoutOpen(nextOpen);
  }

  /** onConfirm thật của CheckoutModal — tạo đơn qua API order (source=buy_now). */
  async function handleCheckoutConfirm(_paymentMethod: string, voucherCode?: string) {
    try {
      const order = await createOrderMutation.mutateAsync({
        source: "buy_now",
        course_ids: [courseId],
        coupon_code: voucherCode,
        idempotency_key: idempotencyKeyRef.current,
      });

      // Đơn tạo THÀNH CÔNG -> đóng modal (đồng thời sinh key mới cho lần
      // mua tiếp theo qua handleCheckoutOpenChange). Lỗi thì KHÔNG đóng — xem
      // catch bên dưới, giữ nguyên key để bấm lại (retry) không tạo đơn trùng.
      handleCheckoutOpenChange(false);

      if (Number(order.total_amount) <= 0) {
        // Đơn 0đ (voucher giảm 100%) — cùng cơ chế với app/(app)/checkout/page.tsx:
        // backend hiện chưa tự hoàn tất đơn 0đ, điều hướng thẳng sang trang thành công.
        toast.success("Đặt hàng thành công!");
        router.push(`/checkout/success?order_id=${order.id}`);
        return;
      }

      setActiveOrder(order);
      setPaymentDialogOpen(true);
    } catch (error) {
      // Lỗi tạo đơn đã có toast riêng trong useCreateOrder.onError. Modal vẫn
      // MỞ, idempotency_key GIỮ NGUYÊN — bấm lại (retry) dùng đúng key cũ,
      // backend coi là cùng 1 yêu cầu trong TTL, không tạo đơn thứ 2.
      console.error("Buy now checkout error:", error);
    }
  }

  function handleRetryExpiredOrder() {
    setPaymentDialogOpen(false);
    setActiveOrder(null);
    // Đơn cũ đã hết hạn (khác hẳn lỗi tạo đơn ở trên) — idempotency_key hiện
    // tại ĐÃ được đổi mới ngay sau khi đơn cũ tạo thành công (xem
    // handleCheckoutOpenChange trong handleCheckoutConfirm), nên mở lại modal
    // ở đây chắc chắn dùng key mới, tránh backend trả lại đúng đơn cũ đã hết hạn.
    setCheckoutOpen(true);
  }

  const courseIncludes = [
    { icon: Clock, label: `${formatDuration(course.duration)} video` },
    { icon: BookOpen, label: `${course.lessonCount} bài học` },
    { icon: Infinity, label: "Truy cập trọn đời" },
    { icon: Award, label: "Chứng chỉ hoàn thành" },
    { icon: RefreshCw, label: "Cập nhật thường xuyên" },
  ];

  return (
    <>
      <CheckoutModal
        open={checkoutOpen}
        onOpenChange={handleCheckoutOpenChange}
        course={course}
        onConfirm={handleCheckoutConfirm}
        isConfirming={createOrderMutation.isPending}
      />

      <OrderPaymentDialog
        orderId={activeOrder?.id ?? null}
        amount={activeOrder ? Number(activeOrder.total_amount) : course.price}
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        onPaid={() => {
          setPaymentDialogOpen(false);
          if (activeOrder) {
            toast.success("Thanh toán thành công!");
            router.push(`/checkout/success?order_id=${activeOrder.id}`);
          }
        }}
        onRetryExpired={handleRetryExpiredOrder}
      />

      <div className="sticky top-28 space-y-4">
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-md">
          {/* Video preview thumbnail */}
          <div className="relative aspect-video cursor-pointer overflow-hidden bg-gray-900">
            <img
              src={course.thumbnail}
              alt={course.title}
              className="h-full w-full object-cover opacity-80"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 shadow-lg transition-transform hover:scale-110">
                <Play className="h-6 w-6 text-primary-600 ml-0.5" />
              </div>
            </div>
            {courseHasTrial && !isEnrolled && (
              <button
                onClick={onTrial}
                className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-4 py-1.5 text-xs font-medium text-white backdrop-blur-sm hover:bg-black/75 transition-colors"
              >
                Xem thử miễn phí
              </button>
            )}
          </div>

          <div className="p-5">
            {/* Price section - hidden when enrolled */}
            {!isEnrolled && !isFree && (
              <div className="mb-4">
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-bold text-gray-900">
                    {formatCurrency(course.price)}
                  </span>
                  {discountPct > 0 && course.originalPrice && (
                    <>
                      <span className="text-base text-gray-400 line-through">
                        {formatCurrency(course.originalPrice)}
                      </span>
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-600">
                        -{discountPct}%
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* CTA buttons */}
            <div className="space-y-2.5">
              {isEnrolled ? (
                /* State 4: Already enrolled */
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Tiến độ</span>
                    <span className="font-medium">{progress}%</span>
                  </div>
                  <div className="mb-3 h-2 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-primary-500 transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <Button
                    className="w-full bg-primary-600 hover:bg-primary-700 text-white"
                    size="lg"
                    onClick={onStartLearning}
                  >
                    Tiếp tục học
                  </Button>
                </div>
              ) : isFree ? (
                /* State 1: Free course */
                <Button
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white"
                  size="lg"
                  onClick={onEnroll}
                >
                  Đăng ký miễn phí
                </Button>
              ) : (
                /* State 2 & 3: Paid course */
                <>
                  <Button
                    className={cn(
                      "w-full gap-2",
                      inCart
                        ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        : "bg-primary-600 hover:bg-primary-700 text-white"
                    )}
                    size="lg"
                    onClick={handleCartToggle}
                    disabled={addToCartMutation.isPending || removeFromCartMutation.isPending}
                  >
                    <ShoppingCart className="h-4 w-4" />
                    {inCart ? "Đã thêm vào giỏ hàng" : "Thêm vào giỏ hàng"}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full border-primary-300 text-primary-700 hover:bg-primary-50"
                    size="lg"
                    onClick={handleBuyNowClick}
                  >
                    Mua ngay
                  </Button>
                </>
              )}
            </div>

            {/* Refund notice - only for paid unenrolled */}
            {!isEnrolled && !isFree && (
              <p className="mt-3 text-center text-xs text-gray-500">
                Hoàn tiền trong 7 ngày nếu không hài lòng
              </p>
            )}
          </div>
        </div>

        {/* Course includes box */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h3 className="mb-3 font-semibold text-gray-900">Khóa học này bao gồm:</h3>
          <ul className="space-y-2">
            {courseIncludes.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2.5 text-sm text-gray-600">
                <Icon className="h-4 w-4 flex-shrink-0 text-gray-400" />
                {label}
              </li>
            ))}
          </ul>
        </div>

        {/* Voucher - only for unenrolled paid courses */}
        {!isEnrolled && !isFree && (
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="mb-3 font-semibold text-gray-900">Mã giảm giá</h3>
            <VoucherInput courseIds={[String(course.id)]} onApplied={() => {}} />
          </div>
        )}
      </div>
    </>
  );
}
