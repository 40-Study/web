/** Q7-PG-05: h1 của trang auth là tiêu đề mục đích ("Đăng nhập"), không phải thương hiệu "ForteX". */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AuthCard } from "./auth-card";
import { AuthIconHeader } from "./auth-icon-header";

describe("heading của trang auth", () => {
  it("AuthCard: 'ForteX' không phải heading", () => {
    render(<AuthCard>nội dung</AuthCard>);
    expect(screen.getByText("ForteX")).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "ForteX" })).toBeNull();
    expect(screen.queryAllByRole("heading", { level: 1 })).toHaveLength(0);
  });

  it("AuthCard + tiêu đề mục đích: đúng một h1 và là tiêu đề mục đích", () => {
    render(
      <AuthCard>
        <AuthIconHeader icon={<span />} title="Quên mật khẩu" description="Nhập email" />
      </AuthCard>
    );
    const h1 = screen.getAllByRole("heading", { level: 1 });
    expect(h1).toHaveLength(1);
    expect(h1[0].textContent).toBe("Quên mật khẩu");
  });
});
