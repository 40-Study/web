import { describe, expect, it } from "vitest";
import {
  ARTICLE_BODY_REQUIRED_MESSAGE,
  ARTICLE_BODY_TOO_LONG_MESSAGE,
  CORRECT_ANSWER_REQUIRED_MESSAGE,
  MAX_ARTICLE_BODY_CHARS,
  TITLE_REQUIRED_MESSAGE,
  hasContentFormErrors,
  isArticleBodyBlank,
  validateArticleForm,
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

describe("isArticleBodyBlank (T1) — Tiptap trống phát ra <p></p>, không phải chuỗi rỗng", () => {
  it.each([
    "",
    "   ",
    "<p></p>",
    "<p> </p>",
    "<p>&nbsp;</p><p><br></p>",
    "<p><strong></strong></p>",
  ])("%j -> trống", (html) => {
    expect(isArticleBodyBlank(html)).toBe(true);
  });

  it.each([
    "<p>Xin chào</p>",
    '<p><img src="https://cdn.example.com/a.png"></p>',
    "<hr>",
    "<ul><li>Một</li></ul>",
  ])("%j -> có nội dung", (html) => {
    expect(isArticleBodyBlank(html)).toBe(false);
  });

  it("null/undefined -> trống", () => {
    expect(isArticleBodyBlank(undefined)).toBe(true);
    expect(isArticleBodyBlank(null)).toBe(true);
  });
});

describe("validateArticleForm (T1)", () => {
  it("tiêu đề và nội dung trống -> cả hai lỗi", () => {
    expect(validateArticleForm(" ", "<p></p>")).toEqual({
      title: TITLE_REQUIRED_MESSAGE,
      body: ARTICLE_BODY_REQUIRED_MESSAGE,
    });
  });

  it("hợp lệ -> không lỗi", () => {
    expect(validateArticleForm("Bài đọc", "<p>Nội dung</p>")).toEqual({});
  });

  it("chạm đúng giới hạn 200000 ký tự thì được, vượt 1 ký tự thì bị chặn (khớp ARTICLE_BODY_TOO_LONG của backend)", () => {
    const atLimit = "<p>" + "a".repeat(MAX_ARTICLE_BODY_CHARS - 7) + "</p>";
    expect(atLimit.length).toBe(MAX_ARTICLE_BODY_CHARS);
    expect(validateArticleForm("Bài đọc", atLimit)).toEqual({});
    expect(validateArticleForm("Bài đọc", atLimit + "x").body).toBe(ARTICLE_BODY_TOO_LONG_MESSAGE);
  });
});
