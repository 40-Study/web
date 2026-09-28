/**
 * Khoá đường dẫn + body của các endpoint Phase 3 theo contract (phase3-contract.md) — lệch 1 ký
 * tự là 404 ở runtime mà typecheck không bắt được.
 */

import type { InternalAxiosRequestConfig } from "axios";
import { AxiosError } from "axios";
import { describe, expect, it } from "vitest";
import { api } from "@/lib/api-client";
import { courseApprovalService } from "./course-approval.service";
import { teacherApplicationService } from "./teacher-application.service";

type Captured = { method?: string; url?: string; data?: unknown; params?: unknown };

/** Chặn request ở adapter, ghi lại method/url/body và trả envelope {message, data}. */
function capture(data: unknown = {}) {
  const calls: Captured[] = [];
  api.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
    calls.push({
      method: config.method,
      url: config.url,
      data: config.data ? JSON.parse(config.data as string) : undefined,
      params: config.params,
    });
    return { data: { message: "ok", data }, status: 200, statusText: "OK", headers: {}, config };
  };
  return calls;
}

describe("courseApprovalService — contract phase3", () => {
  it("submitReview → POST /courses/:id/submit-review, body rỗng", async () => {
    const calls = capture({ id: "c1", status: "pending_review" });
    await courseApprovalService.submitReview("c1");
    expect(calls[0]).toMatchObject({ method: "post", url: "/courses/c1/submit-review", data: undefined });
  });

  it("adminList/approve/reject → đúng path + {reason}", async () => {
    const calls = capture({ courses: [], total: 0, page: 1, page_size: 20 });
    await courseApprovalService.adminList({ status: "pending_review", page: 2, page_size: 20 });
    await courseApprovalService.approve("c1");
    await courseApprovalService.reject("c1", "Thiếu nội dung");

    expect(calls[0]).toMatchObject({
      method: "get",
      url: "/admin/courses",
      params: { status: "pending_review", page: 2, page_size: 20 },
    });
    expect(calls[1]).toMatchObject({ method: "post", url: "/admin/courses/c1/approve" });
    expect(calls[2]).toMatchObject({
      method: "post",
      url: "/admin/courses/c1/reject",
      data: { reason: "Thiếu nội dung" },
    });
  });
});

describe("teacherApplicationService — contract phase3", () => {
  it("getMine: 404 → null (chưa có hồ sơ), không ném lỗi", async () => {
    api.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
      throw new AxiosError("nf", "ERR_BAD_REQUEST", config, undefined, {
        status: 404,
        statusText: "Not Found",
        headers: {},
        config,
        data: { message: "Teacher profile not found" },
      });
    };
    await expect(teacherApplicationService.getMine()).resolves.toBeNull();
  });

  it("create/update/resubmit/approve/reject → đúng path, KHÔNG gửi user_id", async () => {
    const calls = capture({});
    await teacherApplicationService.create({ specialization: "Toán" });
    await teacherApplicationService.update("p1", { specialization: "Lý" });
    await teacherApplicationService.resubmit();
    await teacherApplicationService.approve("u1");
    await teacherApplicationService.reject("u1", "Thiếu bằng cấp");

    expect(calls.map((c) => `${c.method} ${c.url}`)).toEqual([
      "post /teacher-profiles",
      "put /teacher-profiles/p1",
      "post /teacher-profiles/me/resubmit",
      "post /admin/teacher-applications/u1/approve",
      "post /admin/teacher-applications/u1/reject",
    ]);
    expect(calls[0].data).toEqual({ specialization: "Toán" });
    expect(calls[4].data).toEqual({ reason: "Thiếu bằng cấp" });
  });
});
