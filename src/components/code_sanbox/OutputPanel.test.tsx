/** L5-6: OutputPanel hiện trạng thái Judge0 bằng tiếng Việt; trạng thái lạ giữ nguyên chuỗi gốc. */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import OutputPanel from "./OutputPanel";
import type { JudgeResult, Theme } from "./types";

const theme = new Proxy({}, { get: () => "#000" }) as Theme;

function show(result: JudgeResult) {
  render(
    <OutputPanel T={theme} dark={false} stdin="" setStdin={() => {}} running={false} result={result} setResult={() => {}} height={200} />
  );
}

describe("OutputPanel — nhãn trạng thái", () => {
  it("Accepted -> Được chấp nhận", () => {
    show({ status: { id: 3, description: "Accepted" }, stdout: "ok" });
    expect(screen.getByText(/Được chấp nhận/)).toBeTruthy();
    expect(screen.queryByText(/Accepted/)).toBeNull();
  });

  it("Wrong Answer -> Sai đáp án", () => {
    show({ status: { id: 4, description: "Wrong Answer" }, stdout: "x" });
    expect(screen.getByText(/Sai đáp án/)).toBeTruthy();
  });

  it("trạng thái lạ giữ nguyên chuỗi gốc", () => {
    show({ status: { id: 99, description: "Brand New Status" }, stdout: "x" });
    expect(screen.getByText(/Brand New Status/)).toBeTruthy();
  });
});