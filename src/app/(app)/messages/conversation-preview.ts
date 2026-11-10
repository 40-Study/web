import type { Conversation } from "@/services/conversation.service";

/**
 * QA-B-21: danh sách hội thoại từng ghi "Chưa có tin nhắn" kèm giờ 12:35, vì chỉ nhìn `last_message` mà bỏ qua
 * `last_message_at`/`message_count`. Hội thoại đã có tin nhưng danh sách không kèm nội dung tin cuối (tin xoá,
 * tệp đính kèm, dữ liệu cũ chưa gắn last_message) không được nói là "chưa có tin".
 */
export function conversationPreviewText(conversation: Conversation): string {
  const last = conversation.last_message;
  const content = last?.content?.trim();
  if (content) return content;
  if (last) return last.type && last.type !== "text" ? "Đã gửi một tệp đính kèm" : "Tin nhắn";
  const hasMessages = (conversation.message_count ?? 0) > 0 || !!conversation.last_message_at;
  return hasMessages ? "Mở để xem tin nhắn" : "Chưa có tin nhắn";
}

const TIME = new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit" });
const DAY = new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", day: "2-digit", month: "2-digit" });
const DAY_KEY = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });

const DAY_MS = 86_400_000;

/**
 * Tin hôm nay hiện giờ ("12:35"), hôm qua hiện "Hôm qua", cũ hơn hiện ngày ("02/10"), tất cả theo giờ VN
 * (QA-B-21 + QA-A-09): chỉ hiện giờ làm tin cũ trông như mới.
 */
export function conversationTimeLabel(iso: string | undefined, now: Date = new Date()): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const key = DAY_KEY.format(d);
  if (key === DAY_KEY.format(now)) return TIME.format(d);
  if (key === DAY_KEY.format(new Date(now.getTime() - DAY_MS))) return "Hôm qua";
  // Ghép từ formatToParts: vi-VN của một số bản ICU in "02-10" thay vì "02/10".
  const parts = new Map(DAY.formatToParts(d).map((p) => [p.type, p.value]));
  return `${parts.get("day")}/${parts.get("month")}`;
}
