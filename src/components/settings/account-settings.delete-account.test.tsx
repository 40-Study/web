/**
 * Q8-T10: hộp thoại xoá tài khoản không còn nói "xoá vĩnh viễn toàn bộ dữ liệu" (backend chỉ vô hiệu hoá) và giảng viên
 * thấy thêm điều kiện số dư ví / yêu cầu rút.
 */
import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { renderWithQuery } from "@/test-utils/query-wrapper";
import { useAuthStore } from "@/stores/auth.store";
import { AccountSettings } from "./account-settings";

const role = (name: string) => ({ id: name, type: "system" as const, role_name: name, display_name: name });
const user = { email: "a@b.vn", has2FA: false };

function open(roles: ReturnType<typeof role>[]) {
  useAuthStore.setState({ roles, activeRole: roles[0].role_name, activeUnifiedRole: roles[0] });
  renderWithQuery(<AccountSettings user={user} />);
  fireEvent.click(screen.getByRole("button", { name: "Xoá" }));
}

beforeEach(() => useAuthStore.setState({ roles: [], activeRole: null, activeUnifiedRole: null }));

describe("AccountSettings — hộp thoại xoá tài khoản (Q8-T10)", () => {
  it("không còn câu 'xoá vĩnh viễn' sai sự thật; nói rõ tài khoản bị vô hiệu hoá và đăng xuất", () => {
    open([role("STUDENT")]);
    expect(screen.queryByText(/xoá vĩnh viễn/i)).toBeNull();
    expect(screen.getByText(/vô hiệu hoá và bạn bị đăng xuất ngay/)).toBeTruthy();
  });

  it("học viên không thấy điều kiện số dư ví", () => {
    open([role("STUDENT")]);
    expect(screen.queryByText(/số dư ví bằng 0/)).toBeNull();
  });

  it("giảng viên thấy điều kiện số dư ví và yêu cầu rút đang chờ", () => {
    open([role("TEACHER"), role("STUDENT")]);
    expect(screen.getByText(/số dư ví bằng 0 và không còn yêu cầu rút tiền đang chờ/)).toBeTruthy();
  });
});
