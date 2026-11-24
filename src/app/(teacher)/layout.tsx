import { RoleGuard } from "@/components/guards";
import { SessionPendingSkeleton } from "@/components/guards/session-pending-skeleton";
import { TeacherFrame } from "@/components/layout/teacher-frame";
import { DOMAIN_ACCESS_POLICY } from "@/lib/domain-access-policy";

export default function TeacherRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Mất phiên giữa chừng: đăng nhập lại xong quay về đúng trang giảng viên đang xem (C3).
    // UX-B-01: trong lúc kiểm phiên vẫn vẽ khung giảng viên + skeleton, không để màn trắng.
    <RoleGuard
      roles={[...DOMAIN_ACCESS_POLICY.teacher]}
      returnToCurrentPath
      pendingFallback={
        <TeacherFrame>
          <SessionPendingSkeleton />
        </TeacherFrame>
      }
    >
      <TeacherFrame>{children}</TeacherFrame>
    </RoleGuard>
  );
}
