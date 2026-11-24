/**
 * Tên của con cho `generateMetadata` trang `/parent/children/[id]` (N-08, QA4 261123: tab chỉ ghi "ForteX").
 * Endpoint cần phiên phụ huynh nên đi qua `serverApi` (chuyển tiếp cookie). Không lấy được tên (không phải
 * con của phụ huynh này, phiên hết hạn, backend lỗi) -> `null`, layout dùng tiêu đề chung.
 */
import { serverApi } from "@/lib/server-api";

interface ChildOverviewName {
  username?: string;
  full_name?: string;
}

export async function getChildDisplayNameServer(childId: string): Promise<string | null> {
  try {
    const overview = await serverApi.get<ChildOverviewName>(
      `/parent/children/${encodeURIComponent(childId)}/overview`,
    );
    return overview.full_name?.trim() || overview.username?.trim() || null;
  } catch {
    return null;
  }
}
