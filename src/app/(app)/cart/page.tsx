"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, Trash2, Loader2, ArrowLeft, Tag } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useCart, useRemoveFromCart, useClearCart } from "@/hooks/queries/use-cart";
import { cn } from "@/lib/utils";

function formatPrice(price: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
}

export default function CartPage() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [voucherCode, setVoucherCode] = useState("");

  const { data: cartData, isLoading } = useCart();
  const removeFromCart = useRemoveFromCart();
  const clearCart = useClearCart();

  const items = cartData?.items ?? [];
  const total = cartData?.total ?? 0;

  // Calculate selected total
  const selectedTotal = items
    .filter((item) => selectedIds.includes(item.course_id))
    .reduce((sum, item) => sum + (item.course?.price ?? 0), 0);

  const allSelected = items.length > 0 && selectedIds.length === items.length;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(items.map((item) => item.course_id));
    }
  };

  const toggleSelect = (courseId: string) => {
    setSelectedIds((prev) =>
      prev.includes(courseId) ? prev.filter((id) => id !== courseId) : [...prev, courseId]
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="container max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/courses" className="p-2 hover:bg-neutral-100 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5 text-neutral-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-light text-black">Giỏ hàng</h1>
          <p className="text-neutral-500">{items.length} khóa học</p>
        </div>
      </div>

      {items.length === 0 ? (
        <Card className="p-12 text-center">
          <ShoppingCart className="w-16 h-16 mx-auto text-neutral-300 mb-4" />
          <h2 className="text-xl font-light text-black mb-2">Giỏ hàng trống</h2>
          <p className="text-neutral-500 mb-6">Hãy khám phá các khóa học và thêm vào giỏ hàng</p>
          <Link href="/courses">
            <Button>Khám phá khóa học</Button>
          </Link>
        </Card>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Cart items */}
          <div className="flex-1 space-y-4">
            {/* Select all header */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Checkbox checked={allSelected} onCheckedChange={toggleSelectAll} />
                    <span className="text-sm font-medium text-gray-700">
                      Chọn tất cả ({items.length} khóa học)
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => clearCart.mutate()}
                    disabled={clearCart.isPending}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Xóa tất cả
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Cart items list */}
            {items.map((item) => (
              <Card
                key={item.id}
                className={cn(
                  "overflow-hidden transition-colors",
                  selectedIds.includes(item.course_id) && "ring-2 ring-primary-500"
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <Checkbox
                      checked={selectedIds.includes(item.course_id)}
                      onCheckedChange={() => toggleSelect(item.course_id)}
                    />

                    {/* Thumbnail */}
                    <div className="relative w-32 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                      {item.course?.thumbnail ? (
                        <Image
                          src={item.course.thumbnail}
                          alt={item.course.title || ""}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary-400 to-primary-600" />
                      )}
                    </div>

                    {/* Course info */}
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/courses/${item.course_id}`}
                        className="text-base font-semibold text-gray-900 hover:text-primary-600 transition-colors line-clamp-2"
                      >
                        {item.course?.title || "Khóa học"}
                      </Link>
                      {item.course?.instructor && (
                        <p className="text-sm text-gray-500 mt-1">
                          Giảng viên: {item.course.instructor.name}
                        </p>
                      )}
                    </div>

                    {/* Price & remove */}
                    <div className="text-right flex-shrink-0">
                      <p className="text-lg font-bold text-primary-600">
                        {formatPrice(item.course?.price ?? 0)}
                      </p>
                      <button
                        className={cn(
                          "mt-2 text-sm text-gray-400 hover:text-red-500 transition-colors",
                          removeFromCart.isPending && "opacity-50 pointer-events-none"
                        )}
                        onClick={() => removeFromCart.mutate(item.course_id)}
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Order summary */}
          <div className="lg:w-80 flex-shrink-0">
            <Card className="sticky top-24">
              <CardContent className="p-6">
                <h2 className="text-lg font-light text-black mb-4">Tóm tắt đơn hàng</h2>

                {/* Voucher input */}
                <div className="mb-4">
                  <label className="text-sm font-medium text-neutral-700 mb-2 block">
                    Mã giảm giá
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                      <Input
                        placeholder="Nhập mã voucher"
                        value={voucherCode}
                        onChange={(e) => setVoucherCode(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <Button variant="outline" disabled={!voucherCode}>
                      Áp dụng
                    </Button>
                  </div>
                </div>

                <div className="pt-4 space-y-3" style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-600">Tạm tính</span>
                    <span className="font-medium">
                      {formatPrice(selectedIds.length > 0 ? selectedTotal : total)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-600">Giảm giá</span>
                    <span className="font-medium text-green-600">-{formatPrice(0)}</span>
                  </div>
                  <div className="pt-3 flex items-center justify-between" style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                    <span className="font-medium text-black">Tổng cộng</span>
                    <span className="text-xl font-medium text-black">
                      {formatPrice(selectedIds.length > 0 ? selectedTotal : total)}
                    </span>
                  </div>
                </div>

                <Link
                  href={`/checkout${selectedIds.length > 0 ? `?items=${selectedIds.join(",")}` : ""}`}
                >
                  <Button
                    className="w-full mt-6"
                    size="lg"
                    disabled={selectedIds.length === 0 && items.length > 0}
                  >
                    Thanh toán {selectedIds.length > 0 && `(${selectedIds.length})`}
                  </Button>
                </Link>

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
      )}
    </div>
  );
}
