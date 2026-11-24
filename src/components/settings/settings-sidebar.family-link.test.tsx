/** Q6-T03: giảng viên không có liên kết phụ huynh, mục "Gia đình" chỉ hiện cho học viên và phụ huynh. */
import { screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { renderWithQuery } from "@/test-utils/query-wrapper";
import { useAuthStore } from "@/stores/auth.store";
import { SettingsSidebar } from "./settings-sidebar";

function renderAs(role: string) {
  useAuthStore.setState({ activeRole: role });
  renderWithQuery(<SettingsSidebar activeSection="account" onSectionChange={() => {}} />);
}

describe("SettingsSidebar: mục Gia đình theo vai", () => {
  afterEach(() => useAuthStore.setState({ activeRole: null }));

  it("giảng viên không thấy 'Gia đình' nhưng vẫn thấy Trợ giúp và Đăng xuất", () => {
    renderAs("TEACHER");
    expect(screen.queryByText("Gia đình")).toBeNull();
    expect(screen.queryByText("Liên kết phụ huynh")).toBeNull();
    expect(screen.getByText("Trợ giúp & Hỗ trợ")).toBeTruthy();
    expect(screen.getByText("Đăng xuất")).toBeTruthy();
  });

  it("học viên thấy 'Gia đình - Liên kết phụ huynh'", () => {
    renderAs("STUDENT");
    expect(screen.getByText("Gia đình")).toBeTruthy();
    expect(screen.getByText("Liên kết phụ huynh")).toBeTruthy();
  });

  it("phụ huynh thấy 'Gia đình - Con của tôi'", () => {
    renderAs("PARENT");
    expect(screen.getByText("Gia đình")).toBeTruthy();
    expect(screen.getByText("Con của tôi")).toBeTruthy();
  });
});
