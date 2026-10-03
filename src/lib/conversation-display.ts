import type { Conversation, Participant } from "@/services/conversation.service";

/**
 * Tên hiển thị của một người trong hội thoại: họ tên, rơi về user_name (cùng thứ tự với bong bóng tin nhắn,
 * components/chat/message-bubble.tsx). QA hồi quy A-12: tiêu đề/danh sách DM từng hiện user_name ("student1")
 * trong khi bong bóng hiện họ tên.
 */
export function participantDisplayName(p?: Pick<Participant, "full_name" | "user_name">): string | undefined {
  const full = p?.full_name?.trim();
  if (full) return full;
  const user = p?.user_name?.trim();
  return user || undefined;
}

/** Tên hội thoại: nhóm dùng tên nhóm; DM dùng tên người còn lại. */
export function conversationDisplayName(
  conv: Pick<Conversation, "name" | "participants"> | undefined,
  currentUserId: string
): string {
  if (!conv) return "Cuộc trò chuyện";
  if (conv.name) return conv.name;
  const other = conv.participants?.find((p) => p.user_id !== currentUserId);
  return participantDisplayName(other) ?? "Cuộc trò chuyện";
}

/**
 * Dòng phụ dưới tên ở đầu khung chat: nhóm hiện số thành viên; DM 1-1 không hiện gì (QA hồi quy A-12: "2 thành
 * viên" cho một cuộc trò chuyện hai người là thừa và gây khó hiểu).
 */
export function conversationSubtitle(conv: Pick<Conversation, "type" | "participants"> | undefined): string | null {
  if (!conv || conv.type === "DIRECT") return null;
  return `${conv.participants?.length ?? 0} thành viên`;
}

/** Khớp ô tìm kiếm theo tên nhóm, họ tên hoặc user_name của người tham gia. */
export function conversationMatchesQuery(conv: Pick<Conversation, "name" | "participants">, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (conv.name?.toLowerCase().includes(q)) return true;
  return !!conv.participants?.some(
    (p) => p.user_name?.toLowerCase().includes(q) || p.full_name?.toLowerCase().includes(q)
  );
}
