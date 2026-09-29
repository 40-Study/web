"use client";

/**
 * Lối vào "Đăng ký làm giảng viên" cho user ĐÃ có vai trò (vd học viên) — Phase 3.
 *
 * Màn chọn vai trò chỉ hiện TEACHER_APPLICANT ở lần đăng nhập đầu, nên user cũ không có đường
 * nộp đơn. Khối này: tạo profile TEACHER_APPLICANT (POST /auth/me/profiles) rồi chuyển vai trò
 * bằng luồng switch-role sẵn có (useSwitchRole bootstrap lại phiên và điều hướng về trang chủ
 * của vai trò mới = /teacher-application, xem ROLE_HOME_ROUTES).
 */

import { useState } from "react";
import { GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { siteConfig } from "@/lib/constants";
import { useSwitchRole } from "@/hooks/queries/use-auth";
import { ApiError } from "@/lib/errors";
import { normalizeRole } from "@/lib/routes";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/stores/auth.store";

const APPLICANT_ROLE = "TEACHER_APPLICANT";
const APPLICATION_ROUTE = "/teacher-application";

/**
 * Vai trò KHÔNG được thấy lối đăng ký: đã là giảng viên thì hết việc; SYSTEM_ADMIN/ORG_OWNER vào
 * được /settings (qua (app)/layout) nhưng bấm nút sẽ tự tạo profile TEACHER_APPLICANT cho quản trị
 * viên — sai nghiệp vụ. ORG_OWNER xét cả khi nó là role tổ chức trong danh sách roles.
 */
const INELIGIBLE_ROLES = new Set(["TEACHER", "SYSTEM_ADMIN", "ORG_OWNER"]);

/** Backend trả lỗi này khi profile đã tồn tại — coi như thành công, đi tiếp sang switch-role. */
function isAlreadyHaveProfileError(error: unknown): boolean {
  return error instanceof ApiError && /already have/i.test(error.message);
}

export function ApplyTeacherButton() {
  const roles = useAuthStore((s) => s.roles);
  const activeRole = useAuthStore((s) => s.activeRole);
  const switchRole = useSwitchRole();
  const [isWorking, setIsWorking] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const isIneligible =
    INELIGIBLE_ROLES.has(normalizeRole(activeRole) ?? "") ||
    roles.some((r) => INELIGIBLE_ROLES.has(normalizeRole(r.role_name) ?? ""));
  const applicantRole = roles.find((r) => normalizeRole(r.role_name) === APPLICANT_ROLE);

  if (isIneligible) return null;

  /**
   * switch-role yêu cầu role_id = SystemRole.ID (UnifiedRole.id của role hệ thống chính là nó).
   * Lỗi đã được useSwitchRole toast ("Đổi vai trò thất bại") — chỉ nuốt để không toast đôi.
   */
  const switchToApplicant = async (systemRoleId: string) => {
    try {
      await switchRole.mutateAsync({ role_id: systemRoleId, role_type: "system" });
    } catch {
      /* toast ở onError của useSwitchRole */
    }
  };

  /** Trả SystemRole.ID của TEACHER_APPLICANT sau khi đảm bảo user đã có profile đó; null = đã báo lỗi. */
  const ensureApplicantProfile = async (): Promise<string | null> => {
    let targetId: string | undefined;
    try {
      const { system_roles } = await authService.getAllSystemRoles();
      targetId = system_roles.find((r) => normalizeRole(r.name) === APPLICANT_ROLE)?.id;
    } catch {
      toast.error("Không tải được danh sách vai trò, vui lòng thử lại.");
      return null;
    }
    if (!targetId) {
      toast.error("Hệ thống chưa mở đăng ký giảng viên. Vui lòng thử lại sau.");
      return null;
    }
    try {
      await authService.createProfile({ system_role_id: targetId });
    } catch (error) {
      if (!isAlreadyHaveProfileError(error)) {
        toast.error("Không thể tạo hồ sơ ứng tuyển, vui lòng thử lại.");
        return null;
      }
    }
    return targetId;
  };

  const run = async () => {
    setIsWorking(true);
    try {
      if (applicantRole && normalizeRole(activeRole) === APPLICANT_ROLE) {
        window.location.href = APPLICATION_ROUTE;
        return;
      }
      const systemRoleId = applicantRole ? applicantRole.id : await ensureApplicantProfile();
      if (systemRoleId) await switchToApplicant(systemRoleId);
    } finally {
      setIsWorking(false);
    }
  };

  /**
   * Bấm lần đầu (chưa có hồ sơ) là tạo hồ sơ ứng viên VÀ đổi vai trò đang dùng sang ứng viên —
   * trang chủ đổi theo, menu học viên biến mất (QA vòng 2, F8). Một cú click không được làm
   * chừng đó việc: hỏi xác nhận trước. "Xem hồ sơ ứng tuyển" (đã có hồ sơ) chỉ điều hướng nên
   * không cần hỏi.
   */
  const handleClick = () => {
    if (applicantRole) {
      void run();
      return;
    }
    setConfirmOpen(true);
  };

  const handleConfirm = () => {
    setConfirmOpen(false);
    void run();
  };

  const label = applicantRole ? "Xem hồ sơ ứng tuyển" : "Đăng ký làm giảng viên";

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-emerald-50 rounded-xl">
            <GraduationCap className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">Giảng dạy trên {siteConfig.name}</p>
            <p className="text-sm text-gray-500">
              {applicantRole
                ? "Bạn đã có hồ sơ ứng tuyển — xem trạng thái duyệt."
                : "Nộp hồ sơ để quản trị viên duyệt bạn trở thành giảng viên."}
            </p>
          </div>
        </div>
        <Button
          size="sm"
          className="rounded-xl shrink-0"
          onClick={handleClick}
          isLoading={isWorking}
          data-testid="apply-teacher-button"
        >
          {label}
        </Button>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Đăng ký làm giảng viên?</DialogTitle>
            <DialogDescription>
              Hệ thống sẽ tạo hồ sơ ứng tuyển và chuyển bạn sang vai trò ứng viên giảng viên để điền
              hồ sơ. Hồ sơ cần quản trị viên duyệt. Bạn vẫn có thể quay lại vai trò hiện tại từ trang
              hồ sơ ứng tuyển.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} data-testid="apply-teacher-cancel">
              Để sau
            </Button>
            <Button onClick={handleConfirm} data-testid="apply-teacher-confirm">
              Xác nhận đăng ký
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
