import type { Language } from "../types";

// ─── Supported languages (C, C++, JS, HTML, SQL, Python) ─────────────────────
export const LANGUAGES: Language[] = [
  { id: 71,  name: "Python",     ext: ".py",   monacoLang: "python"     },
  { id: 63,  name: "JavaScript", ext: ".js",   monacoLang: "javascript" },
  { id: 54,  name: "C++",        ext: ".cpp",  monacoLang: "cpp"        },
  { id: 50,  name: "C",          ext: ".c",    monacoLang: "c"          },
  { id: 82,  name: "SQL",        ext: ".sql",  monacoLang: "sql"        },
  { id: 0,   name: "HTML",       ext: ".html", monacoLang: "html"       },
];

// ─── Default boilerplate per language id ────────────────────────────────────
export const BOILERPLATES: Record<number, string> = {
  71: `def main():\n    print("Hello, World!")\n\nif __name__ == "__main__":\n    main()\n`,
  63: `function main() {\n  console.log("Hello, World!");\n}\n\nmain();\n`,
  54: `#include <iostream>\nusing namespace std;\n\nint main() {\n  cout << "Hello, World!" << endl;\n  return 0;\n}\n`,
  50: `#include <stdio.h>\n\nint main() {\n  printf("Hello, World!\\n");\n  return 0;\n}\n`,
  82: `-- SQL Query\nSELECT 'Hello, World!' AS greeting;\n`,
  0:  `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8" />\n  <title>Hello</title>\n</head>\n<body>\n  <h1>Hello, World!</h1>\n</body>\n</html>\n`,
};
