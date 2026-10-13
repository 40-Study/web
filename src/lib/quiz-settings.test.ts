/**
 * QA2 Q2-04: form tạo trắc nghiệm không có ô điểm đạt / số lần làm — save path ghi cứng 70 và 3.
 * Hàm thuần ở đây kiểm tra và đổi giá trị người dùng nhập sang đúng giá trị gửi backend.
 */

import { describe, expect, it } from "vitest";
import {
  DEFAULT_QUIZ_MAX_ATTEMPTS,
  DEFAULT_QUIZ_PASS_PERCENTAGE,
  parseQuizSettings,
  validateQuizSettings,
} from "./quiz-settings";

describe("mặc định", () => {
  it("giữ đúng 70% và 3 lần như trước khi có ô nhập (không đổi hành vi với bài cũ)", () => {
    expect(DEFAULT_QUIZ_PASS_PERCENTAGE).toBe(70);
    expect(DEFAULT_QUIZ_MAX_ATTEMPTS).toBe(3);
  });
});

describe("validateQuizSettings", () => {
  it("hợp lệ: 70 và 3", () => {
    expect(validateQuizSettings({ passPercentage: "70", maxAttempts: "3" })).toEqual({});
    expect(validateQuizSettings({ passPercentage: "100", maxAttempts: "10" })).toEqual({});
    expect(validateQuizSettings({ passPercentage: "99.5", maxAttempts: "1" })).toEqual({});
    // contract BE3 §5: 0 và 100 là biên hợp lệ ở backend
    expect(validateQuizSettings({ passPercentage: "0", maxAttempts: "100" })).toEqual({});
  });

  it.each(["", "  ", "-5", "101", "abc", "1e2", "50.123"])("điểm đạt %j bị từ chối", (v) => {
    expect(validateQuizSettings({ passPercentage: v, maxAttempts: "3" }).passPercentage).toMatch(/Điểm đạt/);
  });

  // Để trống KHÔNG nghĩa là không giới hạn: backend (model.Quiz `gorm:"default:5"`) điền 5 khi vắng -> phải bắt nhập.
  it.each(["", "  ", "0", "-1", "101", "2.5", "abc", "1e2"])("số lần làm %j bị từ chối", (v) => {
    expect(validateQuizSettings({ passPercentage: "70", maxAttempts: v }).maxAttempts).toMatch(/Số lần làm/);
  });
});

describe("parseQuizSettings", () => {
  it("đổi chuỗi nhập sang số gửi backend", () => {
    expect(parseQuizSettings({ passPercentage: " 65 ", maxAttempts: "5" })).toEqual({ pass_percentage: 65, max_attempts: 5 });
    expect(parseQuizSettings({ passPercentage: "82.5", maxAttempts: " 2" })).toEqual({ pass_percentage: 82.5, max_attempts: 2 });
  });
});
