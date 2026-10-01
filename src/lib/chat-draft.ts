/**
 * Bản nháp ô soạn tin theo từng hội thoại. Trên điện thoại, bấm "Quay lại danh sách" làm khung chat
 * unmount nên state cục bộ của ô nhập mất; lưu ở `sessionStorage` để mở lại hội thoại vẫn còn chữ
 * đang gõ dở (và hết khi đóng tab, không lưu lâu dài nội dung riêng tư).
 *
 * Quyền riêng tư: `sessionStorage` sống theo TAB, không theo tài khoản. Vì vậy (1) khoá gắn `userId`
 * (`chat-draft:<userId>:<conversationId>`) để tài khoản khác không đọc được nháp của người trước, và
 * (2) `clearAllDrafts()` được gọi khi đăng xuất / mất phiên để không còn nháp nào trong tab.
 *
 * Mọi truy cập bọc try/catch: `sessionStorage` có thể ném lỗi (chế độ riêng tư, chặn dữ liệu trang,
 * hết dung lượng). Khi đó chỉ mất tính năng giữ nháp, khung chat vẫn dùng bình thường.
 */

export const CHAT_DRAFT_PREFIX = "chat-draft:";

const draftKey = (userId: string, conversationId: string) => `${CHAT_DRAFT_PREFIX}${userId}:${conversationId}`;

export function readDraft(userId: string, conversationId: string): string {
  try {
    return window.sessionStorage.getItem(draftKey(userId, conversationId)) ?? "";
  } catch {
    return "";
  }
}

/** Ghi nháp; chuỗi rỗng (hoặc chỉ khoảng trắng) tương đương xoá để không để rác trong storage. */
export function writeDraft(userId: string, conversationId: string, text: string): void {
  try {
    const key = draftKey(userId, conversationId);
    if (text.trim()) window.sessionStorage.setItem(key, text);
    else window.sessionStorage.removeItem(key);
  } catch {
    // Không lưu được thì thôi — xem ghi chú đầu file.
  }
}

/** Xoá MỌI nháp trong tab (mọi user, mọi hội thoại). Gọi khi đăng xuất hoặc mất phiên. */
export function clearAllDrafts(): void {
  try {
    const storage = window.sessionStorage;
    const keys: string[] = [];
    for (let i = 0; i < storage.length; i++) {
      const k = storage.key(i);
      if (k?.startsWith(CHAT_DRAFT_PREFIX)) keys.push(k);
    }
    keys.forEach((k) => storage.removeItem(k));
  } catch {
    // Không đụng được storage thì không làm gì thêm: đăng xuất vẫn phải thành công.
  }
}