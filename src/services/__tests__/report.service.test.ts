/**
 * Bug tìm thấy khi kiểm chứng sống trang /admin/moderation (A-P2-5): reportService.list() /
 * getMyReports() đọc field `reports` trong khi backend thật (ReportListDTO ở
 * backend/internal/dto/report_dto.go) trả field JSON là `data`. Không có consumer nào dùng tới
 * hai hàm này trước /admin/moderation nên bug tồn tại âm thầm — mảng luôn rỗng dù backend có
 * dữ liệu. Test này ĐỎ nếu field bị đổi lại thành "reports".
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-client", async () => {
  const { mockApi } = await import("@/test/mock-api");
  return { api: mockApi };
});

import { reportService } from "@/services/report.service";
import { envelope, mockApi, resetMockApi } from "@/test/mock-api";

beforeEach(() => {
  resetMockApi();
});

describe("reportService.list", () => {
  it("unwrap đúng field `data` (khớp ReportListDTO thật), không phải `reports`", async () => {
    mockApi.get.mockResolvedValue(
      envelope({
        data: [
          {
            id: "r1",
            reporter_id: "u1",
            reported_type: "course",
            reported_id: "c1",
            reason: "spam",
            status: "pending",
            created_at: "2026-09-27T00:00:00Z",
          },
        ],
        total: 1,
        page: 1,
        page_size: 50,
      })
    );

    const result = await reportService.list({ page_size: 50 });

    expect(result.data).toHaveLength(1);
    expect(result.total).toBe(1);
  });
});
