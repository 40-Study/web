import { describe, expect, it } from "vitest";
import { buildTeachingHTML } from "./preview";
describe("teacher tool exports", () => {
  it("escapes text and includes every slide", () => {
    const html = buildTeachingHTML({
      kind: "slides",
      title: "<script>unsafe</script>",
      slides: [
        { title: "Slide 1", subtitle: "", bullets: ["<img src=x>"], notes: "", layout: "cover" },
        { title: "Slide 2", subtitle: "", bullets: [], notes: "", layout: "content" },
      ],
    });
    const doc = new DOMParser().parseFromString(html, "text/html");
    expect(doc.querySelectorAll("article")).toHaveLength(2);
    expect(doc.querySelector("script,img")).toBeNull();
    expect(doc.body.textContent).toContain("<img src=x>");
  });
  it("exports a working local quiz and safely encodes answer data", () => {
    const html = buildTeachingHTML({
      kind: "quiz",
      title: "Quiz",
      questions: [
        {
          question: "Chọn <script>",
          options: ["</script><img>", "B", "C", "D"],
          correct_answer: 1,
          explanation: "Đúng là B.",
        },
      ],
    });
    const doc = new DOMParser().parseFromString(html, "text/html");
    expect(doc.querySelectorAll('input[type="radio"]')).toHaveLength(4);
    expect(doc.querySelectorAll("script")).toHaveLength(1);
    expect(doc.querySelector("script")?.textContent).toContain('"correct_answer":1');
    expect(doc.querySelector("img")).toBeNull();
    expect(doc.querySelector("form")).not.toBeNull();
  });
});
