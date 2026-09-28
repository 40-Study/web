/**
 * AI Chat — TẠM BỎ AI (quyết định của user 2026-09-09, xem H8 trong
 * plans/reports/code-reviewer-260909-1340-web-logic-integration.md).
 *
 * QA 260927 (P2 student, P1 guest-adjacent): mục "AI Chat" từng bị bỏ khỏi
 * menu nhưng route vẫn render trang "đang được phát triển" — với người dùng
 * cuối đây là mục chết, gây hiểu sai sản phẩm có AI. Sản phẩm 40Study không
 * làm AI (brief), nên route này redirect thẳng về trang chủ thay vì hiển thị
 * bất kỳ giao diện chat/placeholder nào.
 */

import { redirect } from "next/navigation";

export default function AiChatPage() {
  redirect("/home");
}
