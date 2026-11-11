import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CommandPalette } from "./command-palette";

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, replace: vi.fn(), refresh: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/admin",
}));

const ITEMS = [
  { label: "Đơn hàng", href: "/admin/orders", description: "Theo dõi đơn" },
  { label: "Rút tiền giảng viên", href: "/admin/withdrawals", description: "Duyệt rút tiền" },
  { label: "Voucher", href: "/admin/vouchers", keywords: ["coupon"] },
];

const pressCtrlK = (init: KeyboardEventInit = { ctrlKey: true }) => fireEvent.keyDown(document, { key: "k", ...init });
const selectedLabel = () => screen.getByRole("option", { selected: true }).textContent;

beforeEach(() => {
  pushMock.mockClear();
});

describe("CommandPalette", () => {
  it("Ctrl+K mở hộp thoại, focus vào ô combobox nối với listbox", () => {
    render(<CommandPalette items={ITEMS} areaLabel="khu quản trị" />);
    expect(screen.queryByRole("dialog")).toBeNull();

    pressCtrlK();

    expect(screen.getByRole("dialog", { name: "Tìm chức năng trong khu quản trị" })).toBeTruthy();
    const input = screen.getByRole("combobox", { name: "Tìm chức năng" });
    expect(document.activeElement).toBe(input);
    expect(input.getAttribute("aria-controls")).toBe(screen.getByRole("listbox").id);
    expect(screen.getAllByRole("option")).toHaveLength(3);
  });

  it("Cmd+K (Mac) cũng mở, nhấn lại thì đóng", () => {
    render(<CommandPalette items={ITEMS} areaLabel="khu quản trị" />);
    pressCtrlK({ metaKey: true });
    expect(screen.getByRole("dialog")).toBeTruthy();
    pressCtrlK({ metaKey: true });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("lọc không dấu ngay khi gõ", () => {
    render(<CommandPalette items={ITEMS} areaLabel="khu quản trị" />);
    pressCtrlK();
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "rut tien" } });
    expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual(["Rút tiền giảng viênDuyệt rút tiền"]);
  });

  it("mũi tên lên/xuống đổi mục chọn (vòng tròn), aria-activedescendant đi theo", () => {
    render(<CommandPalette items={ITEMS} areaLabel="khu quản trị" />);
    pressCtrlK();
    const input = screen.getByRole("combobox");
    expect(selectedLabel()).toContain("Đơn hàng");

    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(selectedLabel()).toContain("Rút tiền giảng viên");
    expect(input.getAttribute("aria-activedescendant")).toBe(screen.getByRole("option", { selected: true }).id);

    fireEvent.keyDown(input, { key: "ArrowUp" });
    fireEvent.keyDown(input, { key: "ArrowUp" });
    expect(selectedLabel()).toContain("Voucher");
  });

  it("Enter mở mục đang chọn và đóng hộp thoại", () => {
    render(<CommandPalette items={ITEMS} areaLabel="khu quản trị" />);
    pressCtrlK();
    const input = screen.getByRole("combobox");
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(pushMock).toHaveBeenCalledWith("/admin/withdrawals");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("Esc đóng và trả focus về nút mở", () => {
    render(<CommandPalette items={ITEMS} areaLabel="khu quản trị" />);
    const trigger = screen.getByRole("button", { name: /Tìm chức năng/ });
    trigger.focus();
    fireEvent.click(trigger);
    expect(screen.getByRole("dialog")).toBeTruthy();

    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(trigger);
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("không khớp mục nào thì báo trạng thái, Enter không điều hướng", () => {
    render(<CommandPalette items={ITEMS} areaLabel="khu quản trị" />);
    pressCtrlK();
    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "khong co gi" } });
    expect(screen.getByRole("status").textContent).toContain("khong co gi");
    fireEvent.keyDown(input, { key: "Enter" });
    expect(pushMock).not.toHaveBeenCalled();
  });
});
