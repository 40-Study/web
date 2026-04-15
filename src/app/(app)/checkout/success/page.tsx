"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, BookOpen, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useOrder } from "@/hooks/queries/use-orders";

function formatPrice(price: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
}

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");
  const { data: order, isLoading } = useOrder(orderId || "");

  return (
    <div className="container max-w-lg mx-auto px-4 py-16">
      <Card>
        <CardContent className="p-8 text-center">
          {/* Success icon */}
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-50 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-light text-black mb-2">Đặt hàng thành công!</h1>
          <p className="text-neutral-500 mb-8">
            Cảm ơn bạn đã mua khóa học. Bạn có thể bắt đầu học ngay bây giờ.
          </p>

          {/* Order details */}
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
            </div>
          ) : order ? (
            <div className="mb-8 p-4 rounded-xl bg-neutral-50 text-left">
              <p className="text-sm text-neutral-500 mb-2">Mã đơn hàng</p>
              <p className="font-mono text-sm text-black mb-3">{order.id}</p>
              <p className="text-sm text-neutral-500 mb-2">Tổng thanh toán</p>
              <p className="text-lg font-medium text-black">{formatPrice(order.final_total)}</p>
            </div>
          ) : null}

          {/* Actions */}
          <div className="space-y-3">
            <Link href="/my-courses" className="block">
              <Button className="w-full" size="lg">
                <BookOpen className="w-4 h-4 mr-2" />
                Đi đến khóa học của tôi
              </Button>
            </Link>

            <Link href="/courses" className="block">
              <Button variant="outline" className="w-full" size="lg">
                Khám phá thêm khóa học
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>

          {/* Receipt info */}
          <div className="mt-8 pt-6" style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}>
            <p className="text-sm text-neutral-500">
              Hóa đơn điện tử đã được gửi đến email của bạn.
              <br />
              Nếu cần hỗ trợ, vui lòng liên hệ{" "}
              <Link href="/help" className="text-black hover:underline">
                trung tâm trợ giúp
              </Link>
              .
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
