/**
 * Q10-STU-04: hết hạn mức mời phụ huynh trong ngày. Hộp thoại phải nói đúng lý do backend trả (không phải câu chung
 * "Có lỗi xảy ra khi gửi lời mời") và không đưa nút "Thử lại" vô nghĩa (gửi lại chắc chắn lại lỗi trong 24 giờ).
 * Http layer ném `ApiError`, không phải lỗi axios `response.data.message`.
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mutateAsync = vi.fn();
vi.mock("@/hooks/queries/use-invitation", () => ({
  useInviteParent: () => ({ mutateAsync, isPending: false }),
  useSentInvitations: () => ({ data: [] }),
  invitationKeys: { sent: () => ["invitations", "sent"] },
}));
vi.mock("@tanstack/react-query", () => ({ useQueryClient: () => ({ invalidateQueries: vi.fn() }) }));

import { InviteParentModal } from "./invite-parent-modal";
import { ApiError } from "@/lib/errors";

const LIMIT_MESSAGE = "Bạn đã đạt giới hạn gửi lời mời phụ huynh trong ngày. Vui lòng thử lại sau 24 giờ.";

async function submitInvite(error: unknown) {
  mutateAsync.mockRejectedValueOnce(error);
  render(<InviteParentModal isOpen onClose={vi.fn()} />);
  fireEvent.change(screen.getByLabelText("Email phụ huynh"), { target: { value: "ph@example.com" } });
  fireEvent.click(screen.getByRole("button", { name: /Gửi lời mời/ }));
  await screen.findByText("Không thể gửi lời mời");
}

beforeEach(() => mutateAsync.mockReset());

describe("InviteParentModal — lỗi gửi lời mời (Q10-STU-04)", () => {
  it("hết hạn mức (400): hiện đúng câu của backend, chỉ có 'Đóng', không có 'Thử lại'", async () => {
    await submitInvite(new ApiError(400, "BAD_REQUEST", LIMIT_MESSAGE));
    expect(screen.getByText(LIMIT_MESSAGE)).toBeTruthy();
    expect(screen.queryByText("Có lỗi xảy ra khi gửi lời mời")).toBeNull();
    expect(screen.queryByRole("button", { name: "Thử lại" })).toBeNull();
    expect(screen.getByRole("button", { name: "Đóng" })).toBeTruthy();
  });

  it("tính năng đang tắt (403): hiện câu của backend, không có 'Thử lại'", async () => {
    await submitInvite(new ApiError(403, "ERR_FEATURE_DISABLED", "Tính năng mời phụ huynh đang tạm tắt."));
    expect(screen.getByText("Tính năng mời phụ huynh đang tạm tắt.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Thử lại" })).toBeNull();
  });

  it("lỗi tạm (5xx): vẫn có 'Thử lại' quay về form, kèm câu chung", async () => {
    await submitInvite(new ApiError(500, "UNKNOWN", "Có lỗi xảy ra, vui lòng thử lại"));
    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    await waitFor(() => expect(screen.getByLabelText("Email phụ huynh")).toBeTruthy());
  });
});
