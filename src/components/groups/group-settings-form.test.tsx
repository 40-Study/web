/** Cài đặt nhóm: validate khớp backend, chỉ gửi field đã đổi, đổi slug thì chuyển trang, xoá nhóm phải gõ tên. */
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithQuery } from "@/test-utils/query-wrapper";

const router = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => router,
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn() } }));

import { groupService, type Group } from "@/services/group.service";
import { GroupSettingsForm, buildGroupUpdate, validateGroupSettings } from "./group-settings-form";

const group = (over: Partial<Group> = {}): Group => ({
  id: "g1",
  name: "Nhóm React",
  slug: "nhom-react",
  description: "Mô tả cũ",
  type: "STUDY_GROUP",
  privacy: "PRIVATE",
  max_members: 50,
  member_count: 10,
  created_by: "owner",
  my_role: "OWNER",
  created_at: "2026-09-01T00:00:00Z",
  updated_at: "2026-09-01T00:00:00Z",
  ...over,
});

const values = (over = {}) => ({ name: "Nhóm React", description: "Mô tả cũ", privacy: "PRIVATE", maxMembers: 50, ...over });

describe("validateGroupSettings", () => {
  it("hợp lệ thì không có lỗi", () => {
    expect(validateGroupSettings(values(), 10)).toEqual({});
  });

  it("tên ngắn hơn 2 hoặc dài hơn 200 ký tự bị từ chối (khớp validate backend)", () => {
    expect(validateGroupSettings(values({ name: " A " }), 10).name).toBeTruthy();
    expect(validateGroupSettings(values({ name: "x".repeat(201) }), 10).name).toBeTruthy();
    expect(validateGroupSettings(values({ name: "x".repeat(200) }), 10).name).toBeUndefined();
  });

  it("sĩ số ngoài 2..1000 hoặc không phải số nguyên bị từ chối", () => {
    for (const bad of [1, 1001, 2.5, Number.NaN]) {
      expect(validateGroupSettings(values({ maxMembers: bad }), 0).maxMembers).toBeTruthy();
    }
    expect(validateGroupSettings(values({ maxMembers: 2 }), 0).maxMembers).toBeUndefined();
    expect(validateGroupSettings(values({ maxMembers: 1000 }), 0).maxMembers).toBeUndefined();
  });

  it("sĩ số nhỏ hơn số thành viên hiện có bị từ chối (nhóm sẽ đầy ngay)", () => {
    expect(validateGroupSettings(values({ maxMembers: 9 }), 10).maxMembers).toContain("10");
    expect(validateGroupSettings(values({ maxMembers: 10 }), 10).maxMembers).toBeUndefined();
  });
});

describe("buildGroupUpdate — chỉ gửi field đã đổi", () => {
  it("không đổi gì -> patch rỗng", () => {
    expect(buildGroupUpdate(group(), values())).toEqual({});
  });

  it("đổi tên và privacy -> chỉ hai field đó", () => {
    expect(buildGroupUpdate(group(), values({ name: " Tên mới ", privacy: "SECRET" }))).toEqual({
      name: "Tên mới",
      privacy: "SECRET",
    });
  });

  it("xoá mô tả -> gửi chuỗi rỗng để backend xoá", () => {
    expect(buildGroupUpdate(group(), values({ description: "" }))).toEqual({ description: "" });
  });
});

describe("GroupSettingsForm", () => {
  beforeEach(() => {
    router.push.mockReset();
    router.replace.mockReset();
  });

  it("nút Lưu khoá khi chưa đổi gì, mở khi có thay đổi", () => {
    renderWithQuery(<GroupSettingsForm group={group()} />);
    const save = screen.getByRole("button", { name: "Lưu thay đổi" }) as HTMLButtonElement;
    expect(save.disabled).toBe(true);

    fireEvent.change(screen.getByLabelText("Tên nhóm"), { target: { value: "Nhóm Vue" } });
    expect(save.disabled).toBe(false);
  });

  it("lưu chỉ gửi field đã đổi; slug đổi thì chuyển sang URL mới", async () => {
    const update = vi.spyOn(groupService, "update").mockResolvedValue(group({ name: "Nhóm Vue", slug: "nhom-vue" }));
    renderWithQuery(<GroupSettingsForm group={group()} />);

    fireEvent.change(screen.getByLabelText("Tên nhóm"), { target: { value: "Nhóm Vue" } });
    fireEvent.click(screen.getByRole("button", { name: "Lưu thay đổi" }));

    await waitFor(() => expect(update).toHaveBeenCalledWith("g1", { name: "Nhóm Vue" }));
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/groups/nhom-vue"));
  });

  it("sĩ số thấp hơn số thành viên: báo lỗi và KHÔNG gọi API", async () => {
    const update = vi.spyOn(groupService, "update").mockResolvedValue(group());
    renderWithQuery(<GroupSettingsForm group={group()} />);

    fireEvent.change(screen.getByLabelText("Sĩ số tối đa"), { target: { value: "5" } });
    fireEvent.click(screen.getByRole("button", { name: "Lưu thay đổi" }));

    expect(await screen.findByText(/đang có 10 thành viên/)).toBeTruthy();
    expect(update).not.toHaveBeenCalled();
  });

  it("có thể chọn quyền riêng tư Bí mật (SECRET)", () => {
    renderWithQuery(<GroupSettingsForm group={group()} />);
    const select = screen.getByLabelText("Quyền riêng tư") as HTMLSelectElement;
    expect(Array.from(select.options).map((o) => o.value)).toEqual(["PUBLIC", "PRIVATE", "SECRET"]);
  });

  it("xoá nhóm: nút xác nhận khoá tới khi gõ đúng tên nhóm, rồi gọi delete và về /groups", async () => {
    const del = vi.spyOn(groupService, "delete").mockResolvedValue({});
    renderWithQuery(<GroupSettingsForm group={group()} />);

    fireEvent.click(screen.getByRole("button", { name: "Xoá nhóm" }));
    const dialog = screen.getByRole("dialog");
    const confirm = within(dialog).getByRole("button", { name: "Xoá nhóm" }) as HTMLButtonElement;
    expect(confirm.disabled).toBe(true);

    fireEvent.change(within(dialog).getByLabelText(/Nhập/), { target: { value: "Nhóm sai" } });
    expect(confirm.disabled).toBe(true);
    fireEvent.change(within(dialog).getByLabelText(/Nhập/), { target: { value: "Nhóm React" } });
    expect(confirm.disabled).toBe(false);
    fireEvent.click(confirm);

    await waitFor(() => expect(del).toHaveBeenCalledWith("g1"));
    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/groups"));
  });

  it("ADMIN không thấy vùng Xoá nhóm", () => {
    renderWithQuery(<GroupSettingsForm group={group({ my_role: "ADMIN" })} />);
    expect(screen.queryByRole("button", { name: "Xoá nhóm" })).toBeNull();
  });
});
