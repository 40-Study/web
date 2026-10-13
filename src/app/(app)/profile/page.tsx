"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { useAuthStore } from "@/stores/auth.store";

/**
 * /profile (không kèm id) -> hồ sơ của chính người dùng (F-19, QA2 261013). Trước đây chỉ có `/profile/[userId]`
 * nên gõ /profile (hoặc link cũ) ra 404 dù đã đăng nhập. Cùng đích với tab "Cá nhân" ở bottom-nav.
 * Mất phiên do (app)/layout xử lý (về /login), trang này chỉ chờ có `user.id` rồi chuyển.
 */
export default function ProfileIndexPage() {
  const router = useRouter();
  const userId = useAuthStore((s) => s.user?.id);

  useEffect(() => {
    if (userId) router.replace(`/profile/${userId}`);
  }, [userId, router]);

  return <LoadingScreen variant="minimal" text="Đang mở hồ sơ của bạn..." />;
}
