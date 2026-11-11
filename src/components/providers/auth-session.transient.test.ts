import { toast } from "sonner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, AuthError, NetworkError, RateLimitError } from "@/lib/errors";
import { useSessionConnectionStore } from "@/lib/session-connection";
import { authService, type UnifiedRole, type UserResponseDto } from "@/services/auth.service";
import { useAuthStore, type AuthUser } from "@/stores/auth.store";
import { bootstrapAuthSession, retryBootstrapNow } from "./auth-session";

// QA-B-01 / QA-C-02 (261110): request khởi tạo phiên bị timeout/huỷ/5xx thì web xoá phiên và đá về
// /login dù cookie còn hợp lệ. Chỉ 401/403 thật (sau refresh) mới được xoá phiên.

vi.mock("@/services/auth.service", () => ({
  authService: { getMe: vi.fn(), getMyRoles: vi.fn(), getMyPermissions: vi.fn() },
}));

const user: UserResponseDto = {
  id: "user-1",
  username: "gv1",
  email: "teacher1@demo.com",
  full_name: "Giảng viên 1",
  is_active: true,
  created_at: "2026-08-09T00:00:00Z",
};
const cachedUser: AuthUser = { id: user.id, email: user.email, name: "Giảng viên 1" };
const teacherRole: UnifiedRole = { id: "r-teacher", type: "system", role_name: "TEACHER", display_name: "Giảng viên" };

function seedCachedSession() {
  useAuthStore.setState({ user: cachedUser, activeRole: "TEACHER", activeUnifiedRole: teacherRole, roles: [teacherRole] });
}

describe("bootstrap phiên khi máy chủ chậm / lỗi mạng", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(authService.getMe).mockReset();
    vi.mocked(authService.getMyRoles).mockReset().mockResolvedValue({ roles: [teacherRole] });
    vi.mocked(authService.getMyPermissions).mockReset().mockResolvedValue([]);
    window.localStorage.clear();
    window.sessionStorage.clear();
    useAuthStore.getState().clearServerSession();
    useAuthStore.setState({ hasHydrated: true });
    useSessionConnectionStore.getState().markOk();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it.each([
    ["timeout / ERR_ABORTED (NetworkError)", () => new NetworkError()],
    ["502 cổng hết giờ", () => new ApiError(502, "UNKNOWN", "Có lỗi xảy ra, vui lòng thử lại")],
    ["429 chỉ phải chờ 1s (retry_after=1)", () => new RateLimitError(1)],
  ])("%s ở /auth/me -> giữ phiên, thử lại rồi khôi phục được", async (_label, makeError) => {
    seedCachedSession();
    vi.mocked(authService.getMe).mockRejectedValueOnce(makeError()).mockResolvedValue(user);

    const pending = bootstrapAuthSession();
    await vi.advanceTimersByTimeAsync(0);

    // Trong lúc chờ thử lại: KHÔNG anonymous (guard sẽ không điều hướng /login), cache còn nguyên.
    expect(useAuthStore.getState().sessionStatus).toBe("checking");
    expect(useAuthStore.getState().user).toEqual(cachedUser);
    expect(useSessionConnectionStore.getState()).toMatchObject({ state: "retrying", attempt: 1 });

    await vi.advanceTimersByTimeAsync(2_000);
    await expect(pending).resolves.toBe("authenticated");
    expect(authService.getMe).toHaveBeenCalledTimes(2);
    expect(useAuthStore.getState()).toMatchObject({ sessionStatus: "authenticated", activeRole: "TEACHER" });
    expect(useSessionConnectionStore.getState().state).toBe("ok");
  });

  it("lỗi mạng kéo dài -> hết lượt thử lại thì báo offline, VẪN giữ user cache và không anonymous", async () => {
    seedCachedSession();
    vi.mocked(authService.getMyRoles).mockRejectedValue(new NetworkError());
    vi.mocked(authService.getMe).mockResolvedValue(user);
    const toastInfo = vi.spyOn(toast, "info").mockImplementation(() => "" as never);

    const pending = bootstrapAuthSession();
    await vi.advanceTimersByTimeAsync(2_000 + 5_000 + 10_000);

    await expect(pending).resolves.toBe("checking");
    expect(authService.getMyRoles).toHaveBeenCalledTimes(4); // 1 lần đầu + 3 lần thử lại, có giới hạn
    expect(useAuthStore.getState()).toMatchObject({ sessionStatus: "checking", user: cachedUser, activeRole: "TEACHER" });
    expect(useSessionConnectionStore.getState().state).toBe("offline");
    expect(toastInfo).not.toHaveBeenCalled(); // không báo "phiên hết hạn" sai sự thật
    toastInfo.mockRestore();
  });

  it("401 thật (sau refresh) -> vẫn xoá phiên ngay, không thử lại", async () => {
    seedCachedSession();
    vi.mocked(authService.getMe).mockRejectedValue(new AuthError("Invalid or expired token", "AUTH_ERROR"));
    const toastInfo = vi.spyOn(toast, "info").mockImplementation(() => "" as never);

    await expect(bootstrapAuthSession()).resolves.toBe("anonymous");

    expect(authService.getMe).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState()).toMatchObject({ sessionStatus: "anonymous", user: null });
    expect(useSessionConnectionStore.getState().state).toBe("ok");
    toastInfo.mockRestore();
  });
});

