/**
 * Q6-T09: /teacher/ai khi AI chưa cấu hình hiện chỉ dẫn vận hành ("Cấu hình API key, base URL và model Viettel AI trong
 * env backend") cho giảng viên, kèm "Kiểm tra lại" bế tắc. Giảng viên phải đọc câu họ làm được; chỉ quản trị hệ thống
 * thấy chỉ dẫn env. Render workspace thật với /open-design/status trả configured=false.
 */
import { screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithQuery } from "@/test-utils/query-wrapper";
import { useAuthStore } from "@/stores/auth.store";

vi.mock("@/services/open-design.service", () => ({
  openDesignService: { status: vi.fn().mockResolvedValue({ configured: false }) },
}));

import { OpenDesignWorkspace } from "./workspace";

const ENV_HINT = /env backend|API key|base URL/;

function renderAs(role: string) {
  useAuthStore.setState({
    isAuthenticated: true,
    hasHydrated: true,
    sessionStatus: "authenticated",
    activeRole: role,
    user: { id: "u1", name: "GV", email: "gv@x.vn" } as never,
  });
  renderWithQuery(<OpenDesignWorkspace />);
}

describe("OpenDesignWorkspace: AI chưa cấu hình (Q6-T09)", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => useAuthStore.setState({ isAuthenticated: false, activeRole: null, user: null, sessionStatus: "checking" }));

  it("giảng viên: câu liên hệ quản trị viên, không có chỉ dẫn env/API key ở bất kỳ chỗ nào", async () => {
    renderAs("TEACHER");
    expect(await screen.findByText("Tính năng AI chưa được bật, vui lòng liên hệ quản trị viên.")).toBeTruthy();
    expect(await screen.findByText(/Sau khi quản trị viên bật AI/)).toBeTruthy();
    expect(screen.queryByText(ENV_HINT)).toBeNull();
    expect(screen.queryByText(/Cần hoàn tất cấu hình/)).toBeNull();
  });
});
