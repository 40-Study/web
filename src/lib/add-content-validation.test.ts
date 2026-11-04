import { describe, expect, it } from "vitest";
import {
  ARTICLE_BODY_REQUIRED_MESSAGE,
  choiceQuestionError,
  contentFormErrorSummary,
  pruneBlankOptions,
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
    // L1 (QA 261009): backend (`validateArticleBody`) chỉ coi chữ nhìn thấy hoặc <img> là nội dung.
    // Các thẻ này từng bị web coi là "có nội dung" rồi bị backend trả 400 ARTICLE_BODY_REQUIRED.
    "<hr>",
    "<table><tbody><tr><td></td></tr></tbody></table>",
    '<iframe src="https://x.example"></iframe>',
    "<video></video><audio></audio>",
    "<script>alert(1)</script>",
    "<style>p{color:red}</style><p></p>",
    "<p>&#32;&#x20;&ensp;&emsp;&thinsp;</p>",
  ])("%j -> trống", (html) => {
    expect(isArticleBodyBlank(html)).toBe(true);
  });

  it.each([
    "<p>Xin chào</p>",
    '<p><img src="https://cdn.example.com/a.png"></p>',
    "<IMG SRC=x>",
    "<hr><p>chữ</p>",
    "<table><tbody><tr><td>ô</td></tr></tbody></table>",
    "<ul><li>Một</li></ul>",
    "<p>&amp;</p>",
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

// QA3 Q3-22: 2 đến 4 phương án; dòng tóm tắt nêu lỗi thật.
describe("choiceQuestionError (2..4 phương án)", () => {
  const q = (texts: string[], correctIdx: number, question = "Câu?") => ({
    id: "q",
    question,
    correctId: `o${correctIdx}`,
    options: texts.map((text, i) => ({ id: `o${i}`, text })),
  });

  it("2 phương án có chữ + đáp án đúng -> hợp lệ dù 2 ô còn lại trống", () => {
    expect(choiceQuestionError(q(["Đúng", "Sai", "", ""], 0))).toBe("");
  });

  it("chỉ 1 phương án có chữ -> cần ít nhất 2", () => {
    expect(choiceQuestionError(q(["Đúng", "", "", ""], 0))).toBe("Điền ít nhất 2 phương án trả lời.");
  });

  it("đáp án đúng nằm ở ô trống -> báo đúng lỗi đó", () => {
    expect(choiceQuestionError(q(["A", "B", "", ""], 2))).toBe("Đáp án đúng không được để trống.");
  });

  it("trùng phương án (không phân biệt hoa thường) và thiếu nội dung câu hỏi", () => {
    expect(choiceQuestionError(q(["Có", "có", "", ""], 0))).toBe("Các phương án trả lời không được trùng nhau.");
    expect(choiceQuestionError(q(["A", "B", "", ""], 0, "  "))).toBe("Nhập nội dung câu hỏi.");
  });
});

describe("pruneBlankOptions / contentFormErrorSummary", () => {
  it("bỏ ô trống, giữ thứ tự và id các ô còn lại", () => {
    const [pruned] = pruneBlankOptions([{ options: [{ id: "a", text: "A" }, { id: "b", text: "  " }, { id: "c", text: "C" }] }]);
    expect(pruned.options.map((o) => o.id)).toEqual(["a", "c"]);
  });

  it("tóm tắt = lỗi tiêu đề + lỗi THẬT của câu sai đầu tiên, không câu cố định", () => {
    expect(contentFormErrorSummary({ title: "Vui lòng nhập tiêu đề.", questions: { q1: "Nhập nội dung câu hỏi." } })).toBe(
      "Vui lòng nhập tiêu đề. Nhập nội dung câu hỏi."
    );
    expect(contentFormErrorSummary({ questions: { q1: "Điền ít nhất 2 phương án trả lời." } })).not.toMatch(/chưa chọn/);
  });
});
