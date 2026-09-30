"use client";

import Link from "next/link";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

/**
 * Trang "Không tìm thấy nhóm". Nhóm SECRET với người ngoài và slug không tồn tại PHẢI ra đúng
 * một giao diện này: khác đi dù chỉ một chữ là lộ sự tồn tại của nhóm bí mật.
 */
export function GroupNotFound() {
  return (
    <div className="container mx-auto max-w-lg px-4 py-16">
      <EmptyState
        icon={SearchX}
        title="Không tìm thấy nhóm"
        description="Nhóm này không tồn tại hoặc bạn không có quyền xem."
        action={
          <Link href="/groups">
            <Button variant="outline">Về danh sách nhóm</Button>
          </Link>
        }
      />
    </div>
  );
}
