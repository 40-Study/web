"use client";

/**
 * Nút thao tác của giảng viên trên một cuộc thi (danh sách + trang chi tiết). Hiện/ẩn theo
 * `getTeacherContestActions`; không bao giờ có "Chốt kết quả" (chỉ admin chốt).
 */

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { ApproveConfirmDialog } from "@/components/admin/review-dialogs";
import { Button } from "@/components/ui/button";
import { useDeleteContest, useSubmitContestReview } from "@/hooks/queries/use-contest-manage";
import { getTeacherContestActions } from "@/lib/contest-manage/actions";
import type { ContestManage } from "@/types/contest";

interface Props {
  contest: ContestManage;
  /** Trang chi tiết đã có form sửa ngay bên dưới → ẩn link "Sửa". */
  hideEditLink?: boolean;
  /** Sau khi xoá ở trang chi tiết thì quay về danh sách. */
  redirectAfterDelete?: boolean;
}

export function ContestRowActions({ contest, hideEditLink, redirectAfterDelete }: Props) {
  const router = useRouter();
  const actions = getTeacherContestActions(contest);
  const submitReview = useSubmitContestReview();
  const remove = useDeleteContest();
  const [confirm, setConfirm] = useState<"submit" | "delete" | null>(null);

  return (
    <div className="flex flex-wrap gap-2" data-testid="teacher-actions">
      {!hideEditLink && (
        <Button asChild variant="outline" size="sm">
          <Link href={`/teacher/contests/${contest.id}`}>{actions.canEdit ? "Xem / sửa" : "Xem"}</Link>
        </Button>
      )}
      {actions.canSubmitReview && (
        <Button size="sm" onClick={() => setConfirm("submit")} data-testid="submit-review">
          Gửi duyệt
        </Button>
      )}
      {actions.canDelete && (
        <Button size="sm" variant="destructiveGhost" onClick={() => setConfirm("delete")} data-testid="delete-contest">
          Xoá
        </Button>
      )}

      <ApproveConfirmDialog
        open={confirm === "submit"}
        title="Gửi duyệt cuộc thi"
        description={
          <>
            Gửi <strong>{contest.title}</strong> cho quản trị viên duyệt? Sau khi gửi, bạn không sửa được cuộc thi
            và bài trắc nghiệm cho tới khi bị từ chối.
          </>
        }
        confirmLabel="Gửi duyệt"
        isPending={submitReview.isPending}
        onConfirm={() => submitReview.mutate(contest.id, { onSettled: () => setConfirm(null) })}
        onClose={() => setConfirm(null)}
      />
      <ApproveConfirmDialog
        open={confirm === "delete"}
        title="Xoá cuộc thi"
        description={
          <>
            Xoá hẳn <strong>{contest.title}</strong>? Bài trắc nghiệm được giữ lại và có thể dùng cho cuộc thi khác.
          </>
        }
        confirmLabel="Xoá"
        isPending={remove.isPending}
        onConfirm={() =>
          remove.mutate(contest.id, {
            onSuccess: () => {
              if (redirectAfterDelete) router.push("/teacher/contests");
            },
            onSettled: () => setConfirm(null),
          })
        }
        onClose={() => setConfirm(null)}
      />
    </div>
  );
}
