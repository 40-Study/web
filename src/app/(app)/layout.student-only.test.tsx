/**
 * R7 (review MINOR-1): giáo viên gõ thẳng /livestream hoặc /my-grades lọt qua cổng vì resolveNavRole quy TEACHER về
 * STUDENT. Cổng route khoá theo vai THẬT qua canAccessStudentOnlyRoute (cùng hàm sidebar dùng), như /friends.
 * File riêng vì cần bắt đích router.replace.
 */

import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { usePathname } from "next/navigation";
import AppLayout from "./layout";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth.store";

const replace = vi.fn();

vi.mock("sonner", () => ({ toast: { warning: vi.fn(), success: vi.fn(), error: vi.fn() } }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace, refresh: vi.fn(), back: vi.fn(), forward: vi.fn(), prefetch: vi.fn() }),
  usePathname: vi.fn(() => "/"),
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
  redirect: vi.fn(),
  notFound: vi.fn(),
}));

vi.mock("@/components/layout/app-shell-layout", () => ({
  AppShellLayout: ({ children }: { children: React.ReactNode }) => <div data-testid="shell">{children}</div>,
}));

function renderAs(role: string, path: string) {
  vi.mocked(usePathname).mockReturnValue(path);
  useAuthStore.setState({ isAuthenticated: true, activeRole: role, hasHydrated: true, sessionStatus: "authenticated" });
  render(
    <AppLayout>
      <div data-testid="child">CHILD</div>
    </AppLayout>
  );
  return screen.queryByTestId("child");
}

describe("(app)/layout: /livestream và /my-grades chỉ dành cho học viên", () => {
  beforeEach(() => replace.mockClear());
  afterEach(() => {
    useAuthStore.setState({ isAuthenticated: false, activeRole: null, hasHydrated: false, sessionStatus: "checking" });
  });

  for (const path of ["/livestream", "/my-grades"]) {
    it(`học viên vào ${path} -> render, không chuyển hướng`, () => {
      expect(renderAs("STUDENT", path)).not.toBeNull();
      expect(replace).not.toHaveBeenCalled();
    });

    it(`giáo viên gõ thẳng ${path} -> không render, về trang chủ giáo viên`, () => {
      expect(renderAs("TEACHER", path)).toBeNull();
      expect(replace).toHaveBeenCalledWith("/teacher/schedule");
    });

    it(`phụ huynh gõ thẳng ${path} -> không render, về /home`, () => {
      expect(renderAs("PARENT", path)).toBeNull();
      expect(replace).toHaveBeenCalledWith("/home");
    });
  }
});

// Q5-T15: /my-courses, /schedule của học viên không còn render trong khung giảng viên.
describe("(app)/layout: giảng viên gõ thẳng /my-courses hoặc /schedule", () => {
  beforeEach(() => replace.mockClear());
  afterEach(() => {
    useAuthStore.setState({ isAuthenticated: false, activeRole: null, hasHydrated: false, sessionStatus: "checking" });
  });

  for (const [path, target] of [["/my-courses", "/teacher/courses"], ["/schedule", "/teacher/schedule"]] as const) {
    it(`giảng viên vào ${path} -> không render, về ${target}`, () => {
      expect(renderAs("TEACHER", path)).toBeNull();
      expect(replace).toHaveBeenCalledWith(target);
    });

    it(`học viên vào ${path} -> render, không chuyển hướng`, () => {
      expect(renderAs("STUDENT", path)).not.toBeNull();
      expect(replace).not.toHaveBeenCalled();
    });
  }
});

// Q5-T15 (M3): vai tuỳ biến của tổ chức (vd QA3_STUDENT) lần tải ĐẦU còn là mã thô trong store; guard phải đọc vai đã quy
// đổi, không thì effect chuyển hướng chạy cùng nhịp với effect quy đổi và đá học viên khỏi trang của chính họ.
describe("(app)/layout: học viên mang vai tuỳ biến của tổ chức không bị đá khỏi /my-courses, /schedule", () => {
  const SYSTEM_ROLE = (name: string) => ({ id: `sr-${name}`, type: "system" as const, role_name: name, display_name: name });
  const ORG_ROLE = (name: string) => ({ id: `or-${name}`, type: "organization" as const, role_name: name, display_name: name });

  beforeEach(() => {
    replace.mockClear();
    vi.mocked(toast.warning).mockClear();
  });
  afterEach(() => {
    useAuthStore.setState({ isAuthenticated: false, activeRole: null, roles: [], hasHydrated: false, sessionStatus: "checking" });
  });

  for (const path of ["/my-courses", "/schedule"]) {
    it(`QA3_STUDENT (vai hệ thống STUDENT) tải lần đầu ${path} -> không toast, không chuyển hướng, trang render`, () => {
      useAuthStore.setState({ roles: [SYSTEM_ROLE("STUDENT"), ORG_ROLE("QA3_STUDENT")] });
      expect(renderAs("QA3_STUDENT", path)).not.toBeNull();
      expect(useAuthStore.getState().activeRole).toBe("STUDENT");
      expect(toast.warning).not.toHaveBeenCalled();
      expect(replace).not.toHaveBeenCalled();
    });

    it(`QA3_TEACHER (vai hệ thống TEACHER) tải lần đầu ${path} -> vẫn về trang giảng viên`, () => {
      useAuthStore.setState({ roles: [SYSTEM_ROLE("TEACHER"), ORG_ROLE("QA3_TEACHER")] });
      expect(renderAs("QA3_TEACHER", path)).toBeNull();
      expect(replace).toHaveBeenCalledWith(path === "/my-courses" ? "/teacher/courses" : "/teacher/schedule");
    });
  }
});

