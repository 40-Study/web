import { describe, expect, it } from "vitest";
import {
  AI_UNAVAILABLE_FOR_TEACHER,
  aiNotConfiguredHint,
  aiNotConfiguredNotice,
} from "./ai-unavailable-copy";

const OPS = /env backend|API key|base URL|cấu hình/i;

describe("copy khi AI chưa cấu hình (Q6-T09)", () => {
  it("mặc định (giảng viên): câu liên hệ quản trị viên, không có chỉ dẫn vận hành", () => {
    expect(aiNotConfiguredNotice()).toBe(AI_UNAVAILABLE_FOR_TEACHER);
    expect(aiNotConfiguredNotice(false)).not.toMatch(OPS);
    expect(aiNotConfiguredHint()).not.toMatch(OPS);
  });

  it("quản trị hệ thống: vẫn thấy chỉ dẫn cấu hình env", () => {
    expect(aiNotConfiguredNotice(true)).toContain("Cần hoàn tất cấu hình");
    expect(aiNotConfiguredHint(true)).toContain("env backend");
  });
});
