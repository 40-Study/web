/**
 * QA4 S18 (390px): phụ đề "/groups" bị ép xuống dòng cạnh nút "Tạo nhóm", và tên nhóm bị cắt còn
 * "Đồ án tốt nghiệp..." vì chỉ cho một dòng. jsdom không tính layout nên khoá hợp đồng lớp CSS.
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const group = {
  id: "g1",
  name: "Đồ án tốt nghiệp K66",
  slug: "do-an-tot-nghiep-k66",
  description: "Nhóm làm đồ án",
  privacy: "SECRET",
  member_count: 2,
  my_role: "OWNER",
};
vi.mock("@/hooks/queries/use-groups", () => ({
  useGroups: () => ({ data: { groups: [] }, isLoading: false }),
  useMyJoinedGroups: () => ({ data: { groups: [group] }, isLoading: false }),
  useCreateGroup: () => ({ mutate: vi.fn(), isPending: false }),
  useJoinGroup: () => ({ mutate: vi.fn(), isPending: false }),
}));

import GroupsPage from "./page";

describe("GroupsPage — màn hẹp (S18)", () => {
  it("đầu trang xếp dọc dưới sm; tên nhóm được hai dòng", () => {
    render(<GroupsPage />);
    const header = screen.getByTestId("groups-header").className.split(/\s+/);
    expect(header).toContain("flex-col");
    expect(header).toContain("sm:flex-row");
    const title = screen.getByRole("link", { name: "Đồ án tốt nghiệp K66" }).className.split(/\s+/);
    expect(title).toContain("line-clamp-2");
    expect(title).not.toContain("line-clamp-1");
  });
});
