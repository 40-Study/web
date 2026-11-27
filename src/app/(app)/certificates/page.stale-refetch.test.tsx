/**
 * Q10 #148 H1: /certificates có cache (kể cả danh sách RỖNG) mà refetch nền lỗi: giữ nội dung + thông báo 'Thử lại'
 * (trước đây im lặng). Lần tải đầu lỗi vẫn là hộp lỗi.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const refetch = vi.fn(async () => undefined);
let query: { data: unknown; isLoading: boolean; isError: boolean };

vi.mock("@/hooks/queries/use-certificates", () => ({
  useMyCertificates: () => ({ ...query, error: new Error("boom"), refetch }),
}));
vi.mock("@/hooks/use-role-aware-href", () => ({ useRoleAwareHref: () => (href: string) => href }));
vi.mock("@/components/certificate/certificate-card", () => ({
  CertificateCard: ({ certificate }: { certificate: { id: string } }) => <div>cert-{certificate.id}</div>,
}));

import MyCertificatesPage from "./page";

beforeEach(() => refetch.mockClear());

describe("/certificates — Q10 #148 H1", () => {
  it("refetch nền lỗi mà còn chứng chỉ: giữ danh sách + thông báo 'Thử lại', không có hộp lỗi", () => {
    query = { data: { data: [{ id: "c1" }], total: 1 }, isLoading: false, isError: true };
    render(<MyCertificatesPage />);
    expect(screen.getByText("cert-c1")).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByRole("status").textContent).toContain("Không làm mới được danh sách chứng chỉ");
    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("danh sách RỖNG đã cache + refetch lỗi: vẫn là 'chưa có chứng chỉ' + thông báo, không phải hộp lỗi", () => {
    query = { data: { data: [], total: 0 }, isLoading: false, isError: true };
    render(<MyCertificatesPage />);
    expect(screen.getByText(/Bạn chưa có chứng chỉ nào/)).toBeTruthy();
    expect(screen.getByRole("status")).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("không lỗi: không có thông báo; lần tải đầu lỗi: hộp lỗi, không phải thông báo dữ liệu cũ", () => {
    query = { data: { data: [{ id: "c1" }], total: 1 }, isLoading: false, isError: false };
    const { unmount } = render(<MyCertificatesPage />);
    expect(screen.queryByRole("status")).toBeNull();
    unmount();
    query = { data: undefined, isLoading: false, isError: true };
    render(<MyCertificatesPage />);
    expect(screen.getByRole("alert").textContent).toContain("Không thể tải dữ liệu");
    expect(screen.queryByText(/Không làm mới được/)).toBeNull();
  });
});
