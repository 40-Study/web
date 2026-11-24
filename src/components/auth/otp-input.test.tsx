/**
 * N-14 (QA4 261123): "Cannot update a component while rendering a different component" trên /otp. OtpInput gọi
 * `onComplete` BÊN TRONG hàm cập nhật của `setOtp`; React chạy hàm đó lúc render OtpInput, nên setState của trang
 * cha (OtpPage đặt lỗi/đang xử lý) rơi vào giữa lượt render của component khác.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OtpInput } from "./otp-input";

function Parent() {
  const [done, setDone] = useState("");
  return (
    <>
      <OtpInput onComplete={setDone} />
      <p>{done ? `xong ${done}` : "chưa"}</p>
    </>
  );
}

afterEach(() => vi.restoreAllMocks());

const crossRenderWarning = (spy: { mock: { calls: unknown[][] } }) =>
  spy.mock.calls.some((args) => args.some((a) => String(a).includes("Cannot update a component")));

describe("OtpInput onComplete", () => {
  it("gõ đủ 6 số: gọi onComplete một lần, không setState cha trong lúc render", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    render(<Parent />);
    "123456".split("").forEach((d, i) => {
      fireEvent.change(screen.getByLabelText(`Chữ số OTP ${i + 1}`), { target: { value: d } });
    });
    expect(screen.getByText("xong 123456")).toBeTruthy();
    expect(crossRenderWarning(error)).toBe(false);
  });

  it("dán đủ 6 số: cũng không setState cha trong lúc render", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    render(<Parent />);
    fireEvent.paste(screen.getByRole("group", { name: "Mã OTP" }), { clipboardData: { getData: () => "654321" } });
    expect(screen.getByText("xong 654321")).toBeTruthy();
    expect(crossRenderWarning(error)).toBe(false);
  });
});
