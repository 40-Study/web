/**
 * QA7-A08: tab / trạng thái / từ khoá / trang của /admin/contests nằm trên URL (?tab=all&status=&q=&page=) như
 * Đơn hàng, Người dùng, Nhật ký, để F5, Back/Forward và link chia sẻ giữ đúng bộ lọc. Giá trị lạ rơi về mặc định.
 */
import { isContestStatus } from "@/lib/contest-manage/labels";
import type { ContestStatus } from "@/types/contest";

export type ContestTab = "pending" | "all";

export function parseContestTab(raw: string | null): ContestTab {
  return raw === "all" ? "all" : "pending";
}

export function parseContestStatus(raw: string | null): ContestStatus | "" {
  return raw && isContestStatus(raw) ? raw : "";
}

export function parseContestPage(raw: string | null): number {
  const n = Number(raw);
  return Number.isInteger(n) && n >= 1 ? n : 1;
}

/** Áp patch lên query hiện tại: giá trị rỗng/null xoá khoá; tab "pending" và page 1 là mặc định nên không ghi ra URL. */
export function patchContestQuery(current: string, patch: Record<string, string | number | null>): string {
  const next = new URLSearchParams(current);
  for (const [key, value] of Object.entries(patch)) {
    const isDefault =
      value === null || value === "" || (key === "page" && value === 1) || (key === "tab" && value === "pending");
    if (isDefault) next.delete(key);
    else next.set(key, String(value));
  }
  return next.toString();
}
