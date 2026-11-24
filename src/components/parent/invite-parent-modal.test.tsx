/**
 * QA4 S15: "Mời phụ huynh" là div thường, không role="dialog"/aria-modal, không bẫy focus.
 * Dùng Dialog dùng chung: trình đọc màn hình nhận ra hộp thoại có tên, Esc đóng được.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/hooks/queries/use-invitation", () => ({
  useInviteParent: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useSentInvitations: () => ({ data: [] }),
  invitationKeys: { all: ["invitations"] },
}));
vi.mock("@tanstack/react-query", () => ({ useQueryClient: () => ({ invalidateQueries: vi.fn() }) }));

import { InviteParentModal } from "./invite-parent-modal";

describe("InviteParentModal — hộp thoại truy cập được (S15)", () => {
  it("là dialog modal có tên 'Mời phụ huynh', focus nằm trong hộp", () => {
    render(<InviteParentModal isOpen onClose={vi.fn()} />);
    const dialog = screen.getByRole("dialog", { name: "Mời phụ huynh" });
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(dialog.contains(document.activeElement)).toBe(true);
    expect(screen.getByLabelText("Email phụ huynh")).toBeTruthy();
  });

  it("Esc đóng hộp thoại", () => {
    const onClose = vi.fn();
    render(<InviteParentModal isOpen onClose={onClose} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("đóng thì không render gì", () => {
    render(<InviteParentModal isOpen={false} onClose={vi.fn()} />);
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