// Q5-T15 (L2): lời nhắn khi giảng viên bị chuyển hướng không được nói "trang chủ" vì đích là trang giảng viên khác.
describe("(app)/layout: toast chuyển hướng của giảng viên khỏi /my-courses không nói 'trang chủ'", () => {
  beforeEach(() => vi.mocked(toast.warning).mockClear());
  afterEach(() => {
    useAuthStore.setState({ isAuthenticated: false, activeRole: null, roles: [], hasHydrated: false, sessionStatus: "checking" });
  });

  it("giảng viên vào /my-courses -> toast nêu trang giảng viên tương ứng", () => {
    renderAs("TEACHER", "/my-courses");
    expect(toast.warning).toHaveBeenCalledTimes(1);
    const [, options] = vi.mocked(toast.warning).mock.calls[0];
    expect(options?.description).not.toContain("trang chủ");
    expect(options?.description).toContain("giảng viên");
  });

  it("phụ huynh vào /my-courses vẫn được báo về trang chủ (đích thật là /home)", () => {
    renderAs("PARENT", "/my-courses");
    const [, options] = vi.mocked(toast.warning).mock.calls[0];
    expect(options?.description).toContain("trang chủ");
  });
});

// Q6-T02/T03: các route học viên-only còn lại cũng đưa giảng viên đi, không đá học viên (kể cả vai tổ chức) và phụ huynh.
describe("(app)/layout: Q6-T02/T03 route học viên-only cho giảng viên", () => {
  const SYSTEM_ROLE = (name: string) => ({ id: `sr-${name}`, type: "system" as const, role_name: name, display_name: name });
  const ORG_ROLE = (name: string) => ({ id: `or-${name}`, type: "organization" as const, role_name: name, display_name: name });

  beforeEach(() => replace.mockClear());
  afterEach(() => {
    useAuthStore.setState({ isAuthenticated: false, activeRole: null, roles: [], hasHydrated: false, sessionStatus: "checking" });
  });

  for (const [path, target] of [
    ["/my-assignments", "/teacher/assignments"],
    ["/my-attendance", "/teacher/classes"],
    ["/certificates", "/teacher/schedule"],
    ["/wishlist", "/teacher/schedule"],
    ["/groups", "/teacher/schedule"],
    ["/coins", "/teacher/schedule"],
    ["/achievements", "/teacher/schedule"],
    ["/leaderboard", "/teacher/schedule"],
    ["/settings/family", "/teacher/schedule"],
  ] as const) {
    it(`giảng viên vào ${path} -> không render, về ${target}`, () => {
      expect(renderAs("TEACHER", path)).toBeNull();
      expect(replace).toHaveBeenCalledWith(target);
    });

    it(`QA3_STUDENT tải lần đầu ${path} -> render, không bị đá (vai tổ chức quy về STUDENT)`, () => {
      if (path === "/settings/family") return; // học viên vào được: cùng kiểm ở test bên dưới
      useAuthStore.setState({ roles: [SYSTEM_ROLE("STUDENT"), ORG_ROLE("QA3_STUDENT")] });
      expect(renderAs("QA3_STUDENT", path)).not.toBeNull();
      expect(replace).not.toHaveBeenCalled();
    });
  }

  for (const role of ["STUDENT", "PARENT"]) {
    it(`/settings/family: ${role} vẫn vào được`, () => {
      expect(renderAs(role, "/settings/family")).not.toBeNull();
      expect(replace).not.toHaveBeenCalled();
    });
  }
});

// Q6 #130 L1: quyết định theo vai ĐANG DÙNG, không theo "có vai giảng viên nào". Người có cả STUDENT và TEACHER vào học
// với vai STUDENT thì được vào, chuyển sang TEACHER thì bị đưa đi; một lần sửa thành "có TEACHER là chặn" sẽ làm test này đỏ.
describe("(app)/layout: người dùng hai vai STUDENT + TEACHER", () => {
  const SYSTEM_ROLE = (name: string) => ({ id: `sr-${name}`, type: "system" as const, role_name: name, display_name: name });

  beforeEach(() => replace.mockClear());
  afterEach(() => {
    useAuthStore.setState({ isAuthenticated: false, activeRole: null, roles: [], hasHydrated: false, sessionStatus: "checking" });
  });

  for (const path of ["/my-assignments", "/my-courses", "/livestream"]) {
    it(`vai đang dùng STUDENT vào ${path} -> render, không chuyển hướng`, () => {
      useAuthStore.setState({ roles: [SYSTEM_ROLE("STUDENT"), SYSTEM_ROLE("TEACHER")] });
      expect(renderAs("STUDENT", path)).not.toBeNull();
      expect(replace).not.toHaveBeenCalled();
    });

    it(`vai đang dùng TEACHER vào ${path} -> không render, bị đưa về trang giảng viên`, () => {
      useAuthStore.setState({ roles: [SYSTEM_ROLE("STUDENT"), SYSTEM_ROLE("TEACHER")] });
      expect(renderAs("TEACHER", path)).toBeNull();
      expect(replace).toHaveBeenCalledTimes(1);
      expect(String(replace.mock.calls[0][0])).toMatch(/^\/teacher\//);
    });
  }
});
