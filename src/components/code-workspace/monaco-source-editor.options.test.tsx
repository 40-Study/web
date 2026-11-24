/**
 * QA4 S18: trình soạn thảo code ở 390px không xuống dòng, dòng dài cuộn ngang và mất phần đầu.
 */
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const received = vi.hoisted(() => ({ options: undefined as Record<string, unknown> | undefined }));

vi.mock("@monaco-editor/react", () => ({
  default: () => null,
  loader: { config: vi.fn(), init: () => Object.assign(Promise.resolve({}), { cancel: vi.fn() }) },
}));
vi.mock("next/dynamic", () => ({
  default: () =>
    function DynamicEditor({ options }: { options?: Record<string, unknown> }) {
      received.options = options;
      return null;
    },
}));

import { MonacoSourceEditor } from "./monaco-source-editor";

describe("MonacoSourceEditor — xuống dòng", () => {
  it("bật wordWrap để dòng dài không bị cuộn ngang trên màn hẹp", () => {
    render(<MonacoSourceEditor value="" onChange={() => {}} language="python" modelPath="m" label="Mã nguồn" />);
    expect(received.options?.wordWrap).toBe("on");
  });
});
