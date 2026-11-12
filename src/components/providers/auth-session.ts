import { toast } from "sonner";
import { ACCOUNT_LOCKED_TITLE, AuthError, isAccountLockedError } from "@/lib/errors";
import { SESSION_EXPIRED_MESSAGE } from "@/lib/error-messages";
import { useSessionConnectionStore } from "@/lib/session-connection";
import { classifySessionBootstrapError, getBootstrapRetryDelay } from "@/lib/session-failure-policy";
import { useAuthStore, type SessionStatus } from "@/stores/auth.store";
import { loadServerSession } from "./auth-session-load";

// Thông báo khoá tài khoản (Phase 1 quản lý người dùng). Phân biệt "bị khoá" với mọi lý do 401
// khác bằng `error.code === "ACCOUNT_LOCKED"`, KHÔNG so chuỗi message — review đối kháng
// (review-260928-users-pr72-pr28.md finding #5). Tiêu đề là hằng tiếng Việt, KHÔNG dùng
// `error.message` (body middleware có `error: "Please login again"`, xem lib/errors.ts).

export const AUTH_SESSION_EXPIRED_EVENT = "fortex:auth-session-expired";

let bootstrapPromise: Promise<SessionStatus> | null = null;
/** Đánh thức lượt chờ thử lại đang chạy (null khi không có lượt chờ nào). */
let wakeRetryWait: (() => void) | null = null;
/** Lần bootstrap đang chạy phải dừng thử lại vì caller vừa có cookie mới (forceFresh). */
let retriesCancelled = false;

/**
 * @param sessionJustEstablished true khi caller vừa nhận response hoàn tất đăng nhập / đổi vai
 * trò từ server (cookie phiên vừa được đặt): select-role, OAuth success, switch-role, login 1 vai
 * trò. Khi đó PHẢI gọi getMe dù store chưa có `user` cache — xem nhánh guard khách bên dưới.
 */
async function runBootstrap(sessionJustEstablished: boolean): Promise<SessionStatus> {
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
  // POST /auth/refresh-token (api-client.ts interceptor). Hồi đó refresh còn
  // dùng chung bucket 5 lần/phút/IP với /auth/login nên vài lần tải lại trang
  // đã khiến người dùng login ngay sau đó bị 429 (QA khách P2, 260927). Từ
  // backend #69 refresh-token có bucket riêng 30 lần/phút/IP, guard này giữ
  // lại để khỏi bắn 2 request vô ích. Người dùng ĐÃ từng đăng nhập (còn `user` cache)
  // vẫn được thử khôi phục phiên bình thường bên dưới.
  //
  // Guard này CHỈ áp cho bootstrap thụ động lúc tải trang. Tài khoản nhiều vai trò: response
  // /auth/login không có `user` (backend chỉ trả `user` khi Completed=true, tức 1 vai trò), và
  // `user` chỉ được ghi vào store qua applyServerSession() SAU getMe(). Trước đây guard chặn luôn
  // lần bootstrap ngay sau select-role / OAuth success, nên getMe() không bao giờ chạy, `user` ở
  // lại null trong "auth-storage" và mọi lần tải lại trang đều bị đá về /login dù cookie hợp lệ.
  if (!store.user && !sessionJustEstablished) {
    store.setSessionStatus("anonymous");
    return "anonymous";
  }

  const previousUnifiedRole = store.activeUnifiedRole;
  const previousRoleName = store.activeRole;
  const hadCachedUser = Boolean(store.user);
  store.setSessionStatus("checking");
  const connection = useSessionConnectionStore.getState();
  // Banner đang báo sự cố (offline, hoặc "đang thử lại" còn sót từ lần chạy trước) mà một request
  // mới sắp chạy: chuyển về "đang thử lại" không kèm nút, để banner không mời bấm "Thử lại" /
  // "Thử lại ngay" trong lúc request đang bay (việc để sau #27).
  if (connection.state !== "ok") connection.markRetrying(0);

  for (let attempt = 0; ; attempt += 1) {
    try {
      store.applyServerSession(await loadServerSession(previousUnifiedRole, previousRoleName));
      connection.markOk();
      return "authenticated";
    } catch (error) {
      if (useAuthStore.getState().sessionToken) {
        connection.markOk();
        useAuthStore.getState().setSessionStatus("anonymous");
        return "anonymous";
      }
      // QA-B-01 / QA-C-02: timeout, mất mạng, 5xx, 429 KHÔNG phải bằng chứng phiên hết hạn (cookie
      // thường vẫn hợp lệ — QA gọi lại /auth/me ngay sau đó được 200). Giữ nguyên `user` cache và
      // trạng thái `checking` (guard không điều hướng), thử lại có giới hạn rồi báo mất kết nối.
      if (classifySessionBootstrapError(error) === "transient") {
        // Bị huỷ vì caller vừa có cookie mới (forceFresh): lần chạy mới sẽ tự báo kết quả. Phải xoá
        // trạng thái "đang thử lại" của lần cũ, nếu không banner vẫn hiện "Thử lại ngay" trong lúc
        // request mới đang chạy (việc để sau #26).
        if (retriesCancelled) return stopCancelledRun(connection);
        const delay = getBootstrapRetryDelay(attempt, error);
        if (delay === null) {
          connection.markOffline();
          return "checking";
        }
        connection.markRetrying(attempt + 1, delay);
        await wait(delay);
        if (retriesCancelled) return stopCancelledRun(connection);
        connection.markRetrying(attempt + 1);
        continue;
      }
      connection.markOk();
      notifySessionRejected(error, hadCachedUser);
      store.clearServerSession();
      return "anonymous";
    }
  }
}

