/**
 * QA4 S7: hộp nạp xu tự gọi verify ngay khi mở; ngân hàng lỗi thì in nguyên chuỗi hạ tầng
 * ("rpc error ... connection refused"), kèm "vui lòng không chuyển khoản lần nữa" cạnh
 * "bạn chưa cần chuyển khoản". Contract 7: backend trả 503 ERR_PAYMENT_PROVIDER_UNAVAILABLE.
 */
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/errors";
import type { CoinPurchase } from "@/services/coin.service";

const verify = vi.fn();
vi.mock("@/services/coin.service", () => ({
  coinService: { verifyPurchase: (...args: unknown[]) => verify(...args) },
}));

import { COIN_PROVIDER_UNAVAILABLE_MESSAGE, CoinPaymentDialog } from "./coin-payment-dialog";

const base: CoinPurchase = {
  id: "cp1",
  user_id: "u1",
  coin_amount: 100,
  bonus_amount: 0,
  price: 95000,
  currency: "VND",
  status: "PENDING",
  payment_reference: "COIN123",
  created_at: new Date().toISOString(),
};

function renderDialog(purchase: CoinPurchase) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  clients.push(qc);
  return render(
    <QueryClientProvider client={qc}>
      <CoinPaymentDialog purchase={purchase} open onOpenChange={vi.fn()} />
    </QueryClientProvider>
  );
}

const clients: QueryClient[] = [];
// Thân hàm dạng khối: beforeEach trả về một hàm thì vitest coi đó là teardown và gọi `verify()` sau test.
beforeEach(() => {
  verify.mockReset();
});
afterEach(() => {
  for (const qc of clients.splice(0)) qc.clear();
});

describe("CoinPaymentDialog — ngân hàng lỗi / chưa cấu hình (S7)", () => {
  it("chưa có tài khoản nhận tiền: không tự gọi verify, không có câu 'lần nữa'", async () => {
    renderDialog(base);
    await new Promise((r) => setTimeout(r, 20));
    expect(verify).not.toHaveBeenCalled();
    expect(screen.getByText(/bạn chưa cần chuyển khoản/)).toBeTruthy();
    expect(screen.queryByText(/lần nữa/)).toBeNull();
  });

  const configured = {
    ...base,
    bank_transfer_info: { bank_name: "MB Bank", account_number: "0123456789", account_name: "FORTEX", content: "COIN123" },
  };

  it("contract 7: mở hộp ngay sau khi tạo đơn nạp KHÔNG tự gọi verify; chỉ gọi sau 'Tôi đã chuyển khoản'", async () => {
    verify.mockResolvedValue({ ...configured, status: "PENDING" });
    renderDialog(configured);
    await new Promise((r) => setTimeout(r, 20));
    expect(verify).not.toHaveBeenCalled();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Tôi đã chuyển khoản" }));
    });
    await waitFor(() => expect(verify).toHaveBeenCalledTimes(1));
  });

  it("503 ERR_PAYMENT_PROVIDER_UNAVAILABLE: câu tiếng Việt bình tĩnh, không lộ chuỗi kỹ thuật", async () => {
    verify.mockImplementation(async () => {
      throw new ApiError(503, "ERR_PAYMENT_PROVIDER_UNAVAILABLE", "failed to check transaction: rpc error: connection refused");
    });
    renderDialog(configured);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Tôi đã chuyển khoản" }));
    });
    await waitFor(() => expect(screen.getByRole("alert").textContent).toBe(COIN_PROVIDER_UNAVAILABLE_MESSAGE));
    expect(screen.queryByText(/rpc error|connection refused/)).toBeNull();
  });
});
