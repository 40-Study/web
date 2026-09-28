/**
 * Ẩn/hiện nút theo trạng thái + vai trò (contract §3.1 + ĐÍNH CHÍNH 28/09: CHỈ admin chốt).
 */

import { describe, expect, it } from "vitest";

import type { ContestPhase, ContestStatus } from "@/types/contest";

import { getAdminContestActions, getFinalizeState, getTeacherContestActions } from "./actions";

const END = "2026-10-01T10:00:00Z";

function contest(status: ContestStatus, phase: ContestPhase, extra: { finalized_at?: string | null; created_by?: string } = {}) {
  return { status, phase, end_time: END, finalized_at: extra.finalized_at ?? null, created_by: extra.created_by ?? "teacher-1" };
}

describe("getTeacherContestActions", () => {
  it("sửa/xoá/gửi duyệt chỉ ở bản nháp và bị từ chối", () => {
    for (const s of ["DRAFT", "REJECTED"] as const) {
      expect(getTeacherContestActions(contest(s, s))).toEqual({ canEdit: true, canDelete: true, canSubmitReview: true });
    }
    for (const [s, p] of [
      ["PENDING_REVIEW", "PENDING_REVIEW"],
      ["PUBLISHED", "ACTIVE"],
      ["PUBLISHED", "ENDED"],
      ["CANCELLED", "CANCELLED"],
    ] as const) {
      expect(getTeacherContestActions(contest(s, p))).toEqual({ canEdit: false, canDelete: false, canSubmitReview: false });
    }
  });

  it("giảng viên KHÔNG có hành động chốt kết quả dưới bất kỳ trạng thái nào", () => {
    const actions = getTeacherContestActions(contest("PUBLISHED", "ENDED"));
    expect(Object.keys(actions).some((k) => /final/i.test(k))).toBe(false);
  });
});

describe("getFinalizeState (admin)", () => {
  it("ẩn khi cuộc thi chưa kết thúc hoặc chưa công bố", () => {
    const now = new Date("2026-10-01T12:00:00Z");
    expect(getFinalizeState(contest("PUBLISHED", "ACTIVE"), now)).toEqual({ kind: "hidden" });
    expect(getFinalizeState(contest("PUBLISHED", "UPCOMING"), now)).toEqual({ kind: "hidden" });
    expect(getFinalizeState(contest("CANCELLED", "CANCELLED"), now)).toEqual({ kind: "hidden" });
    expect(getFinalizeState(contest("PENDING_REVIEW", "PENDING_REVIEW"), now)).toEqual({ kind: "hidden" });
  });

  it("ENDED nhưng chưa qua end_time + 60s → chờ, kèm giờ mở", () => {
    const state = getFinalizeState(contest("PUBLISHED", "ENDED"), new Date("2026-10-01T10:00:59Z"));
    expect(state.kind).toBe("wait");
    if (state.kind === "wait") expect(state.availableAt.toISOString()).toBe("2026-10-01T10:01:00.000Z");
  });

  it("đúng mốc end_time + 60s → bấm được", () => {
    expect(getFinalizeState(contest("PUBLISHED", "ENDED"), new Date("2026-10-01T10:01:00Z"))).toEqual({ kind: "ready" });
  });

  it("đã chốt → done", () => {
    const now = new Date("2026-10-02T00:00:00Z");
    expect(getFinalizeState(contest("PUBLISHED", "FINALIZED", { finalized_at: "2026-10-01T11:00:00Z" }), now)).toEqual({ kind: "done" });
  });
});

describe("getAdminContestActions", () => {
  const now = new Date("2026-09-30T00:00:00Z");

  it("chờ duyệt: duyệt, từ chối, huỷ, sửa giải", () => {
    const a = getAdminContestActions(contest("PENDING_REVIEW", "PENDING_REVIEW"), "admin-1", now);
    expect(a).toMatchObject({ canApprove: true, canReject: true, canCancel: true, canEditPrizes: true });
  });

  it("đã công bố chưa chốt: huỷ + sửa giải, không duyệt/từ chối", () => {
    const a = getAdminContestActions(contest("PUBLISHED", "UPCOMING"), "admin-1", now);
    expect(a).toMatchObject({ canApprove: false, canReject: false, canCancel: true, canEditPrizes: true });
  });

  it("đã chốt: không huỷ, không sửa giải", () => {
    const a = getAdminContestActions(
      contest("PUBLISHED", "FINALIZED", { finalized_at: "2026-09-29T00:00:00Z" }),
      "admin-1",
      now
    );
    expect(a).toMatchObject({ canCancel: false, canEditPrizes: false });
    expect(a.finalize.kind).toBe("done");
  });

  it("bản nháp/bị từ chối: chỉ duyệt được khi CHÍNH admin tạo", () => {
    expect(getAdminContestActions(contest("REJECTED", "REJECTED", { created_by: "teacher-1" }), "admin-1", now).canApprove).toBe(false);
    expect(getAdminContestActions(contest("DRAFT", "DRAFT", { created_by: "admin-1" }), "admin-1", now).canApprove).toBe(true);
  });
});
