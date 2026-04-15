"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart, useRemoveFromCart } from "@/hooks/queries/use-cart";
import { useCartStore } from "@/stores/cart.store";
import { cn } from "@/lib/utils";

function formatPrice(price: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
}

export function CartDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: cartData, isLoading } = useCart();
  const removeFromCart = useRemoveFromCart();
  const { syncFromApi } = useCartStore();

  // Sync cart data to store
  useEffect(() => {
    if (cartData) {
      syncFromApi(cartData);
    }
  }, [cartData, syncFromApi]);

  const items = cartData?.items ?? [];
  const total = cartData?.total ?? 0;
  const itemCount = cartData?.item_count ?? 0;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Cart button */}
      <button
        className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
        onClick={() => setIsOpen((v) => !v)}
        aria-label="Giỏ hàng"
      >
        <ShoppingCart className="w-5 h-5" />
        {itemCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-primary-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
            {itemCount > 99 ? "99+" : itemCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-12 w-80 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-gray-900 dark:text-white">
                Giỏ hàng ({itemCount})
              </p>
              {itemCount > 0 && (
                <Link
                  href="/cart"
                  className="text-xs text-primary-600 hover:underline font-medium"
                  onClick={() => setIsOpen(false)}
                >
                  Xem tất cả
                </Link>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : items.length === 0 ? (
              <div className="py-8 text-center">
                <ShoppingCart className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="text-sm text-gray-500">Giỏ hàng trống</p>
                <Link href="/courses" onClick={() => setIsOpen(false)}>
                  <Button variant="link" className="mt-2 text-primary-600">
                    Khám phá khóa học
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {items.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    {/* Thumbnail */}
                    <div className="relative w-16 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
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

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/courses/${item.course_id}`}
                        className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 hover:text-primary-600 transition-colors"
                        onClick={() => setIsOpen(false)}
                      >
                        {item.course?.title || "Khóa học"}
                      </Link>
                      <p className="text-sm font-semibold text-primary-600 mt-0.5">
                        {formatPrice(item.course?.price ?? 0)}
                      </p>
                    </div>

                    {/* Remove button */}
                    <button
                      className={cn(
                        "p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors",
                        removeFromCart.isPending && "opacity-50 pointer-events-none"
                      )}
                      onClick={() => removeFromCart.mutate(item.course_id)}
                      aria-label="Xóa khỏi giỏ hàng"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                {items.length > 5 && (
                  <div className="px-4 py-2 text-center">
                    <p className="text-xs text-gray-500">
                      +{items.length - 5} khóa học khác
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-600 dark:text-gray-400">Tổng cộng:</span>
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  {formatPrice(total)}
                </span>
              </div>
              <Link href="/checkout" onClick={() => setIsOpen(false)}>
                <Button className="w-full bg-primary-600 hover:bg-primary-700">
                  Thanh toán
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
