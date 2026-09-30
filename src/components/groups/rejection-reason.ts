/** Lý do một người không được mời vào nhóm, theo `rejected[].code` của backend (contract §2). */

const REASONS: Record<string, string> = {
  GROUP_INVITE_NOT_ALLOWED: "Chưa có quan hệ để mời",
  GROUP_MEMBER_BANNED: "Đang bị cấm khỏi nhóm",
  GROUP_FULL: "Nhóm đã đầy",
  GROUP_ALREADY_MEMBER: "Đã trong nhóm",
};

/** Mã lạ (backend thêm lý do mới) vẫn ra câu tiếng Việt, không in mã thô cho người dùng. */
export const UNKNOWN_REJECTION_REASON = "Không thể mời";

export function rejectionReason(code: string): string {
  return REASONS[code] ?? UNKNOWN_REJECTION_REASON;
}
