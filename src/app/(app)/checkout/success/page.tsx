"use client";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, BookOpen, ArrowRight, Clock3, ReceiptText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QueryState } from "@/components/common/query-state";
import { useOrder } from "@/hooks/queries/use-orders";
import { ORDER_STATUS_LABEL } from "@/services/order.service";
import { formatCurrency } from "@/lib/utils";
import "@/components/commerce/commerce.css";
export default function CheckoutSuccessPage() {
  const orderId = useSearchParams().get("order_id");
  const query = useOrder(orderId || "");
  const order = query.data;
  const paid = order?.status === "completed";
  const free = paid && Number(order?.total_amount) === 0;
  if (!orderId)
    return (
      <div className="commerce-page max-w-xl py-16 text-center">
        <h1 className="text-xl font-semibold">Chưa có thông tin đơn hàng</h1>
        <p className="my-4 text-sm text-slate-500">
          Mở Đơn hàng của tôi để xem trạng thái thanh toán.
        </p>
        <Link href="/orders">
          <Button>Xem đơn hàng</Button>
        </Link>
      </div>
    );
  return (
    <div className="commerce-page max-w-2xl py-12">
      <QueryState
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        onRetry={() => query.refetch()}
      >
        {order && (
          <section className="commerce-panel p-6 sm:p-10">
            <div className="mb-6 flex justify-center">
              {paid ? (
                <CheckCircle2 className="h-14 w-14 text-emerald-500" />
              ) : (
                <Clock3 className="h-14 w-14 text-amber-500" />
              )}
            </div>
            <h1 className="text-center text-2xl font-semibold tracking-tight">
              {paid ? (free ? "Đăng ký thành công" : "Thanh toán thành công") : ORDER_STATUS_LABEL[order.status]}
            </h1>
            <p className="mt-3 text-center text-sm leading-relaxed text-slate-500">
              {paid
                ? "Khoá học đã được thêm vào tài khoản. Bạn có thể bắt đầu học ngay."
                : "Đơn chưa được xác nhận thanh toán hoàn tất. Xem chi tiết trong Đơn hàng của tôi để tiếp tục."}
            </p>
            <div className="my-7 rounded-xl bg-slate-50 p-5">
              <div className="mb-4 flex items-center gap-2 text-xs text-slate-500">
                <ReceiptText className="h-4 w-4" />
                {order.order_number}
              </div>
              {order.items.map((item) => (
                <div key={item.id} className="my-3 flex justify-between gap-4 text-sm">
                  <span>{item.course_name}</span>
                  <span className="shrink-0">{formatCurrency(Number(item.final_price))}</span>
                </div>
              ))}
              <div className="mt-5 flex justify-between border-t pt-4 text-sm">
                <span>{paid ? (free ? "Miễn phí" : "Đã thanh toán") : "Tổng đơn hàng"}</span>
                <strong>{formatCurrency(Number(order.total_amount))}</strong>
              </div>
            </div>
            <div className="space-y-3">
              <Link href={paid ? "/my-courses" : "/orders"} className="block">
                <Button size="lg" className="w-full">
                  <BookOpen className="mr-2 h-4 w-4" />
                  {paid ? "Đi đến khoá học của tôi" : "Xem trạng thái đơn hàng"}
                </Button>
              </Link>
              <Link href="/courses" className="block">
                <Button variant="outline" className="w-full">
                  Khám phá khoá học
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            <p className="commerce-help text-center">
              Bạn có thể xem lại thông tin tại{" "}
              <Link href="/orders" className="text-indigo-600">
                Đơn hàng của tôi
              </Link>{" "}
              hoặc{" "}
              <Link href="/help" className="text-indigo-600">
                liên hệ hỗ trợ
              </Link>
              .
            </p>
          </section>
        )}
      </QueryState>
    </div>
  );
}
