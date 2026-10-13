import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/errors";
import type { Report, ReportTarget } from "@/services/report.service";
import { getReportActionErrorMessage, getReportTargetLink } from "./report-actions";

function report(target: Partial<ReportTarget> | undefined): Report {
  return {
    id: "r",
    reporter_id: "x",
    reported_type: (target?.type as Report["reported_type"]) ?? "course",
    reported_id: target?.id ?? "id-1",
    reason: "spam",
    status: "pending",
    target: target
      ? {
          type: "course", id: "id-1", exists: true, name: "n", status: null, slug: null,
          course_id: null, course_slug: null, owner_id: null, available_actions: [], ...target,
        }
      : undefined,
  };
}

describe("getReportTargetLink", () => {
  it("khoá chưa xuất bản (đã lưu trữ/nháp): trang duyệt khoá của admin, không phải trang công khai 404", () => {
    expect(getReportTargetLink(report({ type: "course", status: "archived", slug: "abc" }))).toEqual({
      href: "/admin/courses",
      newTab: false,
    });
  });

  it("khoá đã xuất bản nhưng thiếu slug: rơi về trang admin", () => {
    expect(getReportTargetLink(report({ type: "course", status: "published", slug: null }))?.href).toBe("/admin/courses");
  });

  it("thảo luận đã ẩn: không link (trang công khai sẽ 404)", () => {
    expect(getReportTargetLink(report({ type: "discussion", status: "hidden", slug: "bai" }))).toBeNull();
  });

  it("đánh giá không có course_slug, hoặc không có target, hoặc đã xoá: không link", () => {
    expect(getReportTargetLink(report({ type: "review", course_slug: null }))).toBeNull();
    expect(getReportTargetLink(report(undefined))).toBeNull();
    expect(getReportTargetLink(report({ type: "user", exists: false }))).toBeNull();
  });
});

describe("getReportActionErrorMessage", () => {
  it.each([
    ["VALIDATION_FAILED", 400, /3 đến 500/],
    ["ACTION_NOT_APPLICABLE", 400, /không áp dụng/],
    ["TARGET_NOT_FOUND", 404, /đã bị xoá/],
    ["TARGET_STATE_UNCHANGED", 409, /đã thay đổi trạng thái/],
    ["REPORT_NOT_FOUND", 404, /không còn tồn tại/],
  ])("%s -> tiếng Việt, không lộ chuỗi tiếng Anh của backend", (code, status, expected) => {
    expect(getReportActionErrorMessage(new ApiError(status, code, "english backend message"))).toMatch(expected);
  });
});
