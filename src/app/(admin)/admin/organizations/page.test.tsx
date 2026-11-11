/**
 * QA vòng 2, Lane G — trang /admin/organizations:
 *  - G2/G8 (N-01, N-13): tên "   " trước đây lọt qua `!form.name` và được POST lên (tạo tổ chức rỗng);
 *    ô trống thì bấm "Tạo" không có phản hồi. Nay trim + báo lỗi, KHÔNG gọi API.
 *  - G1 (N10/N-12): "Tạo lúc" phải là giờ Việt Nam của mốc backend trả, dù máy chạy UTC.
 */

import { fireEvent, screen, waitFor } from "@testing-library/react";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-client", async () => {
  const { mockApi } = await import("@/test/mock-api");
  return { api: mockApi };
});

import OrganizationsPage from "./page";
import { useAuthStore } from "@/stores/auth.store";
import { envelope, mockApi, resetMockApi } from "@/test/mock-api";
import { renderWithProviders } from "@/test/utils";

// Backend mới trả RFC3339 có offset thật: 10:00 giờ VN ngày 28/09/2026.
const ORG = { id: "org-1", name: "ForteX", code: "FX", created_at: "2026-09-28T10:00:00+07:00" };

const originalTz = process.env.TZ;
beforeAll(() => {
  process.env.TZ = "UTC";
});
afterAll(() => {
  process.env.TZ = originalTz;
});

beforeEach(() => {
  resetMockApi();
  mockApi.get.mockImplementation(async (url: string) => {
    if (url === "/organizations") return envelope({ organizations: [ORG] });
    if (url === "/organizations/org-1/members") {
      return envelope({
        user_organization_roles: [
          {
            id: "a1", user_id: "u1", role_id: "r1", status: "active",
            user: { id: "u1", user_name: "gv2", full_name: "Giáo viên Hai", email: "teacher2@demo.com" },
            role: { id: "r1", name: "QA3_TEACHER" },
          },
        ],
        total: 1,
      });
    }
    if (url === "/org-roles") return envelope({ roles: [{ id: "r1", name: "QA3_TEACHER", organization_id: "org-1", status: "active" }] });
    throw new Error(`GET không mong đợi trong test: ${url}`);
  });
  mockApi.post.mockImplementation(async (url: string, data: unknown) => {
    if (url === "/organizations") return envelope({ id: "org-new", ...(data as object) });
    throw new Error(`POST không mong đợi trong test: ${url}`);
  });
  useAuthStore.getState().setSessionStatus("authenticated");
  useAuthStore.getState().setPermissions(["ORG_CREATE"]);
});

describe("/admin/organizations — G2/G8: không tạo tổ chức tên rỗng", () => {
  it("tên toàn khoảng trắng: hiện lỗi, KHÔNG gọi POST /organizations", async () => {
    renderWithProviders(<OrganizationsPage />);
    await screen.findByText("ForteX");

    fireEvent.change(screen.getByLabelText("Tên tổ chức"), { target: { value: "   " } });
    fireEvent.click(screen.getByRole("button", { name: "Tạo" }));

    expect((await screen.findByRole("alert")).textContent).toContain("ít nhất 2 ký tự");
    expect(mockApi.post).not.toHaveBeenCalled();
  });

  it("tên hợp lệ có khoảng trắng thừa: gửi tên đã trim", async () => {
    renderWithProviders(<OrganizationsPage />);
    await screen.findByText("ForteX");

    fireEvent.change(screen.getByLabelText("Tên tổ chức"), { target: { value: "  Trường ABC  " } });
    fireEvent.click(screen.getByRole("button", { name: "Tạo" }));

    await waitFor(() => expect(mockApi.post).toHaveBeenCalled());
    expect(mockApi.post.mock.calls[0][0]).toBe("/organizations");
    expect(mockApi.post.mock.calls[0][1]).toEqual(expect.objectContaining({ name: "Trường ABC" }));
    expect(screen.queryByRole("alert")).toBeNull();
  });
});

describe("/admin/organizations — G1: giờ tạo hiển thị theo giờ Việt Nam", () => {
  it("created_at 10:00 +07:00 hiện '10:00 28/09/2026' khi máy chạy UTC", async () => {
    renderWithProviders(<OrganizationsPage />);
    fireEvent.click(await screen.findByText("ForteX"));

    expect(await screen.findByText("10:00 28/09/2026")).toBeTruthy();
  });
});

