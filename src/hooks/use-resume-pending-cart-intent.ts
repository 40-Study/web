"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useEnrolledCourses } from "@/hooks/use-courses";
import { useIsInCart } from "@/hooks/queries/use-cart";
import { clearPendingCartIntent, readPendingCartIntent } from "@/lib/pending-cart-intent";
import { useAuthStore } from "@/stores/auth.store";

interface ResumePendingCartIntentOptions {
  courseId: string;
  isEnrolled: boolean;
  addToCart: (courseId: string) => void;
}

/**
 * UX-A-03: khách bấm "Thêm vào giỏ" rồi đăng nhập, quay lại trang khoá thì tự thêm đúng khoá đó.
 * Toast xác nhận ("Đã thêm vào giỏ hàng") do useAddToCart phát.
 *
 * Chỉ chạy khi đã biết chắc khoá này đã sở hữu hay đang trong giỏ chưa (2 query đã có kết quả):
 * chạy sớm hơn thì `isEnrolled`/`inCart` còn false mặc định và sẽ thêm nhầm khoá đã mua vào giỏ.
 * Ý định bị xoá ngay khi xử lý, kể cả khi bỏ qua, để không chạy lại ở lần mở trang sau.
 */
export function useResumePendingCartIntent({ courseId, isEnrolled, addToCart }: ResumePendingCartIntentOptions) {
  const sessionStatus = useAuthStore((s) => s.sessionStatus);
  const { isFetched: enrollmentKnown } = useEnrolledCourses();
  const { data: inCart, isFetched: cartKnown } = useIsInCart(courseId);
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current || sessionStatus !== "authenticated") return;
    const intent = readPendingCartIntent();
    if (!intent || intent.courseId !== courseId) return;
    if (!enrollmentKnown || !cartKnown) return;

    handled.current = true;
    clearPendingCartIntent();
    if (isEnrolled) {
      toast.info("Bạn đã sở hữu khoá học này");
      return;
    }
    if (inCart) {
      toast.info("Khoá học đã có trong giỏ hàng");
      return;
    }
    addToCart(courseId);
  }, [sessionStatus, courseId, isEnrolled, enrollmentKnown, cartKnown, inCart, addToCart]);
}
