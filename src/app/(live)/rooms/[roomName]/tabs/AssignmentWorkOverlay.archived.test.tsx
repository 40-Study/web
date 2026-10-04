import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const MC = JSON.stringify({ type: "multiple_choice", questions: [{ question: "2+2?", answers: ["Bốn", "Năm"], correctIndex: 0 }] });
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
        if (path.includes("/sandbox")) return { assignment: { id: "a1", title: "T", starter_code: MC, language: [] }, sample_tests: [] };
        return { data: [] };
      }),
      post,
    },
  };
});

import AssignmentWorkOverlay from "./AssignmentWorkOverlay";
import { MeetApiError } from "@/lib/meet/api";

describe("AssignmentWorkOverlay — nộp bài vào lớp đã lưu trữ", () => {
  it("409 CLASS_ARCHIVED: hộp thông báo hiện message tiếng Việt của backend, không phải 'HTTP 409'", async () => {
    post.mockRejectedValue(new MeetApiError(409, "HTTP 409", "Lớp đã lưu trữ, không nhận bài nộp mới", "CLASS_ARCHIVED"));
    render(<AssignmentWorkOverlay assignmentId="a1" title="T" userId="u1" onClose={() => {}} />);

    fireEvent.click(await screen.findByText("Bốn"));
    fireEvent.click(screen.getAllByText("Nộp bài")[0]);

    expect(await screen.findByText("Lớp đã lưu trữ, không nhận bài nộp mới")).toBeTruthy();
    await waitFor(() => expect(post).toHaveBeenCalled());
    expect(screen.queryByText("HTTP 409")).toBeNull();
  });
});