// 429 (261111): refresh-token có bucket riêng 30 lần/phút/IP, cửa sổ cố định. Thử lại theo nhịp 2s/5s/10s
// khi còn bị chặn chắc chắn lại nhận 429 và mất lượt thử; phải chờ đúng retry_after.
describe("bootstrap gặp 429 -> chờ đúng retry_after", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(authService.getMe).mockReset();
    vi.mocked(authService.getMyRoles).mockReset().mockResolvedValue({ roles: [teacherRole] });
    vi.mocked(authService.getMyPermissions).mockReset().mockResolvedValue([]);
    window.localStorage.clear();
    useAuthStore.getState().clearServerSession();
    useAuthStore.setState({ hasHydrated: true });
    useSessionConnectionStore.getState().markOk();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("retry_after=30 -> KHÔNG gọi lại sau 2s/5s, chỉ gọi lại sau 31s rồi khôi phục", async () => {
    seedCachedSession();
    vi.mocked(authService.getMe).mockRejectedValueOnce(new RateLimitError(30)).mockResolvedValue(user);

    const pending = bootstrapAuthSession();
    await vi.advanceTimersByTimeAsync(30_000);
    expect(authService.getMe).toHaveBeenCalledTimes(1); // vẫn đang chờ, không dội request
    expect(useAuthStore.getState()).toMatchObject({ sessionStatus: "checking", user: cachedUser });

    await vi.advanceTimersByTimeAsync(1_000);
    await expect(pending).resolves.toBe("authenticated");
    expect(authService.getMe).toHaveBeenCalledTimes(2);
  });

  it("429 không có retry_after -> chờ trọn một cửa sổ 60s", async () => {
    seedCachedSession();
    vi.mocked(authService.getMe).mockRejectedValueOnce(new RateLimitError()).mockResolvedValue(user);

    const pending = bootstrapAuthSession();
    await vi.advanceTimersByTimeAsync(59_000);
    expect(authService.getMe).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1_000);
    await expect(pending).resolves.toBe("authenticated");
  });

  it("phòng thủ: retry_after vượt trần một cửa sổ (bootstrap hiện không gặp) -> dừng thử tự động, báo offline, giữ phiên", async () => {
    seedCachedSession();
    vi.mocked(authService.getMe).mockRejectedValue(new RateLimitError(900));

    await expect(bootstrapAuthSession()).resolves.toBe("checking");
    await vi.advanceTimersByTimeAsync(120_000);

    expect(authService.getMe).toHaveBeenCalledTimes(1);
    expect(useSessionConnectionStore.getState().state).toBe("offline");
    expect(useAuthStore.getState()).toMatchObject({ sessionStatus: "checking", user: cachedUser });
  });

  it("429 liên tục vẫn tối đa 3 lần thử lại", async () => {
    seedCachedSession();
    vi.mocked(authService.getMe).mockRejectedValue(new RateLimitError(5));

    const pending = bootstrapAuthSession();
    await vi.advanceTimersByTimeAsync(3 * 11_000);

    await expect(pending).resolves.toBe("checking");
    expect(authService.getMe).toHaveBeenCalledTimes(4);
    expect(useSessionConnectionStore.getState().state).toBe("offline");
  });
});

