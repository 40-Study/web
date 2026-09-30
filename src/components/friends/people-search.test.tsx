/**
 * Tìm người: ngưỡng 3 ký tự (đã trim), debounce, nút theo relationship. Bỏ ngưỡng hoặc debounce thì test đỏ.
 */
import { act, fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithQuery } from "@/test-utils/query-wrapper";
import { MIN_SEARCH_LENGTH, SEARCH_DEBOUNCE_MS } from "@/hooks/queries/use-friends";

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn() } }));

import { friendService } from "@/services/friend.service";
import { PeopleSearch } from "./people-search";

const type = (value: string) =>
  fireEvent.change(screen.getByLabelText("Tìm học viên"), { target: { value } });

const settle = () =>
  act(async () => {
    await vi.advanceTimersByTimeAsync(SEARCH_DEBOUNCE_MS + 50);
  });

describe("PeopleSearch", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.spyOn(friendService, "search").mockResolvedValue({ users: [] });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("ngưỡng là 3 ký tự", () => {
    expect(MIN_SEARCH_LENGTH).toBe(3);
  });

  it("chưa gõ gì: hiện gợi ý 'nhập ít nhất 3 ký tự', không gọi API", async () => {
    renderWithQuery(<PeopleSearch />);
    await settle();

    expect(screen.getByText(/Nhập ít nhất 3 ký tự/)).toBeTruthy();
    expect(friendService.search).not.toHaveBeenCalled();
  });

  it("gõ 2 ký tự: vẫn KHÔNG gọi API dù đã hết debounce", async () => {
    renderWithQuery(<PeopleSearch />);
    type("ab");
    await settle();

    expect(friendService.search).not.toHaveBeenCalled();
    expect(screen.getByText(/Nhập ít nhất 3 ký tự/)).toBeTruthy();
  });

  it("ngưỡng tính sau khi trim: '  ab ' không đủ", async () => {
    renderWithQuery(<PeopleSearch />);
    type("  ab ");
    await settle();

    expect(friendService.search).not.toHaveBeenCalled();
  });

  it("gõ đủ 3 ký tự: gọi API đúng MỘT lần sau debounce, với chuỗi đã trim", async () => {
    renderWithQuery(<PeopleSearch />);
    type(" lan ");

    expect(friendService.search).not.toHaveBeenCalled(); // chưa hết debounce
    await settle();

    expect(friendService.search).toHaveBeenCalledTimes(1);
    expect(friendService.search).toHaveBeenCalledWith("lan");
  });

  it("gõ liên tục: chỉ gọi với giá trị cuối (không bắn theo từng phím)", async () => {
    renderWithQuery(<PeopleSearch />);
    type("lan");
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });
    type("lanh");
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });
    type("lanhu");
    await settle();

    expect(friendService.search).toHaveBeenCalledTimes(1);
    expect(friendService.search).toHaveBeenCalledWith("lanhu");
  });

  it("xoá bớt về dưới 3 ký tự: quay lại gợi ý, không hiện kết quả cũ", async () => {
    vi.spyOn(friendService, "search").mockResolvedValue({
      users: [{ user_id: "u1", user_name: "lan", full_name: "Nguyễn Lan", relationship: "NONE" }],
    });
    renderWithQuery(<PeopleSearch />);
    type("lan");
    await settle();
    expect(await screen.findByText("Nguyễn Lan")).toBeTruthy();

    type("la");
    await settle();

    expect(screen.queryByText("Nguyễn Lan")).toBeNull();
    expect(screen.getByText(/Nhập ít nhất 3 ký tự/)).toBeTruthy();
  });

  it("mỗi kết quả có đúng nút theo relationship, hiển thị full_name và không lộ email/điện thoại", async () => {
    vi.spyOn(friendService, "search").mockResolvedValue({
      users: [
        { user_id: "a", user_name: "a", full_name: "An None", relationship: "NONE" },
        { user_id: "b", user_name: "b", full_name: "Bình Out", relationship: "PENDING_OUT", request_id: "req-b" },
        { user_id: "c", user_name: "c", full_name: "Chi In", relationship: "PENDING_IN", request_id: "req-c" },
        { user_id: "d", user_name: "d", full_name: "Dũng Friend", relationship: "FRIENDS" },
        { user_id: "e", user_name: "e_user", relationship: "SELF" },
      ],
    });
    const lookup = vi.spyOn(friendService, "relationship");
    const cancel = vi.spyOn(friendService, "cancel").mockResolvedValue(null);
    const accept = vi.spyOn(friendService, "accept").mockResolvedValue({ id: "req-c", status: "ACCEPTED", user: { user_id: "c", user_name: "c" } });
    const { container } = renderWithQuery(<PeopleSearch />);
    type("abc");
    await settle();

    await screen.findByText("An None");
    expect(screen.getByRole("button", { name: "Kết bạn với An None" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Huỷ lời mời kết bạn với Bình Out" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Chấp nhận lời mời của Chi In" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Bạn bè với Dũng Friend" })).toBeTruthy();
    // SELF hiện tên (full_name thiếu -> user_name) nhưng không có nút kết bạn.
    expect(screen.getByText("e_user")).toBeTruthy();
    expect(screen.getAllByRole("button")).toHaveLength(4);
    expect(container.textContent).not.toMatch(/@|email|điện thoại/i);
    // request_id lấy thẳng từ kết quả search: không gọi thêm relationship, và hành động dùng đúng id đó.
    expect(lookup).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Huỷ lời mời kết bạn với Bình Out" }));
    await settle();
    expect(cancel).toHaveBeenCalledWith("req-b");
    fireEvent.click(screen.getByRole("button", { name: "Chấp nhận lời mời của Chi In" }));
    await settle();
    expect(accept).toHaveBeenCalledWith("req-c");
  });

  it("không có kết quả: nói rõ, không phải khung trống", async () => {
    renderWithQuery(<PeopleSearch />);
    type("zzz");
    await settle();

    expect(await screen.findByText("Không tìm thấy học viên phù hợp")).toBeTruthy();
  });
});
