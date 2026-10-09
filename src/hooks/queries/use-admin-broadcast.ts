/**
 * React Query hooks — thông báo hệ thống do quản trị viên gửi (contract C3).
 * Xem trước = POST nhưng chỉ đọc (đếm người nhận) nên dùng useQuery để có số đếm "sống" theo đối tượng.
 */

import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  BroadcastPartialError,
  notificationService,
  type BroadcastAudience,
  type BroadcastRequest,
} from "@/services/notification.service";
import { RateLimitError } from "@/lib/errors";
import { formatWaitDuration, getErrorMessage } from "@/lib/error-messages";

/** Hạn mức gửi của backend (router/admin_broadcast_router.go): 5 lần mỗi giờ mỗi quản trị viên. */
export const BROADCAST_MAX_PER_HOUR = 5;

export const adminBroadcastKeys = {
  preview: (audience: BroadcastAudience, roles: string[]) =>
    ["admin-broadcast", "preview", audience, [...roles].sort()] as const,
};

/** Đã chọn đủ điều kiện để đếm: audience=all luôn đủ, audience=roles cần ít nhất một vai trò. */
export function isBroadcastAudienceComplete(audience: BroadcastAudience, roles: string[]): boolean {
  return audience === "all" || roles.length > 0;
}

/** POST /admin/notifications/broadcast/preview — số người sẽ nhận. */
export function useBroadcastPreview(audience: BroadcastAudience, roles: string[]) {
  return useQuery({
    queryKey: adminBroadcastKeys.preview(audience, roles),
    queryFn: () =>
      notificationService.previewBroadcast({
        audience,
        roles: audience === "roles" ? roles : undefined,
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

/** POST /admin/notifications/broadcast — gửi thật; thông báo đã gửi không thu hồi được. */
export function useSendBroadcast() {
  return useMutation({
    mutationFn: (body: BroadcastRequest) => notificationService.sendBroadcast(body),
    onSuccess: (result) => {
      toast.success(`Đã gửi thông báo tới ${result.recipient_count} người`);
    },
    onError: (err: unknown) => {
      toast.error("Gửi thông báo thất bại", { description: broadcastErrorMessage(err) });
    },
  });
}
