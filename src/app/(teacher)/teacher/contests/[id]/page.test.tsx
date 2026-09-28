/**
 * /teacher/contests/[id] — ĐÍNH CHÍNH 28/09: giảng viên KHÔNG có nút chốt kết quả, kể cả cuộc thi
 * đã kết thúc và không có giải voucher; form sửa của giảng viên KHÔNG có ô voucher.
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ContestManage } from "@/types/contest";

const mockUseManagedContest = vi.fn();
const noopMutation = () => ({ mutate: vi.fn(), isPending: false });

vi.mock("@/hooks/queries/use-contest-manage", () => ({
  useManagedContest: (...args: unknown[]) => mockUseManagedContest(...args),
  useUpdateContest: () => noopMutation(),
  useDeleteContest: () => noopMutation(),
  useSubmitContestReview: () => noopMutation(),
  useContestQuizOptions: () => ({ data: [], isLoading: false, isError: false, refetch: vi.fn() }),
  useContestParticipants: () => ({
    data: { items: [], total_count: 0, page: 1, limit: 20, total_pages: 0 },
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "c-1" }),
  useRouter: () => ({ push: vi.fn() }),
}));

// eslint-disable-next-line import/first
import TeacherContestDetailPage from "./page";

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
    start_time: "2026-09-28T08:00:00Z",
    end_time: "2026-09-28T09:00:00Z",
    duration_minutes: 10,
    max_participants: 0,
    participant_count: 3,
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
    submitted_at: null,
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

describe("/teacher/contests/[id]", () => {
  beforeEach(() => mockUseManagedContest.mockReset());

  it("cuộc thi đã kết thúc, không có voucher: KHÔNG có nút chốt, chỉ có ghi chú chờ admin", () => {
    withContest(buildContest());
    render(<TeacherContestDetailPage />);
    expect(screen.queryByRole("button", { name: /chốt/i })).toBeNull();
    expect(screen.getByTestId("await-finalize-note").textContent).toMatch(/Quản trị viên sẽ chốt/);
    // Đã công bố → không sửa/xoá/gửi duyệt.
    expect(screen.queryByTestId("submit-review")).toBeNull();
    expect(screen.queryByTestId("delete-contest")).toBeNull();
    expect(screen.queryByTestId("contest-form")).toBeNull();
  });

  it("bị từ chối: hiện lý do, có form sửa + gửi duyệt lại, form KHÔNG có ô voucher", () => {
    withContest(buildContest({ status: "REJECTED", phase: "REJECTED", reject_reason: "Đề quá ngắn" }));
    render(<TeacherContestDetailPage />);
    expect(screen.getByTestId("reject-reason").textContent).toContain("Đề quá ngắn");
    expect(screen.getByTestId("submit-review")).toBeTruthy();
    expect(screen.getByTestId("contest-form")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /thêm giải/i }));
    expect(screen.getByTestId("prize-row-0")).toBeTruthy();
    expect(screen.queryByTestId("prize-voucher-0")).toBeNull();
    expect(screen.queryByText(/Không tặng voucher/)).toBeNull();
  });
});
