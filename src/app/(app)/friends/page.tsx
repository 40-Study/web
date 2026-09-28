"use client";

/**
 * Trang "Bạn bè" — QA 260927 S-P1-4: backend chưa có router nào cho
 * friends/friend-requests (grep `backend/internal/router/` = 0 kết quả).
 * Bản cũ vẫn dựng đủ tab/ô tìm kiếm nhưng luôn CỐ Ý trả rỗng — trông như tính
 * năng đang chạy mà chỉ chưa có dữ liệu, trong khi thực chất không có cách
 * nào để nó từng có dữ liệu. Thay bằng thông báo "Sắp có" trung thực thay vì
 * danh sách rỗng giả; mục menu tương ứng cũng đã bỏ khỏi sidebar
 * (`components/layout/sidebar.tsx`).
 */

import Link from "next/link";
import { Users, ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function FriendsPage() {
  return (
    <div className="container max-w-lg mx-auto py-16 px-4">
      <Card className="p-10 text-center border-dashed">
        <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <h1 className="text-xl font-bold text-gray-900 mb-2">Bạn bè — Sắp có</h1>
        <p className="text-sm text-gray-500 mb-6">
          Tính năng kết bạn với bạn học đang được xây dựng và chưa sẵn sàng sử dụng.
          Chúng tôi sẽ thông báo khi tính năng này ra mắt.
        </p>
        <Link href="/home">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Quay lại trang chủ
          </Button>
        </Link>
      </Card>
    </div>
  );
}
