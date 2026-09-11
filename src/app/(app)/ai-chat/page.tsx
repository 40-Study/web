"use client";

/**
 * AI Chat — TẠM BỎ AI (quyết định của user 2026-09-09, xem H8 trong
 * plans/reports/code-reviewer-260909-1340-web-logic-integration.md).
 *
 * Trang cũ giả lập trả lời AI bằng setTimeout + chuỗi cứng — không có
 * backend AI service (Qwen 3B qua gRPC) nào đứng sau. Thay vì để một tính
 * năng "hoạt động" nhưng thực chất là mock, hiển thị trạng thái rõ ràng:
 * "đang được phát triển", không gọi API, không giả lập trả lời.
 */

import Link from "next/link";
import { ArrowLeft, Bot, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AiChatPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center gap-6 px-4 text-center">
      <Link
        href="/home"
        className="absolute left-4 top-4 flex items-center gap-2 rounded-full p-2 text-neutral-500 hover:bg-neutral-100"
      >
        <ArrowLeft className="h-5 w-5" />
      </Link>

      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary-50">
        <Bot className="h-10 w-10 text-primary-500" />
      </div>

      <div className="max-w-md space-y-2">
        <h1 className="flex items-center justify-center gap-2 text-xl font-semibold text-black">
          <Sparkles className="h-5 w-5 text-primary-500" />
          Trợ lý AI đang được phát triển
        </h1>
        <p className="text-sm text-neutral-500">
          Tính năng trò chuyện với trợ lý AI đang được xây dựng và chưa sẵn sàng sử dụng.
          Chúng tôi sẽ thông báo khi tính năng này ra mắt.
        </p>
      </div>

      <Link href="/home">
        <Button variant="outline">Quay lại trang chủ</Button>
      </Link>
    </div>
  );
}
