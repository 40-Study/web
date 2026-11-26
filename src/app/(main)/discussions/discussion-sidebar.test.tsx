/**
 * Thanh bên Thảo luận ("Thành viên tích cực"): người đặt `leaderboard_display = anonymous` không có
 * user_id/user_name/avatar_url trong phản hồi. Thanh bên phải hiện "Học viên ẩn danh" (chữ cái đầu "HỌ" thay vì
 * "undefined"), không lỗi khi thiếu id, không trùng khoá React giữa nhiều người ẩn danh, và không rò tên khác.
 */

import { fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-client", async () => {
  const { mockApi } = await import("@/test/mock-api");
  return { api: mockApi };
});

import { DiscussionSidebar } from "./discussion-sidebar";
import { envelope, mockApi, resetMockApi } from "@/test/mock-api";
import { renderWithProviders } from "@/test/utils";

function mockMembers() {
  mockApi.get.mockResolvedValue(
    envelope({
      period_type: "all_time",
      period: "all",
      total: 3,
      entries: [
        // hai người ẩn danh liền nhau, đồng hạng: không user_id nên khoá dòng phải dựa vào vị trí
        { rank: 1, display_name: "Học viên ẩn danh", points: 90 },
        { rank: 1, display_name: "Học viên ẩn danh", points: 90 },
        { rank: 3, user_id: "22222222-2222-4222-8222-222222222222", user_name: "binh", full_name: "Bình Công Khai", display_name: "Bình Công Khai", points: 50, avatar_url: "https://cdn.test/binh.png" },
      ],
    }),
  );
}

beforeEach(() => resetMockApi());
afterEach(() => vi.restoreAllMocks());

describe("DiscussionSidebar — thành viên tích cực", () => {
  it("hiện nhãn ẩn danh cho dòng không có danh tính, giữ tên người công khai, không lỗi khoá trùng", async () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    mockMembers();
    renderWithProviders(<DiscussionSidebar total={0} onCategoryChange={() => {}} />);

    expect(await screen.findByText("Bình Công Khai")).toBeTruthy();
    expect(screen.getAllByText("Học viên ẩn danh")).toHaveLength(2);
    // chữ cái đầu của người ẩn danh lấy từ nhãn theo getInitials (chữ đầu của từ đầu + từ cuối, Q8-PG-09), không phải "UN" của undefined
    expect(screen.getAllByText("HD")).toHaveLength(2);
    expect(screen.queryByText("UN")).toBeNull();
    expect(screen.getByAltText("Bình Công Khai")).toBeTruthy();
    // điểm vẫn hiện cho cả người ẩn danh
    expect(screen.getAllByText("90 điểm")).toHaveLength(2);
    // React cảnh báo khoá trùng bằng console.error: không được có
    const duplicateKey = errors.mock.calls.some((c) => String(c[0]).includes("same key"));
    expect(duplicateKey).toBe(false);
  });

  // QA3 Q5: số đếm là tổng theo API, không phải số bài đã tải (trước đây "Tất cả 20" trong khi có 77 bài).
  it("hiện tổng theo API cho 'Tất cả' và từng danh mục", async () => {
    mockMembers();
    renderWithProviders(
      <DiscussionSidebar total={77} categoryCounts={{ programming: 30, design: 12 }} onCategoryChange={() => {}} />,
    );
    expect(screen.getByText("77")).toBeTruthy();
    expect(screen.getByText("30")).toBeTruthy();
    expect(screen.getByText("12")).toBeTruthy();
    // danh mục chưa có số liệu hiện "–", không phải số 0 giả; "Chung" cũng chưa biết khi còn thiếu số của một danh mục
    expect(screen.getAllByText("–")).toHaveLength(4);
    await screen.findByText("Bình Công Khai");
  });

  // Q6-PG-13: "Tất cả 77" trong khi các chip chỉ cộng được 9; còn thiếu "Hỏi đáp" và bài `general`/không danh mục.
  it("có chip 'Hỏi đáp' và 'Chung'; số các chip cộng lại đúng bằng 'Tất cả'", async () => {
    mockMembers();
    const counts = { programming: 2, design: 2, "learning-tips": 3, project: 2, qna: 5 };
    renderWithProviders(<DiscussionSidebar total={77} categoryCounts={counts} onCategoryChange={() => {}} />);
    expect(screen.getByRole("button", { name: /Hỏi đáp/ }).textContent).toContain("5");
    const chung = screen.getByRole("button", { name: /Chung/ });
    expect(chung.textContent).toContain("63"); // 77 - (2+2+3+2+5)
    const chipSum = [...Object.values(counts), 63].reduce((a, b) => a + b, 0);
    expect(chipSum).toBe(77);
    await screen.findByText("Bình Công Khai");
  });

  it("bấm 'Chung' lọc theo general; bấm 'Hỏi đáp' lọc theo qna", async () => {
    mockMembers();
    const onChange = vi.fn();
    renderWithProviders(<DiscussionSidebar total={10} categoryCounts={{ programming: 1, design: 1, "learning-tips": 1, project: 1, qna: 1 }} onCategoryChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: /Chung/ }));
    expect(onChange).toHaveBeenLastCalledWith("general");
    fireEvent.click(screen.getByRole("button", { name: /Hỏi đáp/ }));
    expect(onChange).toHaveBeenLastCalledWith("qna");
    await screen.findByText("Bình Công Khai");
  });
});

// QA6 S6-11: bảng xếp hạng in "3.000 điểm", sidebar in "3000 điểm".
describe("DiscussionSidebar — điểm có dấu phân cách nghìn (S6-11)", () => {
  it("điểm >= 1000 dùng cách viết Việt Nam, điểm nhỏ giữ nguyên", async () => {
    mockApi.get.mockResolvedValue(
      envelope({
        period_type: "all_time",
        period: "all",
        total: 2,
        entries: [
          { rank: 1, user_id: "11111111-1111-4111-8111-111111111111", user_name: "an", full_name: "An", display_name: "An", points: 3000 },
          { rank: 2, user_id: "22222222-2222-4222-8222-222222222222", user_name: "binh", full_name: "Bình", display_name: "Bình", points: 2964 },
        ],
      }),
    );
    renderWithProviders(<DiscussionSidebar total={0} onCategoryChange={() => {}} />);
    expect(await screen.findByText("3.000 điểm")).toBeTruthy();
    expect(screen.getByText("2.964 điểm")).toBeTruthy();
    expect(screen.queryByText("3000 điểm")).toBeNull();
  });
});