function stopCancelledRun(connection: ReturnType<typeof useSessionConnectionStore.getState>): SessionStatus {
  connection.markOk();
  return "checking";
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    const finish = () => {
      clearTimeout(timer);
      wakeRetryWait = null;
      resolve();
    };
    const timer = setTimeout(finish, ms);
    wakeRetryWait = finish;
  });
}

/** Nút "Thử lại ngay": bỏ phần chờ còn lại. Lần thử này vẫn tính vào giới hạn số lần thử lại. */
export function retryBootstrapNow(): void {
  wakeRetryWait?.();
}

function notifySessionRejected(error: unknown, hadCachedUser: boolean): void {
  // Trước đây: bị đá về /login HOÀN TOÀN ÂM THẦM khi tài khoản bị admin khoá giữa phiên —
  // không có gì phân biệt với việc token hết hạn thông thường. Toast này chạy TRƯỚC khi
  // clearServerSession() — SPA điều hướng sang /login không unmount Toaster nên vẫn hiển thị.
  if (isAccountLockedError(error)) {
    toast.error(ACCOUNT_LOCKED_TITLE, {
      description: "Tài khoản của bạn đã bị quản trị viên khoá. Vui lòng liên hệ hỗ trợ.",
    });
  } else if (hadCachedUser && error instanceof AuthError) {
    // N-08 / C3: người dùng ĐANG có phiên (còn `user` cache) mà server trả 401 cả sau refresh →
    // phiên hết hạn/bị thu hồi. Layout sẽ đưa về /login; toast cho biết vì sao.
    toast.info(SESSION_EXPIRED_MESSAGE);
  }
}

/**
 * @param forceFresh true = caller vừa hoàn tất đăng nhập / đổi vai trò phía server (cookie mới):
 * chờ lần bootstrap đang chạy (nếu có) rồi chạy lại, và luôn gọi getMe dù chưa có `user` cache.
 */
export async function bootstrapAuthSession(forceFresh = false): Promise<SessionStatus> {
  if (forceFresh && bootstrapPromise) {
    // Lần chạy cũ có thể đang chờ tới khoảng 61s (429); đăng nhập / chọn vai không được kẹt sau nó.
    // Huỷ lượt chờ và các lần thử còn lại. Request đang bay thì vẫn đợi xong, để kết quả cũ không
    // ghi đè lên phiên mới.
    retriesCancelled = true;
    wakeRetryWait?.();
    await bootstrapPromise;
  }
  if (!bootstrapPromise) {
    retriesCancelled = false;
    bootstrapPromise = runBootstrap(forceFresh).finally(() => {
      bootstrapPromise = null;
    });
  }
  return bootstrapPromise;
}
