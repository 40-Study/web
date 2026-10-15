/**
 * Ngôn ngữ chạy được trên code editor (contract sec. 3; SSOT backend `service/judge0_languages.go`, phát qua
 * GET /submissions/languages). Danh sách duy nhất mà sandbox (WEB-A), trình soạn bài tập (WEB-B) và màn giảng
 * viên (WEB-C) import. HTML KHÔNG chạy được nên không có ở đây.
 */

export interface RunnableLanguage {
  /** khoá gửi lên backend (`language` của E1, E4, E13) */
  key: string;
  /** nhãn hiển thị, giống `label` của E2 */
  label: string;
  /** id ngôn ngữ của Monaco */
  monacoLang: string;
  /** đuôi tệp mặc định trong sandbox */
  ext: string;
  /** code khởi đầu khi chưa có nháp */
  boilerplate: string;
}

export const RUNNABLE_LANGUAGES: readonly RunnableLanguage[] = [
  {
    key: "python",
    label: "Python 3",
    monacoLang: "python",
    ext: ".py",
    boilerplate: `def main():\n    print("Hello, World!")\n\nif __name__ == "__main__":\n    main()\n`,
  },
  {
    key: "javascript",
    label: "JavaScript (Node.js)",
    monacoLang: "javascript",
    ext: ".js",
    boilerplate: `function main() {\n  console.log("Hello, World!");\n}\n\nmain();\n`,
  },
  {
    key: "cpp",
    label: "C++ (GCC)",
    monacoLang: "cpp",
    ext: ".cpp",
    boilerplate: `#include <iostream>\nusing namespace std;\n\nint main() {\n  cout << "Hello, World!" << endl;\n  return 0;\n}\n`,
  },
  {
    key: "c",
    label: "C (GCC)",
    monacoLang: "c",
    ext: ".c",
    boilerplate: `#include <stdio.h>\n\nint main() {\n  printf("Hello, World!\\n");\n  return 0;\n}\n`,
  },
  {
    key: "java",
    label: "Java",
    monacoLang: "java",
    ext: ".java",
    // Judge0 biên dịch tệp Main.java: lớp công khai phải tên Main.
    boilerplate: `public class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello, World!");\n  }\n}\n`,
  },
  {
    key: "sql",
    label: "SQL (SQLite)",
    monacoLang: "sql",
    ext: ".sql",
    boilerplate: `-- SQL Query\nSELECT 'Hello, World!' AS greeting;\n`,
  },
];

/** Khoá cũ/viết tắt -> khoá chuẩn, giống `runnableLanguageAliases` của backend. */
const LANGUAGE_ALIASES: Record<string, string> = {
  python3: "python",
  js: "javascript",
  "c++": "cpp",
};

/** Chuẩn hoá (trim, chữ thường, alias) rồi tra; khoá không chạy được trả `undefined`. */
export function getRunnableLanguage(key: string): RunnableLanguage | undefined {
  const k = key.trim().toLowerCase();
  const canonical = LANGUAGE_ALIASES[k] ?? k;
  return RUNNABLE_LANGUAGES.find((l) => l.key === canonical);
}
