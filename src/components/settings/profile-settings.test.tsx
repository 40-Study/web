/**
 * D5 (QA vòng 2): xoá trắng Tiểu sử / SĐT phải gửi "" lên backend. Trước bản vá web gửi
 * `bio: data.bio || undefined` nên trường bị bỏ khỏi body và giá trị cũ còn nguyên.
 */

import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ApiError } from "@/lib/errors";
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
    expect(mockMutate.mock.calls[0][0]).toMatchObject({ bio: "QA-bio mới", phone: "+84900000000" });
  });

  // P-03 (QA3 261104): backend chỉ nhận E.164; số kiểu Việt Nam bị 400 và người dùng chỉ thấy toast chung.
  it("nhập số kiểu Việt Nam 0912345678 -> gửi +84912345678", async () => {
    render(<ProfileSettings />);
    await waitFor(() => expect((screen.getByLabelText("Tiểu sử") as HTMLTextAreaElement).value).toBe("Tiểu sử cũ"));
    fireEvent.change(screen.getByLabelText("Số điện thoại"), { target: { value: "0912 345 678" } });
    fireEvent.click(screen.getByRole("button", { name: "Lưu thay đổi" }));
    await waitFor(() => expect(mockMutate).toHaveBeenCalledTimes(1));
    expect(mockMutate.mock.calls[0][0]).toHaveProperty("phone", "+84912345678");
  });

  it("số không hợp lệ -> lỗi tiếng Việt ngay dưới ô nhập, không gọi API", async () => {
    render(<ProfileSettings />);
    await waitFor(() => expect((screen.getByLabelText("Tiểu sử") as HTMLTextAreaElement).value).toBe("Tiểu sử cũ"));
    fireEvent.change(screen.getByLabelText("Số điện thoại"), { target: { value: "abc123" } });
    fireEvent.click(screen.getByRole("button", { name: "Lưu thay đổi" }));
    expect(await screen.findByText(/Số điện thoại không hợp lệ/)).toBeTruthy();
    expect(mockMutate).not.toHaveBeenCalled();
  });

  // Q8-PG-02 (C19): username trùng/dành riêng -> 409 ERR_USERNAME_EXISTS, hiện dưới ô Username (không chỉ toast chung).
  it("409 ERR_USERNAME_EXISTS: lỗi hiện dưới ô Username", async () => {
    render(<ProfileSettings />);
    await waitFor(() => expect((screen.getByLabelText("Tiểu sử") as HTMLTextAreaElement).value).toBe("Tiểu sử cũ"));
    fireEvent.change(screen.getByLabelText("Tên đăng nhập"), { target: { value: "admin" } });
    fireEvent.click(screen.getByRole("button", { name: "Lưu thay đổi" }));
    await waitFor(() => expect(mockMutate).toHaveBeenCalledTimes(1));

    const options = mockMutate.mock.calls[0][1] as { onError: (e: unknown) => void };
    act(() => options.onError(new ApiError(409, "ERR_USERNAME_EXISTS", "username already exists")));

    expect(await screen.findByText(/Tên đăng nhập đã được dùng/)).toBeTruthy();
    expect(screen.getByLabelText("Tên đăng nhập").getAttribute("aria-invalid")).toBe("true");
  });

  // Q9-STU-03: có dòng lỗi dưới ô, "@" không được căn giữa wrapper (trôi xuống dưới ô); phải neo vào ô nhập cao h-10.
  it("tiền tố '@' neo vào ô nhập, không căn giữa wrapper có dòng lỗi", async () => {
    render(<ProfileSettings />);
    await waitFor(() => expect((screen.getByLabelText("Tiểu sử") as HTMLTextAreaElement).value).toBe("Tiểu sử cũ"));
    const classes = screen.getByTestId("username-prefix").className.split(/\s+/);
    expect(classes).toContain("top-0");
    expect(classes).toContain("h-10");
    expect(classes).not.toContain("top-1/2");
  });

  // Q9-PG-07 (#142): chữ phụ trong màn cài đặt phải >= text-gray-500; "@" dùng gray-400 sẽ không đạt tương phản.
  it("tiền tố '@' dùng text-gray-500, không phải gray-400", async () => {
    render(<ProfileSettings />);
    await waitFor(() => expect((screen.getByLabelText("Tiểu sử") as HTMLTextAreaElement).value).toBe("Tiểu sử cũ"));
    const classes = screen.getByTestId("username-prefix").className.split(/\s+/);
    expect(classes).toContain("text-gray-500");
    expect(classes).not.toContain("text-gray-400");
  });

  it("lỗi khác (500) không đụng tới ô Username", async () => {
    render(<ProfileSettings />);
    await waitFor(() => expect((screen.getByLabelText("Tiểu sử") as HTMLTextAreaElement).value).toBe("Tiểu sử cũ"));
    fireEvent.change(screen.getByLabelText("Tiểu sử"), { target: { value: "x" } });
    fireEvent.click(screen.getByRole("button", { name: "Lưu thay đổi" }));
    await waitFor(() => expect(mockMutate).toHaveBeenCalledTimes(1));

    const options = mockMutate.mock.calls[0][1] as { onError: (e: unknown) => void };
    act(() => options.onError(new ApiError(500, "ERR_INTERNAL", "boom")));
    expect(screen.getByLabelText("Tên đăng nhập").getAttribute("aria-invalid")).not.toBe("true");
  });
});
