/**
 * Lớp lưu trữ chỉ đọc: backend trả 409 CLASS_ARCHIVED cho nộp bài, check-in/out, tạo/sửa livestream, tạo bài tập gắn phiên live.
 * Những chỗ web không biết status lớp phải hiện ĐÚNG message của backend, không phải câu lỗi chung "Không thể ...".
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/errors";

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("sonner", () => ({ toast }));

import { assignmentService } from "@/services/assignment.service";
import { liveSessionService } from "@/services/live-session.service";
import { livestreamClassroomService } from "@/services/livestream-classroom.service";
import { livestreamService } from "@/services/livestream.service";
import { sessionService } from "@/services/session.service";
import { submissionService } from "@/services/submission.service";
import { useCreateAssignment } from "./use-assignments";
import { useCreateAssignment as useCreateLiveAssignment, useCreateSession, useSubmitCode as useSubmitLiveCode } from "./use-livestream";
import { useCreateLivestream } from "./use-livestream-v2";
import { useCreateLiveSession, useUpdateLiveSession } from "./use-live-sessions";
import { useCheckIn, useCheckOut } from "./use-sessions";
import { useSubmitCode } from "./use-submissions";

const MESSAGE = "Lớp đã lưu trữ, hãy mở lại lớp trước khi chỉnh sửa";
const archived = () => new ApiError(409, "CLASS_ARCHIVED", MESSAGE);

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  toast.error.mockClear();
  toast.success.mockClear();
});

async function failWith(spy: any, useHook: () => any, vars?: unknown, title?: string) {
  spy.mockRejectedValue(archived());
  const { result } = renderHook(useHook, { wrapper });
  result.current.mutate(vars);
  await waitFor(() => expect(toast.error).toHaveBeenCalled());
  if (title) expect(toast.error.mock.calls[0][0]).toBe(title);
  const [first, second] = toast.error.mock.calls[0];
  // message nằm ở tiêu đề (getErrorMessage thuần) hoặc ở description của toast
  expect([first, second?.description]).toContain(MESSAGE);
}

describe("409 CLASS_ARCHIVED hiện message backend", () => {
  it("học viên nộp bài (useSubmitCode)", () =>
    failWith(vi.spyOn(submissionService, "submit"), useSubmitCode, { assignment_id: "a1", language: "js", code: "x" }, "Không thể nộp bài"));

  it("check-in buổi học", () => failWith(vi.spyOn(sessionService, "checkIn"), () => useCheckIn("s1"), undefined, "Không thể check-in"));

  it("check-out buổi học", () => failWith(vi.spyOn(sessionService, "checkOut"), () => useCheckOut("s1"), undefined, "Không thể check-out"));

  it("tạo buổi live (useCreateLiveSession)", () =>
    failWith(vi.spyOn(liveSessionService, "create"), useCreateLiveSession, {}, "Không thể tạo buổi học trực tiếp"));

  it("sửa buổi live (useUpdateLiveSession)", () =>
    failWith(vi.spyOn(liveSessionService, "update"), useUpdateLiveSession, { id: "l1", dto: {} }, "Không thể cập nhật"));

  it("tạo livestream (useCreateLivestream)", () =>
    failWith(vi.spyOn(livestreamService, "create"), useCreateLivestream, {}, "Không thể tạo livestream"));

  it("tạo phiên học (useCreateSession)", () =>
    failWith(vi.spyOn(livestreamClassroomService, "createSession"), useCreateSession, {}, "Không thể tạo phiên học"));

  it("tạo bài tập gắn phiên live", () =>
    failWith(vi.spyOn(livestreamClassroomService, "createAssignment"), useCreateLiveAssignment, { sessionId: "l1", data: {} }, "Không thể tạo bài tập"));

  it("nộp bài trong phiên live (useSubmitCode của livestream)", () =>
    failWith(vi.spyOn(livestreamClassroomService, "submitCode"), useSubmitLiveCode, { assignmentId: "a1", code: "x", language: "js" }, "Không thể nộp bài"));

  it("tạo bài tập theo buổi (useCreateAssignment)", () =>
    failWith(vi.spyOn(assignmentService, "create"), useCreateAssignment, { dto: {}, sessionId: "l1" }));
});
