"use client";

import Link from "next/link";
import { useRoleAwareHref } from "@/hooks/use-role-aware-href";

/** Lối về từ màn "không vào được buổi học": trang page.tsx là server component nên không đọc được vai, tách ra đây. */
export function BackToClassesLink() {
  const roleAwareHref = useRoleAwareHref();
  return (
    <Link
      href={roleAwareHref("/my-courses")}
      className="mt-6 inline-block rounded-lg bg-primary-600 px-6 py-2 text-sm font-medium text-white hover:bg-primary-700"
    >
      Quay lại danh sách lớp học
    </Link>
  );
}