describe("/admin/organizations — QA3-10/17: giữ tên khi lỗi, nút xoá bằng tiếng Việt", () => {
  it("tạo trùng tên bị server từ chối: tên đã gõ KHÔNG bị xoá", async () => {
    mockApi.post.mockRejectedValueOnce(new Error("Tên tổ chức đã tồn tại"));
    renderWithProviders(<OrganizationsPage />);
    await screen.findByText("ForteX");
    const input = screen.getByLabelText("Tên tổ chức") as HTMLInputElement;

    fireEvent.change(input, { target: { value: "ForteX" } });
    fireEvent.click(screen.getByRole("button", { name: "Tạo" }));

    await waitFor(() => expect(mockApi.post).toHaveBeenCalled());
    await new Promise((r) => setTimeout(r, 50));
    expect(input.value).toBe("ForteX");
  });

  it("tạo thành công: form được xoá", async () => {
    renderWithProviders(<OrganizationsPage />);
    await screen.findByText("ForteX");
    const input = screen.getByLabelText("Tên tổ chức") as HTMLInputElement;

    fireEvent.change(input, { target: { value: "Trường ABC" } });
    fireEvent.click(screen.getByRole("button", { name: "Tạo" }));

    await waitFor(() => expect(input.value).toBe(""));
  });

  it("nút làm sạch form là tiếng Việt, không còn chữ 'Reset'", async () => {
    renderWithProviders(<OrganizationsPage />);
    await screen.findByText("ForteX");
    expect(screen.getByRole("button", { name: "Xoá nội dung đã nhập" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Reset" })).toBeNull();
  });
});

describe("/admin/organizations — QA-C-06: tìm kiếm, thẻ có mô tả/trạng thái, không lộ UUID", () => {
  it("gõ từ khoá thì gọi GET /organizations kèm keyword, trang 1", async () => {
    renderWithProviders(<OrganizationsPage />);
    await screen.findByText("ForteX");
    fireEvent.change(screen.getByLabelText("Tìm tổ chức"), { target: { value: "Forte" } });
    await waitFor(() =>
      expect(mockApi.get).toHaveBeenCalledWith(
        "/organizations",
        expect.objectContaining({ params: expect.objectContaining({ keyword: "Forte", page: 1 }) })
      )
    );
  });

  it("chi tiết không in UUID thô, có trạng thái và chủ tổ chức", async () => {
    mockApi.get.mockImplementation(async (url: string) => {
      if (url === "/organizations") return envelope({ organizations: [{ ...ORG, status: "active", description: "Trung tâm lập trình" }], total: 1 });
      if (url === "/organizations/org-1/members") {
        return envelope({
          user_organization_roles: [
            { id: "a1", user_id: "u1", role_id: "r0", status: "active", user: { id: "u1", user_name: "owner", full_name: "Chủ Một", email: "o@x.vn" }, role: { id: "r0", name: "ORG_OWNER" } },
          ],
          total: 1,
        });
      }
      if (url === "/org-roles") return envelope({ roles: [] });
      throw new Error(`GET không mong đợi trong test: ${url}`);
    });
    renderWithProviders(<OrganizationsPage />);
    fireEvent.click(await screen.findByText("ForteX"));
    expect(await screen.findByText("Chủ Một", { selector: "dd" })).toBeTruthy();
    expect(screen.getAllByText("Đang hoạt động").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Trung tâm lập trình").length).toBeGreaterThan(0);
    expect(screen.queryByText(/org-1/)).toBeNull();
  });
});

describe("/admin/organizations — QA-C-20: xoá tổ chức báo ai mất quyền, KHÔNG còn hứa đăng xuất (backend PR #144)", () => {
  const openDelete = async () => {
    renderWithProviders(<OrganizationsPage />);
    await screen.findByText("ForteX");
    fireEvent.click(screen.getByRole("button", { name: "Xoá" }));
  };

  it("người đang đăng nhập là thành viên: báo mình cũng mất vai trò trong tổ chức, không nói bị đăng xuất", async () => {
    useAuthStore.setState({ user: { id: "u1" } as never });
    await openDelete();
    expect((await screen.findByRole("note")).textContent).toContain("bạn cũng mất vai trò trong tổ chức này");
    expect(screen.getByRole("dialog").textContent).not.toMatch(/đăng xuất/);
    expect(screen.getByText(/1 thành viên sẽ mất vai trò/)).toBeTruthy();
  });

  it("không phải thành viên: không có cảnh báo về bản thân", async () => {
    useAuthStore.setState({ user: { id: "someone-else" } as never });
    await openDelete();
    await screen.findByText(/1 thành viên sẽ mất vai trò/);
    expect(screen.queryByRole("note")).toBeNull();
  });
});

describe("/admin/organizations — QA3-04: thành viên của tổ chức", () => {
  it("chọn tổ chức hiện danh sách thành viên kèm nút 'Thêm thành viên'; chưa chọn thì không có", async () => {
    renderWithProviders(<OrganizationsPage />);
    fireEvent.click(await screen.findByText("ForteX"));

    expect(await screen.findByText("Giáo viên Hai")).toBeTruthy();
    expect(screen.getByText("Qa3 Teacher")).toBeTruthy();
    await waitFor(() => expect((screen.getByRole("button", { name: /Thêm thành viên/ }) as HTMLButtonElement).disabled).toBe(false));
    expect(mockApi.get).toHaveBeenCalledWith("/organizations/org-1/members", expect.anything());
  });

  it("chưa chọn tổ chức: không gọi API thành viên", async () => {
    renderWithProviders(<OrganizationsPage />);
    await screen.findByText("ForteX");
    expect(screen.queryByRole("button", { name: /Thêm thành viên/ })).toBeNull();
    expect(mockApi.get).not.toHaveBeenCalledWith("/organizations/org-1/members", expect.anything());
  });
});
