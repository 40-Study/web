/** Q10-PG-05: mã dán từ app chat hay kèm U+200B ở cuối; form tra cứu phải bỏ ký tự vô hình trước khi điều hướng. */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

import VerifyCertificateFormPage from "./page";

describe("form tra cứu chứng chỉ — ký tự vô hình (Q10-PG-05)", () => {
  it("mã có U+200B cuối: điều hướng tới mã sạch", () => {
    push.mockReset();
    render(<VerifyCertificateFormPage />);
    fireEvent.change(screen.getByLabelText("Mã chứng chỉ"), { target: { value: "FORTEX-748c42ba-2dfeb3​" } });
    fireEvent.click(screen.getByRole("button", { name: "Tra cứu" }));
    expect(push).toHaveBeenCalledWith("/certificates/verify/FORTEX-748c42ba-2dfeb3");
  });

  it("chỉ có ký tự vô hình: nút Tra cứu bị khoá, không điều hướng", () => {
    push.mockReset();
    render(<VerifyCertificateFormPage />);
    fireEvent.change(screen.getByLabelText("Mã chứng chỉ"), { target: { value: "​​" } });
    expect((screen.getByRole("button", { name: "Tra cứu" }) as HTMLButtonElement).disabled).toBe(true);
  });
});
