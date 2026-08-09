import { useEffect } from "react";

export function useMarkConversationRead(
  conversationId: string | null,
  markAsRead: (conversationId: string) => void
) {
  useEffect(() => {
    if (conversationId) {
      markAsRead(conversationId);
    }
  }, [conversationId, markAsRead]);
}
