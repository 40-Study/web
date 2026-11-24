/**
 * QA4 S18: ở 390px thanh tab dưới đè lên "Câu trước / Tiếp theo" của trang làm quiz. Đang làm quiz thì ẩn
 * thanh tab; trang kết quả và trang khác vẫn có.
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { usePathname } from "next/navigation";

vi.mock("./header", () => ({ Header: () => null }));
vi.mock("./sidebar", () => ({ Sidebar: () => null }));
vi.mock("./footer", () => ({ Footer: () => <footer data-testid="footer" /> }));
vi.mock("./bottom-nav", () => ({ BottomNav: () => <nav data-testid="bottom-nav" /> }));

import { AppShellLayout } from "./app-shell-layout";

function renderAt(path: string) {
  vi.mocked(usePathname).mockReturnValue(path);
  return render(
    <AppShellLayout>
      <p>nội dung</p>
    </AppShellLayout>
  );
}

describe("AppShellLayout — thanh tab dưới", () => {
  it("đang làm quiz (/quizzes/:id): không có thanh tab, không chừa khoảng đệm cho nó", () => {
    renderAt("/quizzes/q1");
    expect(screen.queryByTestId("bottom-nav")).toBeNull();
    expect(screen.getByRole("main").className).not.toMatch(/pb-\[calc/);
    expect(screen.getByTestId("footer")).toBeTruthy();
  });

  it("trang kết quả quiz và trang thường: vẫn có thanh tab", () => {
    renderAt("/quizzes/q1/result");
    expect(screen.getByTestId("bottom-nav")).toBeTruthy();
  });

  it("trang làm bài cuộc thi: ẩn cả thanh tab lẫn footer như trước", () => {
    renderAt("/contests/demo/play");
    expect(screen.queryByTestId("bottom-nav")).toBeNull();
    expect(screen.queryByTestId("footer")).toBeNull();
  });
});
