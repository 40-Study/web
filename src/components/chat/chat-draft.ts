/**
 * Bản nháp ô soạn tin theo từng hội thoại. Trên điện thoại, bấm "Quay lại danh sách" làm khung chat
 * unmount nên state cục bộ của ô nhập mất; lưu theo `conversation_id` ở `sessionStorage` để mở lại
 * hội thoại vẫn còn chữ đang gõ dở (và hết khi đóng tab, không lưu lâu dài nội dung riêng tư).
 *
 * Mọi truy cập bọc try/catch: `sessionStorage` có thể ném lỗi (chế độ riêng tư, chặn dữ liệu trang,
 * hết dung lượng). Khi đó chỉ mất tính năng giữ nháp, khung chat vẫn dùng bình thường.
 */

const PREFIX = "chat-draft:";

export function readDraft(conversationId: string): string {
  try {
    return window.sessionStorage.getItem(PREFIX + conversationId) ?? "";
  } catch {
    return "";
  }
}

/** Ghi nháp; chuỗi rỗng (hoặc chỉ khoảng trắng) tương đương xoá để không để rác trong storage. */
export function writeDraft(conversationId: string, text: string): void {
  try {
    if (text.trim()) window.sessionStorage.setItem(PREFIX + conversationId, text);
    else window.sessionStorage.removeItem(PREFIX + conversationId);
  } catch {
    // Không lưu được thì thôi — xem ghi chú đầu file.
  }
}
