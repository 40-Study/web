/**
 * /admin/contests/[id] — nút "Chốt kết quả" chỉ bật khi phase ENDED và đã qua end_time + 60s;
 * duyệt gửi kèm giải (có voucher admin chọn); từ chối bắt buộc lý do.
 */

import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ContestApiError } from "@/services/contest.service";
import type { ContestManage } from "@/types/contest";

const mockUseManagedContest = vi.fn();
const mockFinalize = vi.fn();
const mockApprove = vi.fn();
const mockReject = vi.fn();
const noopMutation = () => ({ mutate: vi.fn(), isPending: false });

vi.mock("@/hooks/queries/use-contest-manage", () => ({
  useManagedContest: (...args: unknown[]) => mockUseManagedContest(...args),
  useApproveContest: () => ({ mutate: mockApprove, isPending: false }),
  useRejectContest: () => ({ mutate: mockReject, isPending: false }),
  useCancelContest: () => noopMutation(),
  useUpdateContestPrizes: () => noopMutation(),
  useFinalizeContest: () => ({ mutate: mockFinalize, isPending: false }),
  useContestVoucherOptions: () => ({
    data: [{ id: "v-1", code: "QACONTEST", name: "Giảm 50k", is_active: true }],
    isError: false,
    error: null,
  }),
  useContestParticipants: () => ({
    data: { items: [], total_count: 0, page: 1, limit: 20, total_pages: 0 },
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

vi.mock("next/navigation", () => ({ useParams: () => ({ id: "c-1" }) }));

const authState = { user: { id: "admin-1" } };
vi.mock("@/stores/auth.store", () => ({
  useAuthStore: (selector: (s: typeof authState) => unknown) => selector(authState),
}));

// eslint-disable-next-line import/first
import AdminContestDetailPage from "./page";

const END = "2026-10-01T10:00:00Z";

function buildContest(overrides: Partial<ContestManage> = {}): ContestManage {
  return {
    id: "c-1",
    slug: "qa-contest",
    title: "QA-contest Toán nhanh",
    description: null,
    banner_url: null,
    type: "QUIZ",
    status: "PUBLISHED",
    phase: "ENDED",
    start_time: "2026-10-01T09:00:00Z",
    end_time: END,
    duration_minutes: 10,
    max_participants: 0,
    participant_count: 2,
    is_public: true,
    course: null,
    question_count: 3,
    total_points: 3,
    has_voucher_prize: false,
    creator_name: "Giảng viên 1",
    creator_email: "teacher1@fortex.vn",
    finalized_at: null,
    created_at: "2026-09-27T00:00:00Z",
    updated_at: "2026-09-27T00:00:00Z",
    prizes: [],
    quiz: { id: "q-1", title: "QA-contest quiz", question_count: 3 },
    course_id: null,
    certificate_min_percentage: null,
    submitted_at: "2026-09-27T01:00:00Z",
    reviewed_at: null,
    reject_reason: null,
    cancel_reason: null,
    created_by: "teacher-1",
    ...overrides,
  };
}

function withContest(contest: ContestManage) {
  mockUseManagedContest.mockReturnValue({ data: contest, isLoading: false, isError: false, error: null, refetch: vi.fn() });
}

describe("/admin/contests/[id]", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date", "setInterval", "clearInterval"] });
    mockUseManagedContest.mockReset();
    mockFinalize.mockReset();
    mockApprove.mockReset();
    mockReject.mockReset();
  });
  afterEach(() => vi.useRealTimers());

  it("ENDED chưa đủ 60 giây: nút chốt bị khoá, có giờ mở", () => {
    vi.setSystemTime(new Date("2026-10-01T10:00:30Z"));
    withContest(buildContest());
    render(<AdminContestDetailPage />);
    const btn = screen.getByTestId("finalize-contest") as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    expect(screen.getByTestId("finalize-wait").textContent).toMatch(/60 giây sau khi kết thúc/);
  });

  it("chốt lỗi voucher (409 + details): alert cố định nêu người thắng, hạng, voucher, lý do, có link sửa giải", () => {
    vi.setSystemTime(new Date("2026-10-01T10:01:05Z"));
    withContest(buildContest());
    mockFinalize.mockImplementation((_id: string, opts: { onError?: (e: unknown) => void; onSettled?: () => void }) => {
      opts.onError?.(
        new ContestApiError(409, "CONTEST_VOUCHER_UNAVAILABLE", "Không phát được voucher GIAI1 cho người thắng Nguyễn An, hạng 2", {
          user_id: "u-1",
          user_name: "Nguyễn An",
          rank: 2,
          voucher_id: "v-1",
          voucher_code: "GIAI1",
          reason: "đã hết tổng lượt dùng",
        })
      );
      opts.onSettled?.();
    });
    render(<AdminContestDetailPage />);
    fireEvent.click(screen.getByTestId("finalize-contest"));
    fireEvent.click(screen.getByTestId("approve-confirm"));

    const alert = screen.getByTestId("voucher-grant-alert");
    expect(alert.getAttribute("role")).toBe("alert");
    expect(screen.getByTestId("grant-user").textContent).toBe("Nguyễn An");
    expect(screen.getByTestId("grant-rank").textContent).toBe("2");
    expect(screen.getByTestId("grant-voucher").textContent).toBe("GIAI1");
    expect(screen.getByTestId("grant-reason").textContent).toBe("đã hết tổng lượt dùng");
    // Đường dẫn trỏ đúng phần sửa giải đang có trên trang.
    expect(screen.getByTestId("grant-fix-prizes").getAttribute("href")).toBe("#contest-prizes");
    expect(document.getElementById("contest-prizes")).not.toBeNull();
    // Không tự biến mất theo thời gian (khác toast).
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(screen.getByTestId("voucher-grant-alert")).toBeTruthy();
  });

  it("ENDED đã qua 60 giây: bấm chốt → xác nhận → gọi finalize", () => {
    vi.setSystemTime(new Date("2026-10-01T10:01:05Z"));
    withContest(buildContest());
    render(<AdminContestDetailPage />);
    const btn = screen.getByTestId("finalize-contest") as HTMLButtonElement;
    expect(btn.disabled).toBe(false);
    fireEvent.click(btn);
    fireEvent.click(screen.getByTestId("approve-confirm"));
    expect(mockFinalize).toHaveBeenCalledWith("c-1", expect.anything());
  });

  it("đang diễn ra: không có nút chốt", () => {
    vi.setSystemTime(new Date("2026-10-01T09:30:00Z"));
    withContest(buildContest({ phase: "ACTIVE" }));
    render(<AdminContestDetailPage />);
    expect(screen.queryByTestId("finalize-contest")).toBeNull();
  });

  it("m4: mở trang lúc còn ACTIVE, đồng hồ chạy qua end_time + 60s → nút chốt tự bật, không cần tải lại", () => {
    vi.setSystemTime(new Date("2026-10-01T09:59:00Z"));
    withContest(buildContest({ phase: "ACTIVE" }));
    render(<AdminContestDetailPage />);
    expect(screen.queryByTestId("finalize-contest")).toBeNull();
    act(() => {
      vi.advanceTimersByTime(125_000); // 10:01:05 — đã qua mốc mở chốt 10:01:00
    });
    expect((screen.getByTestId("finalize-contest") as HTMLButtonElement).disabled).toBe(false);
  });

  it("m6: duyệt không sửa giải vẫn gửi ĐỦ giải đang có (không gửi prizes: [] làm xoá hết giải)", () => {
    vi.setSystemTime(new Date("2026-09-30T00:00:00Z"));
    withContest(
      buildContest({
        status: "PENDING_REVIEW",
        phase: "PENDING_REVIEW",
        prizes: [
          { id: "p-1", rank_from: 1, rank_to: 1, grant_certificate: true, voucher: { id: "v-1", code: "QACONTEST", name: "Giảm 50k" } },
          { id: "p-2", rank_from: 2, rank_to: 3, grant_certificate: true, voucher: null },
        ],
      })
    );
    render(<AdminContestDetailPage />);
    fireEvent.click(screen.getByTestId("approve-contest"));
    fireEvent.click(screen.getByTestId("approve-confirm"));
    expect(mockApprove).toHaveBeenCalledWith(
      {
        id: "c-1",
        prizes: [
          { rank_from: 1, rank_to: 1, grant_certificate: true, voucher_id: "v-1" },
          { rank_from: 2, rank_to: 3, grant_certificate: true, voucher_id: null },
        ],
      },
      expect.anything()
    );
  });

  it("chờ duyệt: admin gắn voucher cho giải rồi duyệt → gửi prizes kèm voucher_id", () => {
    vi.setSystemTime(new Date("2026-09-30T00:00:00Z"));
    withContest(buildContest({ status: "PENDING_REVIEW", phase: "PENDING_REVIEW" }));
    render(<AdminContestDetailPage />);
    fireEvent.click(screen.getByRole("button", { name: /thêm giải/i }));
    fireEvent.change(screen.getByTestId("prize-voucher-0"), { target: { value: "v-1" } });
    fireEvent.click(screen.getByTestId("approve-contest"));
    fireEvent.click(screen.getByTestId("approve-confirm"));
    expect(mockApprove).toHaveBeenCalledWith(
      { id: "c-1", prizes: [{ rank_from: 1, rank_to: 1, grant_certificate: true, voucher_id: "v-1" }] },
      expect.anything()
    );
  });

  it("từ chối: nút gửi khoá khi lý do rỗng, gửi lý do đã trim", () => {
    vi.setSystemTime(new Date("2026-09-30T00:00:00Z"));
    withContest(buildContest({ status: "PENDING_REVIEW", phase: "PENDING_REVIEW" }));
    render(<AdminContestDetailPage />);
    fireEvent.click(screen.getByTestId("reject-contest"));
    const submit = screen.getByTestId("reason-submit") as HTMLButtonElement;
    expect(submit.disabled).toBe(true);
    fireEvent.change(screen.getByTestId("reason-input"), { target: { value: "  Đề trùng  " } });
    fireEvent.click(submit);
    expect(mockReject).toHaveBeenCalledWith({ id: "c-1", reason: "Đề trùng" }, expect.anything());
  });
});
