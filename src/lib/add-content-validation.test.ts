import { describe, expect, it } from "vitest";
import {
  CORRECT_ANSWER_REQUIRED_MESSAGE,
  TITLE_REQUIRED_MESSAGE,
  hasContentFormErrors,
  validateContentForm,
} from "./add-content-validation";

const question = (id: string, correctId: string) => ({
  id,
  correctId,
  options: [{ id: "a" }, { id: "b" }],
});

describe("validateContentForm (T3/T4)", () => {
  it("tiêu đề trống hoặc chỉ khoảng trắng -> lỗi tiêu đề", () => {
    expect(validateContentForm("", []).title).toBe(TITLE_REQUIRED_MESSAGE);
    expect(validateContentForm("   \n", []).title).toBe(TITLE_REQUIRED_MESSAGE);
  });

  it("câu chưa chọn đáp án đúng (correctId rỗng) -> lỗi đúng câu đó, câu khác không bị ảnh hưởng", () => {
    const errors = validateContentForm("Bài", [question("q1", "a"), question("q2", "")]);
    expect(errors.questions).toEqual({ q2: CORRECT_ANSWER_REQUIRED_MESSAGE });
    expect(errors.title).toBeUndefined();
  });

  it("correctId trỏ tới phương án không còn tồn tại cũng bị chặn", () => {
    expect(validateContentForm("Bài", [question("q1", "zzz")]).questions).toHaveProperty("q1");
  });

  it("hợp lệ -> không lỗi; không có câu hỏi nào (video không kèm quiz) -> không lỗi", () => {
    expect(hasContentFormErrors(validateContentForm("Bài", [question("q1", "b")]))).toBe(false);
    expect(hasContentFormErrors(validateContentForm("Bài", []))).toBe(false);
    expect(hasContentFormErrors(validateContentForm("", []))).toBe(true);
  });
});
