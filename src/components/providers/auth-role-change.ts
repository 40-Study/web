import { toast } from "sonner";
import { getRoleHomeRoute, normalizeRole } from "@/lib/routes";
import { useAuthStore } from "@/stores/auth.store";
import { bootstrapAuthSession } from "./auth-session";

/** Chờ đủ lâu để người dùng đọc được toast trước khi tải lại trang ở khu vực mới. */
const ROLE_CHANGE_REDIRECT_DELAY_MS = 1500;

/**
 * Vai trò đổi phía server giữa phiên (Phase 3: admin duyệt hồ sơ giảng viên — event
 * AUTH_ROLE_CHANGED_EVENT từ api-client). Cập nhật store sang vai trò mới rồi đưa người dùng
 * về trang chủ của vai trò đó, KHÔNG bắt đăng xuất/đăng nhập lại.
 */
export async function applyServerRoleChange(newRole: string | null): Promise<void> {
  const store = useAuthStore.getState();
  const normalizedNewRole = normalizeRole(newRole);
  if (normalizedNewRole) {
    // activeUnifiedRole cũ trỏ tới TEACHER_APPLICANT — role đã bị gỡ phía server. Xoá nó để
    // resolveActiveRole() rơi xuống nhánh khớp THEO TÊN vai trò mới; giữ lại thì bootstrap
    // không tìm thấy role nào khớp và activeRole thành null (bị đẩy về màn chọn vai trò).
    store.setActiveRole(normalizedNewRole);
    store.setActiveUnifiedRole(null);
  }

  await bootstrapAuthSession(true);

  const finalRole = useAuthStore.getState().activeRole ?? normalizedNewRole;
  if (finalRole === "TEACHER") {
    toast.success("Hồ sơ giáo viên của bạn đã được duyệt", {
      description: "Đang chuyển sang khu vực giảng viên…",
    });
  } else {
    toast.info("Vai trò của bạn vừa được cập nhật");
  }

  // Tải lại trang (không router.push): layout/guard/menu của khu vực mới phải dựng lại từ đầu
  // với quyền mới, giống cách useSwitchRole đang làm.
  window.setTimeout(() => {
    window.location.href = getRoleHomeRoute(finalRole);
  }, ROLE_CHANGE_REDIRECT_DELAY_MS);
}
