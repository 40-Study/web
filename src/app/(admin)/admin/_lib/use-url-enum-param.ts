"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * QA8-A11: bộ lọc trạng thái của các trang admin (Khoá học, Hồ sơ giảng viên, Báo cáo vi phạm) nằm trên URL như
 * Đơn hàng/Cuộc thi: F5, quay lại hoặc gửi link vẫn giữ đúng bộ lọc. URL là nguồn sự thật (không có state song
 * song); giá trị lạ trên URL rơi về `fallback`, giá trị mặc định thì bỏ khỏi URL cho link gọn.
 */
export function parseEnumParam<T extends string>(raw: string | null, allowed: readonly T[], fallback: T): T {
  return raw !== null && (allowed as readonly string[]).includes(raw) ? (raw as T) : fallback;
}

export function useUrlEnumParam<T extends string>(
  name: string,
  allowed: readonly T[],
  fallback: T
): readonly [T, (next: T) => void] {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const value = parseEnumParam(searchParams.get(name), allowed, fallback);

  const setValue = useCallback(
    (next: T) => {
      const qs = new URLSearchParams(searchParams.toString());
      if (next === fallback) qs.delete(name);
      else qs.set(name, next);
      const query = qs.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [router, pathname, searchParams, name, fallback]
  );

  return [value, setValue] as const;
}
