/**
 * Tạo lớp trong tổ chức: người dùng thuộc tổ chức thì có ô chọn tổ chức và `organization_id` đi theo request;
 * không chọn (lớp cá nhân) hoặc không thuộc tổ chức nào thì KHÔNG gửi field. Backend mới là nơi kiểm quyền thành viên.
 */
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithQuery } from "@/test-utils/query-wrapper";
import type { UnifiedRole } from "@/services/auth.service";

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const myRoles = vi.hoisted(() => ({ data: undefined as UnifiedRole[] | undefined }));
vi.mock("@/hooks/queries/use-auth", () => ({
  useMyRoles: () => ({ data: myRoles.data ? { roles: myRoles.data } : undefined }),
}));

import { classService } from "@/services/class.service";
import { organizationsFromRoles } from "./class-organization-field";
import { ClassCreateForm } from "./class-create-form";

const role = (over: Partial<UnifiedRole>): UnifiedRole => ({
  id: "r1",
  type: "organization",
  role_name: "GIANG_VIEN",
  display_name: "GIANG_VIEN",
  ...over,
});

const ORG_A = role({ id: "r-a", organization_id: "org-a", organization_name: "Trung tâm A" });
const ORG_A_2 = role({ id: "r-a2", role_name: "TRO_GIANG", organization_id: "org-a", organization_name: "Trung tâm A" });
const SYSTEM_TEACHER = role({ id: "s1", type: "system", role_name: "TEACHER", display_name: "TEACHER" });

function renderForm() {
  const onCreated = vi.fn();
  renderWithQuery(<ClassCreateForm courseId="course-1" onCreated={onCreated} />);
  return { onCreated };
}

async function fillAndSubmit(name = "Lớp A - K67") {
  fireEvent.change(screen.getByPlaceholderText("VD: Lớp A - K67"), { target: { value: name } });
  fireEvent.click(screen.getByRole("button", { name: /Tạo lớp/ }));
}

describe("organizationsFromRoles", () => {
  it("chỉ lấy role tổ chức, bỏ trùng theo organization_id, bỏ role hệ thống", () => {
    expect(organizationsFromRoles([ORG_A, ORG_A_2, SYSTEM_TEACHER])).toEqual([{ id: "org-a", name: "Trung tâm A" }]);
    expect(organizationsFromRoles(undefined)).toEqual([]);
  });
});

describe("ClassCreateForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    myRoles.data = [SYSTEM_TEACHER, ORG_A, ORG_A_2];
  });

  it("chọn tổ chức thì gửi organization_id", async () => {
    const create = vi.spyOn(classService, "create").mockResolvedValue({ id: "c1" } as never);
    const { onCreated } = renderForm();

    fireEvent.change(screen.getByLabelText("Tổ chức"), { target: { value: "org-a" } });
    await fillAndSubmit();

    await waitFor(() => expect(create).toHaveBeenCalledTimes(1));
    expect(create).toHaveBeenCalledWith("course-1", expect.objectContaining({ name: "Lớp A - K67", organization_id: "org-a" }));
    await waitFor(() => expect(onCreated).toHaveBeenCalled());
  });

  it("để mặc định (lớp cá nhân) thì không gửi organization_id", async () => {
    const create = vi.spyOn(classService, "create").mockResolvedValue({ id: "c1" } as never);
    renderForm();
    await fillAndSubmit();

    await waitFor(() => expect(create).toHaveBeenCalledTimes(1));
    expect(create.mock.calls[0][1].organization_id).toBeUndefined();
  });

  it("không thuộc tổ chức nào thì không có ô chọn tổ chức và không gửi organization_id", async () => {
    myRoles.data = [SYSTEM_TEACHER];
    const create = vi.spyOn(classService, "create").mockResolvedValue({ id: "c1" } as never);
    renderForm();
    expect(screen.queryByLabelText("Tổ chức")).toBeNull();

    await fillAndSubmit();
    await waitFor(() => expect(create).toHaveBeenCalledTimes(1));
    expect(create.mock.calls[0][1].organization_id).toBeUndefined();
  });
});
