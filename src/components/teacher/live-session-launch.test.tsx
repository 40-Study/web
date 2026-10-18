import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ start: vi.fn(), push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock("@/hooks/queries/use-live-sessions", () => ({
  useStartLiveSession: () => ({ mutateAsync: mocks.start }),
}));
import { LiveSessionLaunch } from "./live-session-launch";

describe("teacher livestream launch", () => {
  beforeEach(() => {
    mocks.start.mockReset();
    mocks.push.mockReset();
  });
  it("does not start on mount; two clicks while opening produce one mutation", async () => {
    let resolve!: (value: unknown) => void;
    mocks.start.mockImplementation(
      () =>
        new Promise((r) => {
          resolve = r;
        })
    );
    render(<LiveSessionLaunch id="live-1" status="scheduled" />);
    expect(mocks.start).not.toHaveBeenCalled();
    const button = screen.getByRole("button", { name: "Bắt đầu và vào phòng" });
    fireEvent.click(button, { detail: 1 });
    fireEvent.click(button, { detail: 2 });
    expect(mocks.start).toHaveBeenCalledTimes(1);
    expect(mocks.push).not.toHaveBeenCalled();
    resolve({ id: "live-1" });
    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith("/rooms/live-1"));
  });
  it("failed start stays in the dialog and permits an explicit retry", async () => {
    mocks.start.mockRejectedValueOnce(new Error("LiveKit chưa sẵn sàng"));
    render(<LiveSessionLaunch id="live-1" status="scheduled" />);
    fireEvent.click(screen.getByRole("button", { name: "Bắt đầu và vào phòng" }), { detail: 1 });
    expect((await screen.findByRole("alert")).textContent).toContain("LiveKit chưa sẵn sàng");
    expect(mocks.push).not.toHaveBeenCalled();
    mocks.start.mockResolvedValueOnce({ id: "live-1" });
    fireEvent.click(screen.getByRole("button", { name: "Bắt đầu và vào phòng" }), { detail: 1 });
    await waitFor(() => expect(mocks.push).toHaveBeenCalledTimes(1));
    expect(mocks.start).toHaveBeenCalledTimes(2);
  });
  it("a live session links into the existing room without starting again", () => {
    render(<LiveSessionLaunch id="live-1" status="live" />);
    expect(screen.getByRole("link", { name: "Vào phòng học" }).getAttribute("href")).toBe(
      "/rooms/live-1"
    );
    expect(mocks.start).not.toHaveBeenCalled();
  });
});
