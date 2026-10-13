"use client";

import Image from "next/image";
import Link from "next/link";
import { BookOpen, Heart } from "lucide-react";
import { QueryState } from "@/components/common/query-state";
import { CartItemPrice } from "@/components/cart/cart-item-price";
import { Button } from "@/components/ui/button";
import { useToggleWishlist, useWishlist } from "@/hooks/queries/use-wishlist";
import { getCartItemPrices } from "@/lib/cart-pricing";
import type { WishlistItem } from "@/services/wishlist.service";

const LEVEL_LABELS: Record<string, string> = {
  beginner: "Cơ bản",
  intermediate: "Trung cấp",
  advanced: "Nâng cao",
};

function WishlistRow({ item }: { item: WishlistItem }) {
  const toggle = useToggleWishlist();
  const course = item.course;
  if (!course) return null;
  const isFree = getCartItemPrices(item).price === 0;
  const meta = [LEVEL_LABELS[course.level ?? ""], course.total_lessons ? `${course.total_lessons} bài học` : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <li className="flex gap-4 rounded-xl border bg-card p-3 sm:p-4">
      <div className="relative h-20 w-32 shrink-0 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
        {course.thumbnail_url ? (
          <Image src={course.thumbnail_url} alt="" fill sizes="128px" className="object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <BookOpen className="h-8 w-8 text-slate-300" aria-hidden="true" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <Link href={`/courses/${course.slug}`} className="line-clamp-2 font-semibold hover:text-primary-600">
          {course.title}
        </Link>
        {course.instructor_name && <p className="text-sm text-muted-foreground">{course.instructor_name}</p>}
        {meta && <p className="text-xs text-muted-foreground">{meta}</p>}
        <p className="mt-1 font-semibold">{isFree ? "Miễn phí" : <CartItemPrice item={item} />}</p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="self-start text-rose-600"
        disabled={toggle.isPending}
        onClick={() => toggle.mutate({ courseId: item.course_id, saved: true })}
        aria-label={`Bỏ khỏi danh sách yêu thích: ${course.title}`}
      >
        <Heart className="h-4 w-4 fill-rose-500" aria-hidden="true" />
      </Button>
    </li>
  );
}

/** Danh sách khoá học đã lưu (QA2 F-10). */
export default function WishlistPage() {
  const { data, isLoading, isError, error, refetch } = useWishlist();
  const items = data?.items ?? [];

  return (
    <div className="page-container space-y-6 py-8">
      <div>
        <h1 className="text-2xl font-bold">Khoá học yêu thích</h1>
        {!isLoading && !isError && <p className="text-sm text-muted-foreground">{items.length} khoá học</p>}
      </div>
      <QueryState
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={() => refetch()}
        isEmpty={items.length === 0}
        emptyTitle="Bạn chưa lưu khoá học nào"
        emptyDescription={
          <Link href="/courses" className="font-medium text-primary-600 hover:underline">
            Khám phá khoá học
          </Link>
        }
      >
        <ul className="space-y-3">
          {items.map((item) => (
            <WishlistRow key={item.id} item={item} />
          ))}
        </ul>
      </QueryState>
    </div>
  );
}
