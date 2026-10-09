/**
 * React Query hooks — thông báo hệ thống do quản trị viên gửi (contract C3).
 * Xem trước = POST nhưng chỉ đọc (đếm người nhận) nên dùng useQuery để có số đếm "sống" theo đối tượng.
 */

import { useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  BroadcastPartialError,
  notificationService,
  type BroadcastAudience,
  type BroadcastNotificationType,
  type BroadcastRequest,
} from "@/services/notification.service";
import { ApiError, RateLimitError } from "@/lib/errors";
import { formatWaitDuration, getErrorMessage } from "@/lib/error-messages";

/** Hạn mức gửi của backend (router/admin_broadcast_router.go): 5 lần mỗi giờ mỗi quản trị viên. */
export const BROADCAST_MAX_PER_HOUR = 5;

export const adminBroadcastKeys = {
  preview: (audience: BroadcastAudience, roles: string[], type: BroadcastNotificationType) =>
    ["admin-broadcast", "preview", audience, [...roles].sort(), type] as const,
};

/** Đã chọn đủ điều kiện để đếm: audience=all luôn đủ, audience=roles cần ít nhất một vai trò. */
export function isBroadcastAudienceComplete(audience: BroadcastAudience, roles: string[]): boolean {
  return audience === "all" || roles.length > 0;
}

/** POST /admin/notifications/broadcast/preview — số người sẽ nhận. */
export function useBroadcastPreview(audience: BroadcastAudience, roles: string[], type: BroadcastNotificationType) {
  return useQuery({
    queryKey: adminBroadcastKeys.preview(audience, roles, type),
    queryFn: () =>
      notificationService.previewBroadcast({
        audience,
        roles: audience === "roles" ? roles : undefined,
        notification_type: type,
      }),
    enabled: isBroadcastAudienceComplete(audience, roles),
    // Số người nhận đổi theo khoá/mở tài khoản: luôn đếm lại, không dùng bản cũ trong cache.
    staleTime: 0,
    gcTime: 0,
  });
}

/** Câu tiếng Việt cho lỗi gửi; lỗi giữa chừng PHẢI nêu số người đã nhận để admin không gửi lại toàn bộ. */
export function broadcastErrorMessage(error: unknown): string {
  if (error instanceof BroadcastPartialError) {
    return `Gửi bị gián đoạn: ${error.delivered} người đã nhận thông báo. Không gửi lại toàn bộ để tránh trùng thông báo.`;
  }
  if (error instanceof RateLimitError) {
    const wait = error.retryAfter ? ` Vui lòng thử lại sau ${formatWaitDuration(error.retryAfter)}.` : "";
    return `Bạn đã gửi tối đa ${BROADCAST_MAX_PER_HOUR} thông báo hệ thống trong 1 giờ.${wait}`;
  }
  return getErrorMessage(error, "Không thể gửi thông báo");
}

/** Lỗi 4xx = server từ chối TRƯỚC khi gửi (kể cả 429): chắc chắn chưa có ai nhận, lần sau là một lần gửi mới. */
function isDefinitiveRejection(error: unknown): boolean {
  return error instanceof ApiError && error.status >= 400 && error.status < 500;
}

/**
 * POST /admin/notifications/broadcast — gửi thật; thông báo đã gửi không thu hồi được.
 *
 * Idempotency-Key (QA 261009 M2): MỘT UUID cho mỗi lần xác nhận, dùng lại khi gửi lại CÙNG nội dung sau một kết
 * quả không rõ ràng (timeout/mạng/5xx — server có thể đã gửi hoặc đang gửi tiếp). Key mới khi: gửi thành công,
 * server từ chối 4xx (chưa gửi gì), hoặc nội dung/đối tượng/loại đổi — một key không được gắn với hai nội dung.
 */
export function useSendBroadcast() {
  const pending = useRef<{ fingerprint: string; key: string } | null>(null);
  return useMutation({
    mutationFn: (body: BroadcastRequest) => {
      const fingerprint = JSON.stringify(body);
      if (pending.current?.fingerprint !== fingerprint) {
        pending.current = { fingerprint, key: crypto.randomUUID() };
      }
      return notificationService.sendBroadcast(body, pending.current.key);
    },
    onSuccess: (result) => {
      pending.current = null;
      toast.success(`Đã gửi thông báo tới ${result.recipient_count} người`);
    },
    onError: (err: unknown) => {
      if (isDefinitiveRejection(err)) pending.current = null;
      toast.error("Gửi thông báo thất bại", { description: broadcastErrorMessage(err) });
    },
  });
}
