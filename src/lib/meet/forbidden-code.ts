/**
 * Diễn giải mã 403 uy quyền cố định của nhóm livestream/chat/whiteboard
 * (issue #58 review vòng 2, §7.4; ghim lại ở review vòng 2 web PR #18 §0):
 * `NOT_SESSION_MEMBER`, `KICKED`, `WHITEBOARD_LOCKED`, `NOT_SESSION_HOST`,
 * `CANNOT_KICK_HOST`, mặc định `FORBIDDEN`
 * (`internal/service/livestream_service.go:145-158`).
 *
 * Nhận thẳng MÃ đã được tách ra (không nhận error instance) để dùng được ở cả
 * client (`MeetApiError.code`) lẫn Server Component (`HttpError.body?.message`)
 * — hai nơi đó có kiểu lỗi khác nhau và `server-api.ts` import `next/headers`
 * nên không thể import chung vào bundle client.
 */
export interface ForbiddenFlags {
  isNotMember: boolean;
  isKicked: boolean;
  isLocked: boolean;
}

export function forbiddenFlagsFromCode(code?: string | null): ForbiddenFlags {
  return {
    isNotMember: code === "NOT_SESSION_MEMBER",
    isKicked: code === "KICKED",
    isLocked: code === "WHITEBOARD_LOCKED",
  };
}
