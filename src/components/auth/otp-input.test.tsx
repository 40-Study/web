/**
 * N-14 (QA4 261123): "Cannot update a component while rendering a different component" trên /otp. OtpInput gọi
 * `onComplete` BÊN TRONG hàm cập nhật của `setOtp`; React chạy hàm đó lúc render OtpInput, nên setState của trang
 * cha (OtpPage đặt lỗi/đang xử lý) rơi vào giữa lượt render của component khác.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
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
});

// Q5-PG-07: "Gửi lại mã sau 01:28" từng hiện lại ngay cả khi lần gửi vừa thất bại (429).
describe("OtpInput onResend", () => {
  const expired = async (onResend: () => unknown) => {
    vi.useFakeTimers();
    render(<OtpInput onResend={onResend as never} countdown={2} />);
    await act(async () => {
      vi.advanceTimersByTime(3000);
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Gửi lại mã" }));
    });
  };
  afterEach(() => vi.useRealTimers());

  it("gửi thành công: đồng hồ chạy lại", async () => {
    await expired(() => Promise.resolve());
    expect(screen.getByText(/Gửi lại mã sau/)).toBeTruthy();
  });

  it("reject (vd. 429): giữ nút Gửi lại mã, không khởi động lại đồng hồ", async () => {
    await expired(() => Promise.reject(new Error("429")));
    expect(screen.queryByText(/Gửi lại mã sau/)).toBeNull();
    expect(screen.getByRole("button", { name: "Gửi lại mã" })).toBeTruthy();
  });

  it("trả false: cũng coi là thất bại", async () => {
    await expired(() => false);
    expect(screen.queryByText(/Gửi lại mã sau/)).toBeNull();
  });
});

describe("OtpInput autofill (Q8-PG-08)", () => {
  it("ô đầu khai báo one-time-code; các ô sau không", () => {
    render(<OtpInput />);
    expect(screen.getByLabelText("Chữ số OTP 1").getAttribute("autocomplete")).toBe("one-time-code");
    expect(screen.getByLabelText("Chữ số OTP 2").getAttribute("autocomplete")).toBe("off");
  });

  it("trình duyệt điền cả mã vào ô đầu: chia đủ 6 ô và gọi onComplete một lần", () => {
    const onComplete = vi.fn();
    render(<OtpInput onComplete={onComplete} />);
    fireEvent.change(screen.getByLabelText("Chữ số OTP 1"), { target: { value: "482913" } });
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith("482913");
    expect((screen.getByLabelText("Chữ số OTP 6") as HTMLInputElement).value).toBe("3");
  });
});
