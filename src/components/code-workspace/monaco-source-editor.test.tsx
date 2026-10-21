/**
 * QA 2026-10-21: khi `/monaco/vs/loader.js` 404 (dev chạy không qua `predev`) trình soạn thảo kẹt
 * mãi ở "Đang tải Monaco…" không báo gì. Lỗi tải phải hiện ra kèm nút tải lại.
 */
import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const init = vi.hoisted(() => vi.fn());

vi.mock("@monaco-editor/react", () => ({
  default: () => null,
  loader: { config: vi.fn(), init: () => init() },
}));
// Thay Editor động bằng màn hình "đang tải" của chính nó, như lúc loader chưa xong.
vi.mock("next/dynamic", () => ({
  default: () =>
    function DynamicEditor({ loading }: { loading?: React.ReactNode }) {
      return <>{loading}</>;
    },
}));

import { MonacoSourceEditor } from "./monaco-source-editor";

function cancelable<T>(promise: Promise<T>) {
  return Object.assign(promise, { cancel: vi.fn() });
}

const props = {
  value: "",
  onChange: () => {},
  language: "python",
  modelPath: "m",
  label: "Mã nguồn",
};

beforeEach(() => {
  init.mockReset();
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe("MonacoSourceEditor — tải Monaco", () => {
  it("loader lỗi (loader.js 404) -> báo lỗi rõ ràng và có nút tải lại trang", async () => {
    init.mockImplementation(() => cancelable(Promise.reject(new Error("loader.js 404"))));
    const reload = vi.fn();
    vi.stubGlobal("location", { ...window.location, reload });
    render(<MonacoSourceEditor {...props} />);

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toMatch(/Không tải được trình soạn thảo/);
    expect(screen.queryByText("Đang tải Monaco…")).toBeNull();
    screen.getByRole("button", { name: "Tải lại trang" }).click();
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("loader thành công -> không có thông báo lỗi", async () => {
    init.mockImplementation(() => cancelable(Promise.resolve({})));
    render(<MonacoSourceEditor {...props} />);
    await waitFor(() => expect(init).toHaveBeenCalled());
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByText("Đang tải Monaco…")).toBeTruthy();
  });
});
