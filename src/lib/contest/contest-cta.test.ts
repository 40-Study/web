/**
 * `resolveContestCta` phủ MỌI nhánh CTA trang chi tiết (contract §7).
 */
import { describe, expect, it } from "vitest";
import type { ContestDetail, ContestJoinBlockReason, ContestPhase, MyParticipation } from "@/types/contest";
import { contestLoginHref, resolveContestCta } from "./contest-cta";

function detail(overrides: Partial<ContestDetail> = {}, viewer: Partial<ContestDetail["viewer"]> = {}): ContestDetail {
  return {
    id: "c1",
    slug: "thi-git",
    title: "Thi Git",
    description: null,
    banner_url: null,
    type: "QUIZ",
    status: "PUBLISHED",
    phase: "ACTIVE",
    start_time: "2026-09-28T10:00:00+07:00",
    end_time: "2026-09-28T12:00:00+07:00",
    duration_minutes: 30,
    max_participants: 0,
    participant_count: 0,
    is_public: true,
    course: null,
    question_count: 3,
    total_points: 3,
    has_voucher_prize: false,
    creator_name: "GV A",
    finalized_at: null,
    created_at: "2026-09-27T10:00:00+07:00",
    updated_at: "2026-09-27T10:00:00+07:00",
    prizes: [],
    server_time: "2026-09-28T11:00:00+07:00",
    certificate_min_percentage: null,
    ...overrides,
    viewer: { can_join: false, join_block_reason: null, my_participation: null, ...viewer },
  };
}

function participation(status: MyParticipation["attempt_status"], extra: Partial<MyParticipation> = {}): MyParticipation {
  return {
    joined_at: "2026-09-28T09:00:00+07:00",
    attempt_id: status === "NOT_STARTED" ? null : "a1",
    attempt_status: status,
    started_at: null,
    deadline_at: null,
    submitted_at: null,
    score: null,
    total_points: null,
    percentage: null,
    time_spent_seconds: null,
    rank: null,
    award: null,
    ...extra,
  };
}

const withReason = (reason: ContestJoinBlockReason, overrides: Partial<ContestDetail> = {}) =>
  detail(overrides, { can_join: false, join_block_reason: reason });

describe("resolveContestCta — chưa đăng ký", () => {
  it("khách (LOGIN_REQUIRED) -> nút đăng nhập, quay lại đúng trang qua ?redirect=", () => {
    const cta = resolveContestCta(withReason("LOGIN_REQUIRED"), null);
    expect(cta).toEqual({ kind: "login", label: "Đăng nhập để tham gia", href: "/login?redirect=%2Fcontests%2Fthi-git" });
    expect(contestLoginHref("thi-git")).not.toContain("next=");
  });

  it("COURSE_REQUIRED -> nút mua khoá trỏ /courses/{slug}", () => {
    const cta = resolveContestCta(withReason("COURSE_REQUIRED", { course: { id: "k1", title: "Git", slug: "git-co-ban" } }), "STUDENT");
    expect(cta.kind).toBe("buy-course");
    if (cta.kind === "buy-course") {
      expect(cta.label).toBe("Mua khoá để tham gia");
      expect(cta.href).toBe("/courses/git-co-ban");
    }
  });

  it("COURSE_REQUIRED mà thiếu thông tin khoá -> chỉ hiện câu mô tả", () => {
    expect(resolveContestCta(withReason("COURSE_REQUIRED"), "STUDENT").kind).toBe("info");
  });

  it("can_join -> nút Đăng ký", () => {
    expect(resolveContestCta(detail({}, { can_join: true }), "STUDENT")).toEqual({ kind: "join", label: "Đăng ký tham gia" });
  });

  it.each([
    ["PARENT", "Chỉ học viên được tham gia cuộc thi"],
    ["TEACHER", "Giảng viên không dự thi"],
    ["SYSTEM_ADMIN", "Quản trị viên chỉ xem"],
  ])("ROLE_NOT_ALLOWED với %s -> câu mô tả riêng, không có nút", (role, text) => {
    const cta = resolveContestCta(withReason("ROLE_NOT_ALLOWED"), role);
    expect(cta.kind).toBe("info");
    if (cta.kind === "info") expect(cta.message).toContain(text);
  });

  it.each<[ContestJoinBlockReason, string]>([
    ["OWNER", "người tạo"],
    ["FULL", "đủ số người"],
    ["CLOSED", "đóng đăng ký"],
    ["ALREADY_JOINED", "đã đăng ký"],
  ])("%s -> câu mô tả, không nút", (reason, text) => {
    const cta = resolveContestCta(withReason(reason), "STUDENT");
    expect(cta.kind).toBe("info");
    if (cta.kind === "info") expect(cta.message).toContain(text);
  });
});

describe("resolveContestCta — đã đăng ký", () => {
  it("NOT_STARTED + UPCOMING -> đếm ngược tới giờ mở", () => {
    const d = detail({ phase: "UPCOMING" }, { my_participation: participation("NOT_STARTED") });
    expect(resolveContestCta(d, "STUDENT")).toMatchObject({ kind: "countdown", targetTime: d.start_time });
  });

  it("NOT_STARTED + ACTIVE -> Bắt đầu, tới trang play", () => {
    const d = detail({ phase: "ACTIVE" }, { my_participation: participation("NOT_STARTED") });
    expect(resolveContestCta(d, "STUDENT")).toEqual({ kind: "start", label: "Bắt đầu làm bài", href: "/contests/thi-git/play" });
  });

  it.each<ContestPhase>(["ENDED", "FINALIZED"])("NOT_STARTED + %s -> thông báo không làm bài", (phase) => {
    const d = detail({ phase }, { my_participation: participation("NOT_STARTED") });
    expect(resolveContestCta(d, "STUDENT").kind).toBe("info");
  });

  it("IN_PROGRESS -> Tiếp tục", () => {
    const d = detail({}, { my_participation: participation("IN_PROGRESS") });
    expect(resolveContestCta(d, "STUDENT")).toEqual({ kind: "continue", label: "Tiếp tục làm bài", href: "/contests/thi-git/play" });
  });

  it("SUBMITTED không có chứng nhận -> Xem kết quả, không có link chứng nhận", () => {
    const d = detail({ phase: "ENDED" }, { my_participation: participation("SUBMITTED") });
    expect(resolveContestCta(d, "STUDENT")).toEqual({
      kind: "result",
      label: "Xem kết quả",
      href: "/contests/thi-git/result",
      certificateHref: null,
    });
  });

  it("SUBMITTED có award.certificate_number -> thêm Xem chứng nhận", () => {
    const d = detail(
      { phase: "FINALIZED" },
      { my_participation: participation("SUBMITTED", { award: { certificate_number: "CONTEST-20260928-abcd1234", voucher: null } }) }
    );
    const cta = resolveContestCta(d, "STUDENT");
    expect(cta.kind === "result" && cta.certificateHref).toBe("/contests/thi-git/certificate");
  });

  it("EXPIRED -> 'Bạn đã hết giờ, bài không được tính'", () => {
    const d = detail({ phase: "ENDED" }, { my_participation: participation("EXPIRED") });
    expect(resolveContestCta(d, "STUDENT")).toEqual({ kind: "expired", message: "Bạn đã hết giờ, bài không được tính." });
  });

  it("đã đăng ký thì bỏ qua join_block_reason (my_participation thắng)", () => {
    const d = detail({ phase: "ACTIVE" }, { join_block_reason: "CLOSED", my_participation: participation("NOT_STARTED") });
    expect(resolveContestCta(d, "STUDENT").kind).toBe("start");
  });
});
