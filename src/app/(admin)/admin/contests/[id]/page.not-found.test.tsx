/**
 * QA6-A06: /admin/contests/<id lạ> từng hiện "(…hoặc bạn không phải người tạo)" — câu chỉ đúng với giảng viên —
 * dưới khối "Không thể tải dữ liệu / Thử lại". Admin thấy trạng thái "không tìm thấy" với câu của admin.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, NotFoundError } from "@/lib/errors";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useParams: () => ({ id: "0000" }), useRouter: () => ({ push }) }));
vi.mock("@/stores/auth.store", () => ({ useAuthStore: (selector: (s: { user: { id: string } }) => unknown) => selector({ user: { id: "admin-1" } }) }));

const mockContest = vi.fn();
const idle = { mutate: vi.fn(), isPending: false };
vi.mock("@/hooks/queries/use-contest-manage", () => ({
  useManagedContest: () => mockContest(),
  useApproveContest: () => idle,
  useRejectContest: () => idle,
  useCancelContest: () => idle,
  useFinalizeContest: () => idle,
  useUpdateContestPrizes: () => idle,
  useContestVoucherOptions: () => ({ data: [], isLoading: false, isError: false }),
  useContestParticipants: () => ({ data: undefined, isLoading: true, isError: false }),
}));

import AdminContestDetailPage from "./page";

const failed = (error: unknown) => ({ data: undefined, isLoading: false, isError: true, error, refetch: vi.fn() });

beforeEach(() => push.mockReset());

describe("/admin/contests/[id] — không tìm thấy", () => {
  it.each([
    ["404", new NotFoundError("not found")],
    ["400 ERR_INVALID_ID", new ApiError(400, "ERR_INVALID_ID", "id không hợp lệ")],
  ])("%s -> 'Không tìm thấy cuộc thi' với câu của admin, không có gợi ý 'người tạo' và không có Thử lại", (_name, error) => {
    mockContest.mockReturnValue(failed(error));
    render(<AdminContestDetailPage />);

    expect(screen.getByText("Không tìm thấy cuộc thi")).toBeTruthy();
    expect(document.body.textContent).not.toContain("người tạo");
    expect(screen.queryByRole("button", { name: /Thử lại/ })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Về danh sách cuộc thi" }));
    expect(push).toHaveBeenCalledWith("/admin/contests");
  });

  it("lỗi máy chủ 500 vẫn là khối lỗi chung có Thử lại", () => {
    mockContest.mockReturnValue(failed(new ApiError(500, "UNKNOWN", "boom")));
    render(<AdminContestDetailPage />);

    expect(screen.queryByText("Không tìm thấy cuộc thi")).toBeNull();
    expect(screen.getByRole("button", { name: /Thử lại/ })).toBeTruthy();
  });
});
