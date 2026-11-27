/** QA8 M3: backend #157 trả 400 ERR_INVALID_ID (trước là INVALID_ID) cho id cuộc thi sai định dạng; giảng viên thấy "không tìm thấy", không phải "Thử lại". */
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ApiError, NotFoundError } from "@/lib/errors";

const mockContest = vi.fn();
const idle = { mutate: vi.fn(), isPending: false };
vi.mock("@/hooks/queries/use-contest-manage", () => ({
  useManagedContest: () => mockContest(),
  useUpdateContest: () => idle,
  useDeleteContest: () => idle,
  useSubmitContestReview: () => idle,
  useContestQuizOptions: () => ({ data: [], isLoading: false, isError: false, refetch: vi.fn() }),
  useContestParticipants: () => ({ data: undefined, isLoading: true, isError: false }),
}));
vi.mock("next/navigation", () => ({ useParams: () => ({ id: "x" }), useRouter: () => ({ push: vi.fn() }) }));

import TeacherContestDetailPage from "./page";

describe("/teacher/contests/[id] — không tìm thấy", () => {
  it.each([
    ["404", new NotFoundError("nf")],
    ["400 ERR_INVALID_ID", new ApiError(400, "ERR_INVALID_ID", "x")],
    ["400 INVALID_ID (cũ)", new ApiError(400, "INVALID_ID", "x")],
  ])("%s -> 'Không tìm thấy cuộc thi', không có Thử lại", (_n, error) => {
    mockContest.mockReturnValue({ data: undefined, isLoading: false, isError: true, error, refetch: vi.fn() });
    render(<TeacherContestDetailPage />);
    expect(screen.getByText("Không tìm thấy cuộc thi")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Thử lại/ })).toBeNull();
  });
});