// Review #114: đăng nhập / chọn vai (forceFresh) từng phải đợi hết lượt chờ của bootstrap trước, có thể khoảng 61s.
describe("huỷ lượt chờ thử lại", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(authService.getMe).mockReset();
    vi.mocked(authService.getMyRoles).mockReset().mockResolvedValue({ roles: [teacherRole] });
    vi.mocked(authService.getMyPermissions).mockReset().mockResolvedValue([]);
    window.localStorage.clear();
    useAuthStore.getState().clearServerSession();
    useAuthStore.setState({ hasHydrated: true });
    useSessionConnectionStore.getState().markOk();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("forceFresh trong lúc chờ 429 -> chạy ngay, lần cũ dừng và không gọi thêm", async () => {
    seedCachedSession();
    vi.mocked(authService.getMe).mockRejectedValueOnce(new RateLimitError(30)).mockResolvedValue(user);

    const oldRun = bootstrapAuthSession();
    await vi.advanceTimersByTimeAsync(0);
    expect(authService.getMe).toHaveBeenCalledTimes(1);

    const freshRun = bootstrapAuthSession(true);
    await vi.advanceTimersByTimeAsync(0); // không tua tới hết 31s

    await expect(freshRun).resolves.toBe("authenticated");
    await expect(oldRun).resolves.toBe("checking");
    expect(authService.getMe).toHaveBeenCalledTimes(2);
    expect(useSessionConnectionStore.getState().state).toBe("ok");
    await vi.advanceTimersByTimeAsync(120_000);
    expect(authService.getMe).toHaveBeenCalledTimes(2);
  });

  it("forceFresh khi request cũ đang bay rồi lỗi tạm thời -> lần cũ không vào lượt chờ", async () => {
    seedCachedSession();
    let rejectOld!: (e: unknown) => void;
    vi.mocked(authService.getMe)
      .mockImplementationOnce(() => new Promise((_, reject) => { rejectOld = reject; }))
      .mockResolvedValue(user);

    const oldRun = bootstrapAuthSession();
    await vi.advanceTimersByTimeAsync(0);
    const freshRun = bootstrapAuthSession(true);
    rejectOld(new RateLimitError(30));
    await vi.advanceTimersByTimeAsync(0);

    await expect(freshRun).resolves.toBe("authenticated");
    await expect(oldRun).resolves.toBe("checking");
  });

  it("nút Thử lại ngay -> gọi lại ngay, chỉ hiện trong lượt chờ dài", async () => {
    seedCachedSession();
    vi.mocked(authService.getMe).mockRejectedValueOnce(new RateLimitError(30)).mockResolvedValue(user);

    const pending = bootstrapAuthSession();
    await vi.advanceTimersByTimeAsync(0);
    expect(useSessionConnectionStore.getState().canRetryNow).toBe(true);

    retryBootstrapNow();
    await vi.advanceTimersByTimeAsync(0);

    await expect(pending).resolves.toBe("authenticated");
    expect(authService.getMe).toHaveBeenCalledTimes(2);
    expect(useSessionConnectionStore.getState().canRetryNow).toBe(false);
  });

  it("lượt chờ ngắn (2s) không mời bấm Thử lại ngay", async () => {
    seedCachedSession();
    vi.mocked(authService.getMe).mockRejectedValueOnce(new NetworkError()).mockResolvedValue(user);

    const pending = bootstrapAuthSession();
    await vi.advanceTimersByTimeAsync(0);
    expect(useSessionConnectionStore.getState()).toMatchObject({ state: "retrying", canRetryNow: false });

    await vi.advanceTimersByTimeAsync(2_000);
    await expect(pending).resolves.toBe("authenticated");
  });

  it("bấm Thử lại ngay vẫn tính vào giới hạn 3 lần thử lại", async () => {
    seedCachedSession();
    vi.mocked(authService.getMe).mockRejectedValue(new RateLimitError(30));

    const pending = bootstrapAuthSession();
    for (let i = 0; i < 3; i += 1) {
      await vi.advanceTimersByTimeAsync(0);
      retryBootstrapNow();
    }
    await vi.advanceTimersByTimeAsync(0);

    await expect(pending).resolves.toBe("checking");
    expect(authService.getMe).toHaveBeenCalledTimes(4);
    expect(useSessionConnectionStore.getState().state).toBe("offline");
  });

  it("401 trong lần thử sau khi bấm Thử lại ngay -> vẫn xoá phiên như cũ", async () => {
    seedCachedSession();
    vi.mocked(authService.getMe)
      .mockRejectedValueOnce(new RateLimitError(30))
      .mockRejectedValue(new AuthError("Invalid or expired token", "AUTH_ERROR"));
    const toastInfo = vi.spyOn(toast, "info").mockImplementation(() => "" as never);

    const pending = bootstrapAuthSession();
    await vi.advanceTimersByTimeAsync(0);
    retryBootstrapNow();
    await vi.advanceTimersByTimeAsync(0);

    await expect(pending).resolves.toBe("anonymous");
    expect(useAuthStore.getState()).toMatchObject({ sessionStatus: "anonymous", user: null });
    toastInfo.mockRestore();
  });
});
