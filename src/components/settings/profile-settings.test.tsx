/**
 * D5 (QA vòng 2): xoá trắng Tiểu sử / SĐT phải gửi "" lên backend. Trước bản vá web gửi
 * `bio: data.bio || undefined` nên trường bị bỏ khỏi body và giá trị cũ còn nguyên.
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockMutate = vi.fn();

// Tham chiếu CỐ ĐỊNH (như React Query): component reset form trong useEffect([profileData]) —
// trả object mới mỗi lần render sẽ reset -> render -> reset vô hạn và treo worker vitest.
const ME = {
  data: {
    full_name: "QA Giang Vien",
    username: "qa_teacher",
    bio: "Tiểu sử cũ",
    phone: "0900000000",
    email: "qa@40study.test",
  },
  isLoading: false,
};

vi.mock("@/hooks/queries/use-auth", () => ({
  useMe: () => ME,
  useUpdateProfile: () => ({ mutate: mockMutate, isPending: false }),
}));

vi.mock("@/stores/auth.store", () => ({
  useAuthStore: () => ({ user: null }),
}));

// eslint-disable-next-line import/first
import { ProfileSettings } from "./profile-settings";

describe("ProfileSettings", () => {
  beforeEach(() => mockMutate.mockReset());

  it("xoá trắng tiểu sử -> gửi bio chuỗi rỗng, không bỏ trường", async () => {
    render(<ProfileSettings />);
    await waitFor(() => expect((screen.getByLabelText("Tiểu sử") as HTMLTextAreaElement).value).toBe("Tiểu sử cũ"));

    fireEvent.change(screen.getByLabelText("Tiểu sử"), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Lưu thay đổi" }));

    await waitFor(() => expect(mockMutate).toHaveBeenCalledTimes(1));
    expect(mockMutate.mock.calls[0][0]).toHaveProperty("bio", "");
  });

  it("xoá SĐT đang có: gửi phone null để backend xoá (không còn chặn, không bỏ trường)", async () => {
    render(<ProfileSettings />);
    await waitFor(() => expect((screen.getByLabelText("Tiểu sử") as HTMLTextAreaElement).value).toBe("Tiểu sử cũ"));

    fireEvent.change(screen.getByLabelText("Số điện thoại"), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Lưu thay đổi" }));

    await waitFor(() => expect(mockMutate).toHaveBeenCalledTimes(1));
    expect(mockMutate.mock.calls[0][0]).toHaveProperty("phone", null);
    expect(screen.queryByText(/Chưa hỗ trợ xoá số điện thoại/)).toBeNull();
  });

  it("tài khoản chưa có SĐT: không gửi phone \"\" (backend e164 trả 400 làm hỏng cả lần lưu tiểu sử)", async () => {
    ME.data.phone = "";
    try {
      render(<ProfileSettings />);
      await waitFor(() => expect((screen.getByLabelText("Tiểu sử") as HTMLTextAreaElement).value).toBe("Tiểu sử cũ"));
      fireEvent.change(screen.getByLabelText("Tiểu sử"), { target: { value: "" } });
      fireEvent.click(screen.getByRole("button", { name: "Lưu thay đổi" }));

      await waitFor(() => expect(mockMutate).toHaveBeenCalledTimes(1));
      const payload = mockMutate.mock.calls[0][0];
      expect(payload.phone).toBeUndefined();
      expect(payload).toHaveProperty("bio", "");
    } finally {
      ME.data.phone = "0900000000";
    }
  });

  it("sửa tiểu sử -> gửi giá trị mới", async () => {
    render(<ProfileSettings />);
    await waitFor(() => expect((screen.getByLabelText("Tiểu sử") as HTMLTextAreaElement).value).toBe("Tiểu sử cũ"));
    fireEvent.change(screen.getByLabelText("Tiểu sử"), { target: { value: "QA-bio mới" } });
    fireEvent.click(screen.getByRole("button", { name: "Lưu thay đổi" }));
    await waitFor(() => expect(mockMutate).toHaveBeenCalledTimes(1));
    expect(mockMutate.mock.calls[0][0]).toMatchObject({ bio: "QA-bio mới", phone: "0900000000" });
  });
});
