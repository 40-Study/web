"use client";

import { useState, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import {
  CreditCard,
  Wallet,
  Building2,
  ShieldCheck,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Tag,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart, useClearCart } from "@/hooks/queries/use-cart";
import { useCreateOrder } from "@/hooks/queries/use-orders";
import { cn } from "@/lib/utils";
import { v4 as uuidv4 } from "uuid";

function formatPrice(price: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
}

type PaymentMethod = "card" | "momo" | "banking";

interface PaymentOption {
  id: PaymentMethod;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const PAYMENT_OPTIONS: PaymentOption[] = [
  {
    id: "card",
    label: "Thẻ tín dụng / Ghi nợ",
    description: "Visa, Mastercard, JCB",
    icon: <CreditCard className="h-5 w-5" />,
  },
  {
    id: "momo",
    label: "Ví MoMo",
    description: "Thanh toán qua ứng dụng MoMo",
    icon: <Wallet className="h-5 w-5" />,
  },
  {
    id: "banking",
    label: "Chuyển khoản ngân hàng",
    description: "Chuyển khoản trực tiếp",
    icon: <Building2 className="h-5 w-5" />,
  },
];

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedItemsParam = searchParams.get("items");

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("banking");
  const [voucherCode, setVoucherCode] = useState("");

  const { data: cartData, isLoading } = useCart();
  const createOrderMutation = useCreateOrder();
  const clearCartMutation = useClearCart();

  // Filter items based on URL params
  const items = useMemo(() => {
    const allItems = cartData?.items ?? [];
    const ids = selectedItemsParam ? selectedItemsParam.split(",") : [];
    if (ids.length === 0) return allItems;
    return allItems.filter((item) => ids.includes(item.course_id));
  }, [cartData?.items, selectedItemsParam]);

  const subtotal = items.reduce((sum, item) => sum + (item.course?.price ?? 0), 0);
  const discount = 0; // TODO: Apply voucher
  const total = subtotal - discount;

  const handleCheckout = async () => {
    try {
      const courseIds = items.map((item) => item.course_id);
      const order = await createOrderMutation.mutateAsync({
        source: "cart",
        course_ids: courseIds,
        coupon_code: voucherCode || undefined,
        idempotency_key: uuidv4(),
      });

      // Clear cart after successful order
      await clearCartMutation.mutateAsync();

      toast.success("Đặt hàng thành công!");
      router.push(`/checkout/success?order_id=${order.id}`);
    } catch (error) {
      // Error is handled in mutation onError
      console.error("Checkout error:", error);
    }
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
          {/* Payment method */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-light text-black mb-4">Phương thức thanh toán</h2>
              <div className="space-y-3">
                {PAYMENT_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setPaymentMethod(option.id)}
                    className={cn(
                      "w-full flex items-center gap-4 rounded-xl px-4 py-3 text-left transition-all",
                      paymentMethod === option.id
                        ? "bg-neutral-50"
                        : "bg-white hover:bg-neutral-50"
                    )}
                    style={{ boxShadow: paymentMethod === option.id ? 'rgba(0,0,0,0.1) 0px 0px 0px 1px inset' : 'rgba(0,0,0,0.06) 0px 0px 0px 1px inset' }}
                  >
                    <div
                      className={cn(
                        "p-2 rounded-lg",
                        paymentMethod === option.id
                          ? "bg-black text-white"
                          : "bg-neutral-100 text-neutral-500"
                      )}
                    >
                      {option.icon}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-black">{option.label}</p>
                      <p className="text-sm text-neutral-500">{option.description}</p>
                    </div>
                    <div
                      className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                        paymentMethod === option.id
                          ? "border-black bg-black"
                          : "border-neutral-300"
                      )}
                    >
                      {paymentMethod === option.id && (
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      )}
                    </div>
                  </button>
                ))}
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
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <Input
                      placeholder="Nhập mã"
                      value={voucherCode}
                      onChange={(e) => setVoucherCode(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Button variant="outline" size="sm" disabled={!voucherCode}>
                    Áp dụng
                  </Button>
                </div>
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
    </div>
  );
}
