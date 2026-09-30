"use client";

import { useState } from "react";
import { Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { useBlockUser, useRelationship } from "@/hooks/queries/use-friends";
import { normalizeRole } from "@/lib/routes";
import { useAuthStore } from "@/stores/auth.store";
import { FriendActionButton } from "./friend-action-button";

interface ProfileFriendActionProps {
  userId: string;
  /** Tên hiển thị của người đang xem hồ sơ, dùng cho câu xác nhận chặn. */
  name: string;
}

/** Kiểu nút trên nền xanh của header hồ sơ (chữ trắng, viền trắng). */
const ON_DARK = "border-white text-white hover:bg-white/20 bg-transparent";

/**
 * Nút kết bạn ở hồ sơ người khác. Chỉ STUDENT thấy: phụ huynh/giáo viên không có tính năng bạn bè
 * (Q1) nên KHÔNG gọi API (sẽ 403 `FRIEND_ROLE_NOT_ALLOWED`) và không hiện nút. Điều kiện theo VAI chứ
 * không theo route, vì `ProfileHeader` dùng chung cho mọi vai.
 *
 * Tách vỏ/ruột có chủ đích: vỏ chỉ đọc vai; mọi hook React Query nằm ở ruột nên vai khác (và các test
 * render cả trang hồ sơ không có QueryClientProvider) không bao giờ chạm tới chúng.
 */
export function ProfileFriendAction(props: ProfileFriendActionProps) {
  const { activeRole } = useAuthStore();
  if (normalizeRole(activeRole) !== "STUDENT") return null;
  return <StudentFriendAction {...props} />;
}

/** Người kia không phải học viên -> `GET /friends/relationship` trả 404 -> không hiện gì (không có gì để kết bạn). */
function StudentFriendAction({ userId, name }: ProfileFriendActionProps) {
  const { data } = useRelationship(userId);
  const block = useBlockUser();
  const [confirmBlock, setConfirmBlock] = useState(false);

  if (!data || data.status === "SELF") return null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 md:justify-end">
      <FriendActionButton
        userId={userId}
        status={data.status}
        requestId={data.request_id}
        name={name}
        className={ON_DARK}
      />
      {data.status !== "BLOCKED_BY_ME" && (
        <>
          <Button
            size="sm"
            variant="ghost"
            className="text-white hover:bg-white/20 hover:text-white"
            aria-label={`Chặn ${name}`}
            onClick={() => setConfirmBlock(true)}
          >
            <Ban className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Chặn
          </Button>
          <ConfirmDialog
            open={confirmBlock}
            onOpenChange={setConfirmBlock}
            title="Chặn người dùng này?"
            description={`${name} sẽ bị xoá khỏi danh sách bạn bè, không thể gửi lời mời cho bạn và không xuất hiện khi tìm kiếm.`}
            confirmLabel="Chặn"
            destructive
            pending={block.isPending}
            onConfirm={() => block.mutate(userId, { onSuccess: () => setConfirmBlock(false) })}
          />
        </>
      )}
    </div>
  );
}
