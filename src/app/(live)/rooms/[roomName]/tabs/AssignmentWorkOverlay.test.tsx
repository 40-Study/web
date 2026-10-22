import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Bài tập code trong phòng live: khi máy chấm sập backend trả 503 {code:"JUDGE_UNAVAILABLE"}.
 * Chạy thử và Nộp bài phải hiện câu tiếng Việt, không phải "HTTP 503".
 */
const post = vi.hoisted(() => vi.fn());

vi.mock("next/dynamic", () => ({ default: () => () => null }));
vi.mock("@/components/meet/RichTextEditor", () => ({
  default: () => null,
  RichTextViewer: ({ content }: { content: string }) => <span>{content}</span>,
}));
vi.mock("@/lib/meet/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/meet/api")>("@/lib/meet/api");
  return {
    ...actual,
    api: {
      get: vi.fn(async (path: string) => {
        if (path.includes("/sandbox"))
          return {
            assignment: { id: "a1", title: "T", description: "Đề", starter_code: "print(1)", language: ["python"] },
            sample_tests: [],
          };
        return { data: [] };
      }),
      post,
    },
  };
});

import AssignmentWorkOverlay from "./AssignmentWorkOverlay";
import { MeetApiError } from "@/lib/meet/api";

const BACKEND_MESSAGE = "Máy chấm đang không sẵn sàng. Bài nộp chưa được tính, hãy thử lại.";

beforeEach(() => {
  post.mockReset();
});

describe("AssignmentWorkOverlay — máy chấm không sẵn sàng (503)", () => {
  it.each([
    ["Chạy thử", "/submissions/run-custom"],
    ["Nộp bài", "/submissions"],
  ])("%s: hiện message tiếng Việt của backend, không phải 'HTTP 503'", async (button, path) => {
    post.mockRejectedValue(new MeetApiError(503, "HTTP 503", BACKEND_MESSAGE, "JUDGE_UNAVAILABLE"));
    render(<AssignmentWorkOverlay assignmentId="a1" title="T" userId="u1" onClose={() => {}} />);

    const buttons = await screen.findAllByRole("button", { name: button });
    fireEvent.click(buttons[buttons.length - 1]);

    expect(await screen.findByText(BACKEND_MESSAGE)).toBeTruthy();
    expect(post.mock.calls[0][0]).toBe(path);
    expect(screen.queryByText("HTTP 503")).toBeNull();
  });

  it("503 không kèm message (proxy/gateway) -> câu mặc định về máy chấm", async () => {
    post.mockRejectedValue(new MeetApiError(503, "HTTP 503"));
    render(<AssignmentWorkOverlay assignmentId="a1" title="T" userId="u1" onClose={() => {}} />);

    fireEvent.click(await screen.findByRole("button", { name: "Chạy thử" }));

    expect(await screen.findByText(/Máy chấm đang không sẵn sàng/)).toBeTruthy();
    expect(screen.queryByText("HTTP 503")).toBeNull();
  });
});
