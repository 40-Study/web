import { toast } from "sonner";
import { ACCOUNT_LOCKED_TITLE, isAccountLockedError } from "@/lib/errors";
import { PERMISSIONS, type Permission } from "@/lib/permissions";
import { getRoleHomeRoute, normalizeRole } from "@/lib/routes";
import { authService, type UnifiedRole, type UserResponseDto } from "@/services/auth.service";
import { useAuthStore, type AuthUser, type SessionStatus } from "@/stores/auth.store";

// Thông báo khoá tài khoản (Phase 1 quản lý người dùng). Phân biệt "bị khoá" với mọi lý do 401
// khác bằng `error.code === "ACCOUNT_LOCKED"`, KHÔNG so chuỗi message — review đối kháng
// (review-260928-users-pr72-pr28.md finding #5). Tiêu đề là hằng tiếng Việt, KHÔNG dùng
// `error.message` (body middleware có `error: "Please login again"`, xem lib/errors.ts).

export const AUTH_SESSION_EXPIRED_EVENT = "fortex:auth-session-expired";

const knownPermissions = new Set<string>(Object.values(PERMISSIONS));
let bootstrapPromise: Promise<SessionStatus> | null = null;

function toAuthUser(user: UserResponseDto): AuthUser {
  return {
    id: user.id,
    email: user.email,
    name: user.full_name || user.username || user.email,
    avatar: user.avatar_url,
  };
}

function isSameRoleAssignment(left: UnifiedRole, right: UnifiedRole): boolean {
  return (
    left.id === right.id &&
    left.type === right.type &&
    (left.organization_id ?? null) === (right.organization_id ?? null)
  );
}

export function resolveActiveRole(
  roles: UnifiedRole[],
  previousUnifiedRole: UnifiedRole | null,
  previousRoleName: string | null
): UnifiedRole | null {
  if (previousUnifiedRole) {
    const exactRole = roles.find((role) => isSameRoleAssignment(role, previousUnifiedRole));
    if (exactRole) return exactRole;
  }

  const normalizedPreviousRole = normalizeRole(previousRoleName);
  if (!normalizedPreviousRole) return null;

  const matchingRoles = roles.filter(
    (role) => normalizeRole(role.role_name) === normalizedPreviousRole
  );
  return matchingRoles.length === 1 ? matchingRoles[0] : null;
}

export async function loadPermissionsForRole(role: UnifiedRole | null): Promise<Permission[]> {
  if (!role) return [];

  const names = await authService.getMyPermissions();
  return names.filter((permission): permission is Permission => knownPermissions.has(permission));
}

async function runBootstrap(): Promise<SessionStatus> {
  const store = useAuthStore.getState();
  const roleSelectionToken = store.restoreSessionToken();

  // A multi-role login token is not an authenticated application session. Keep it scoped
  // to the current tab so the role-selection page can finish the existing login flow.
  if (roleSelectionToken) {
    store.setSessionStatus("anonymous");
    return "anonymous";
  }

  // Khách chưa từng đăng nhập trên trình duyệt này — không có `user` cache từ
  // lần trước (persist trong localStorage "auth-storage", xoá khi logout).
  // Bỏ qua getMe()/refresh-token hoàn toàn thay vì gọi vô điều kiện. Trước
  // đây MỌI lần tải trang của khách đều bắn 401 GET /auth/me rồi tự động
  // POST /auth/refresh-token (api-client.ts interceptor), tốn chung quota
  // rate-limit 5 lần/phút/IP với /auth/login (authRateLimiter) — vài lần tải
  // lại trang bình thường đã đủ khiến người dùng thật login ngay sau đó bị
  // 429 (QA khách P2, 260927). Người dùng ĐÃ từng đăng nhập (còn `user` cache)
  // vẫn được thử khôi phục phiên bình thường bên dưới.
  if (!store.user) {
    store.setSessionStatus("anonymous");
    return "anonymous";
  }

  const previousUnifiedRole = store.activeUnifiedRole;
  const previousRoleName = store.activeRole;
  store.setSessionStatus("checking");

  try {
    const user = await authService.getMe();
    const { roles } = await authService.getMyRoles();
    const activeUnifiedRole = resolveActiveRole(roles, previousUnifiedRole, previousRoleName);
    // Lỗi 2 (fullstack-verify-260922): trước đây lỗi nạp quyền rơi xuống catch bên dưới và xoá
    // phiên đã xác thực (getMe + getMyRoles đều 200), đẩy người dùng về trang chọn vai trò ngay
    // sau khi đăng nhập. Quyền chỉ dùng để ẩn/hiện UI (server vẫn tự kiểm), nên nạp hỏng thì giữ
    // phiên với quyền rỗng và ghi cảnh báo, không đăng xuất.
    let permissions: Permission[] = [];
    try {
      permissions = await loadPermissionsForRole(activeUnifiedRole);
    } catch (error) {
      console.warn("[auth] Không nạp được quyền của người dùng, tạm dùng quyền rỗng", error);
    }

    store.applyServerSession({
      user: toAuthUser(user),
      roles,
      activeRole: activeUnifiedRole ? normalizeRole(activeUnifiedRole.role_name) : null,
      activeUnifiedRole,
      permissions,
    });
    return "authenticated";
  } catch (error) {
    if (useAuthStore.getState().sessionToken) {
      useAuthStore.getState().setSessionStatus("anonymous");
      return "anonymous";
    }
    // Trước đây: bị đá về /login HOÀN TOÀN ÂM THẦM khi tài khoản bị admin khoá giữa phiên —
    // không có gì phân biệt với việc token hết hạn thông thường. Toast này chạy TRƯỚC khi
    // clearServerSession() — SPA điều hướng sang /login không unmount Toaster nên vẫn hiển thị.
    if (isAccountLockedError(error)) {
      toast.error(ACCOUNT_LOCKED_TITLE, {
        description: "Tài khoản của bạn đã bị quản trị viên khoá. Vui lòng liên hệ hỗ trợ.",
      });
    }
    store.clearServerSession();
    return "anonymous";
  }
}

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

export async function bootstrapAuthSession(forceFresh = false): Promise<SessionStatus> {
  if (forceFresh && bootstrapPromise) {
    await bootstrapPromise;
  }
  if (!bootstrapPromise) {
    bootstrapPromise = runBootstrap().finally(() => {
      bootstrapPromise = null;
    });
  }
  return bootstrapPromise;
}
