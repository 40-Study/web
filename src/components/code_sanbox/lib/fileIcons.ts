export interface FileIconData {
  svg: string;
  color: string;
}

export function fileIconData(name: string): FileIconData {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";

  if (ext === "py") return {
    color: "#3572A5",
    svg: `<svg viewBox="0 0 32 32" width="16" height="16" xmlns="http://www.w3.org/2000/svg"><path d="M15.9 3C11.6 3 9 5 9 8v2h7v1H6C3.8 11 2 13 2 16s1.8 5 4 5h2v-3c0-2.2 2-4 4-4h8c2 0 3.5-1.5 3.5-3.5V8C23.5 5 21 3 15.9 3zm-1.4 3c.8 0 1.5.7 1.5 1.5S15.3 9 14.5 9 13 8.3 13 7.5 13.7 6 14.5 6z" fill="#3572A5"/><path d="M16.1 29c4.3 0 6.9-2 6.9-5v-2h-7v-1h10c2.2 0 4-2 4-5s-1.8-5-4-5h-2v3c0 2.2-2 4-4 4H12c-2 0-3.5 1.5-3.5 3.5V24c0 3 2.5 5 7.6 5zm1.4-3c-.8 0-1.5-.7-1.5-1.5s.7-1.5 1.5-1.5 1.5.7 1.5 1.5-.7 1.5-1.5 1.5z" fill="#FFD43B"/></svg>`,
  };
  if (ext === "js") return {
    color: "#F7DF1E",
    svg: `<svg viewBox="0 0 32 32" width="16" height="16" xmlns="http://www.w3.org/2000/svg"><rect width="32" height="32" fill="#F7DF1E" rx="3"/><path d="M19.5 22.5c.5 1 1.2 1.7 2.4 1.7 1 0 1.6-.5 1.6-1.2 0-.8-.6-1.1-1.7-1.6l-.6-.3c-1.7-.7-2.8-1.6-2.8-3.5 0-1.7 1.3-3 3.4-3 1.5 0 2.5.5 3.3 1.8l-1.8 1.1c-.4-.7-.8-1-1.5-1-.7 0-1.1.4-1.1 1 0 .7.4 1 1.5 1.5l.6.2c2 .9 3.1 1.7 3.1 3.7 0 2.1-1.7 3.2-3.9 3.2-2.2 0-3.6-1-4.3-2.4l1.8-1.2zM10 22.8c.3.6.6.9 1.1.9.5 0 .8-.2.8-1v-6h2.2v6.1c0 2.2-1.3 3.2-3.1 3.2-1.7 0-2.7-.9-3.2-2l2.2-1.2z" fill="#333"/></svg>`,
  };
  if (ext === "c") return {
    color: "#555599",
    svg: `<svg viewBox="0 0 32 32" width="16" height="16" xmlns="http://www.w3.org/2000/svg"><circle cx="16" cy="16" r="13" fill="#555599"/><path d="M20.5 19.5c-.7 1.3-2 2.2-3.8 2.2-2.8 0-4.7-2-4.7-5.7s1.9-5.7 4.7-5.7c1.8 0 3.1.9 3.8 2.2l-1.8 1c-.4-.8-1.1-1.3-2-1.3-1.7 0-2.6 1.4-2.6 3.8s.9 3.8 2.6 3.8c.9 0 1.6-.5 2-1.3l1.8 1z" fill="white"/></svg>`,
  };
  if (ext === "cpp" || ext === "cc" || ext === "cxx") return {
    color: "#004482",
    svg: `<svg viewBox="0 0 32 32" width="16" height="16" xmlns="http://www.w3.org/2000/svg"><circle cx="16" cy="16" r="13" fill="#004482"/><path d="M14.2 19.5c-.7 1.3-1.8 2.2-3.4 2.2-2.5 0-4.2-2-4.2-5.7s1.7-5.7 4.2-5.7c1.6 0 2.7.9 3.4 2.2l-1.6 1c-.4-.8-1-.3-1.8-1.3-1.5 0-2.3 1.4-2.3 3.8s.8 3.8 2.3 3.8c.8 0 1.4-.5 1.8-1.3l1.6 1zM18 14.5h1.5v-1.5h1.5v1.5H22.5v1.5h-1.5v1.5h-1.5v-1.5H18v-1.5zm5 0h1.5v-1.5h1.5v1.5H27.5v1.5h-1.5v1.5h-1.5v-1.5H21v-1.5z" fill="white"/></svg>`,
  };
  if (ext === "html" || ext === "htm") return {
    color: "#E34C26",
    svg: `<svg viewBox="0 0 32 32" width="16" height="16" xmlns="http://www.w3.org/2000/svg"><path d="M4 3l2.3 26L16 32l9.7-3L28 3H4z" fill="#E34C26"/><path d="M16 29.4l7.8-2.2 2-22.2H16v24.4z" fill="#EF652A"/><path d="M16 13H9.5l.3 3.4H16v-3.4zM16 6H8.8l.3 3.4H16V6zM16 22.6l-.1.1-4-1.1-.3-3H8.3l.5 5.8 7.1 2v-3.8z" fill="white"/><path d="M16 13v3.4h6l-.6 3.4-5.4 1.5v3.8l7.1-2 .1-.5 1-11.5H16zM16 6v3.4h7.3l.3-3.4H16z" fill="#EBEBEB"/></svg>`,
  };
  if (ext === "sql") return {
    color: "#336791",
    svg: `<svg viewBox="0 0 32 32" width="16" height="16" xmlns="http://www.w3.org/2000/svg"><ellipse cx="16" cy="9" rx="11" ry="4" fill="#336791"/><path d="M5 9v5c0 2.2 4.9 4 11 4s11-1.8 11-4V9c0 2.2-4.9 4-11 4S5 11.2 5 9z" fill="#336791" opacity=".9"/><path d="M5 14v5c0 2.2 4.9 4 11 4s11-1.8 11-4v-5c0 2.2-4.9 4-11 4s-11-1.8-11-4z" fill="#336791" opacity=".8"/><path d="M5 19v4c0 2.2 4.9 4 11 4s11-1.8 11-4v-4c0 2.2-4.9 4-11 4s-11-1.8-11-4z" fill="#336791" opacity=".7"/></svg>`,
  };
  return {
    color: "#888",
    svg: `<svg viewBox="0 0 32 32" width="16" height="16" xmlns="http://www.w3.org/2000/svg"><path d="M6 2h14l8 8v22H6V2z" fill="#999"/><path d="M20 2v8h8" fill="none" stroke="white" strokeWidth="1.5"/></svg>`,
  };
}

/** Legacy text badge — kept for tab bar small label */
export function fileIcon(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    py: "py", js: "js", html: "html", htm: "html", sql: "sql",
    cpp: "cpp", cc: "cpp", c: "c",
  };
  return map[ext] ?? "?";
}
