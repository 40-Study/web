import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
const verify = vi.fn();
vi.mock("@/services/coin.service", () => ({
  coinService: { verifyPurchase: (...args: unknown[]) => verify(...args) },
}));
import { usePurchaseVerificationPolling, coinKeys } from "./use-coins";
describe("Coin verification lifecycle", () => {
  it("credits once without invalidating its own verification query", async () => {
    verify.mockReset().mockResolvedValue({ id: "p1", status: "COMPLETED" });
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidate = vi.spyOn(qc, "invalidateQueries");
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    );
    const view = renderHook(() => usePurchaseVerificationPolling("p1", true), { wrapper });
    await waitFor(() => expect(view.result.current.data?.status).toBe("COMPLETED"));
    await waitFor(() => expect(invalidate).toHaveBeenCalledTimes(3));
    expect(verify).toHaveBeenCalledTimes(1);
    expect(invalidate.mock.calls.map(([args]) => args?.queryKey)).toEqual([
      coinKeys.wallet(),
      ["coins", "transactions"],
      coinKeys.purchases(),
    ]);
    view.unmount();
    qc.clear();
  });
  it("does not send verification while the payment dialog is closed", async () => {
    verify.mockReset().mockResolvedValue({ id: "p2", status: "PENDING" });
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    );
    const view = renderHook(({ open }) => usePurchaseVerificationPolling("p2", open), {
      wrapper,
      initialProps: { open: false },
    });
    expect(verify).not.toHaveBeenCalled();
    view.rerender({ open: true });
    await waitFor(() => expect(view.result.current.data?.status).toBe("PENDING"));
    view.rerender({ open: false });
    expect(view.result.current.fetchStatus).toBe("idle");
    expect(verify).toHaveBeenCalledTimes(1);
    view.unmount();
    qc.clear();
  });
});
