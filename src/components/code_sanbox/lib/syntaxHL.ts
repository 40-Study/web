// ─── Syntax Highlight ────────────────────────────────────────────────────────

/** Keyword patterns per Judge0 language id */
const KW_MAP: Record<number, RegExp> = {
  71: /\b(def|class|import|from|return|if|else|elif|for|while|in|not|and|or|True|False|None|pass|break|continue|lambda|with|as|try|except|finally|raise|self|print|len|range)\b/g,
  63: /\b(const|let|var|function|return|if|else|for|while|class|import|export|default|new|this|typeof|true|false|null|undefined|async|await|switch|case|break|throw|try|catch)\b/g,
  54: /\b(int|float|double|char|void|return|if|else|for|while|using|namespace|std|class|struct|public|private|new|const|auto|bool|true|false|nullptr|include)\b/g,
  50: /\b(int|float|double|char|void|return|if|else|for|while|struct|const|static|sizeof|NULL|typedef|unsigned|long|short|include)\b/g,
  62: /\b(public|private|protected|class|static|void|int|String|boolean|new|return|if|else|for|while|import|package|extends|implements|final|this|super|null|true|false)\b/g,
  73: /\b(fn|let|mut|const|use|pub|struct|impl|trait|enum|match|if|else|for|while|loop|return|true|false|self|String|Vec|Option|Result|Some|None)\b/g,
  60: /\b(func|var|const|if|else|for|range|return|package|import|struct|interface|map|make|new|go|defer|chan|true|false|nil|type)\b/g,
};

/** Comment pattern per language id — undefined means no comment highlighting */
const CMT_MAP: Record<number, string> = {
  // Python: # to end of line
  71: "#[^\\n]*",
  // JS/TS: // line  or  /* block */
  63: "//[^\\n]*|/\\*[\\s\\S]*?\\*/",
  // C++: // line  or  /* block */
  54: "//[^\\n]*|/\\*[\\s\\S]*?\\*/",
  // C:   // line  or  /* block */
  50: "//[^\\n]*|/\\*[\\s\\S]*?\\*/",
  // Java: // line  or  /* block */
  62: "//[^\\n]*|/\\*[\\s\\S]*?\\*/",
  // Rust: // line  or  /* block */
  73: "//[^\\n]*|/\\*[\\s\\S]*?\\*/",
  // Go:  // line  or  /* block */
  60: "//[^\\n]*|/\\*[\\s\\S]*?\\*/",
};

export function syntaxHL(code: string, langId: number, dark: boolean): string {
  if (!code) return "";
  const e = code
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const c = dark
    ? { kw: "#569cd6", str: "#ce9178", num: "#b5cea8", cmt: "#6a9955" }
    : { kw: "#0070c1", str: "#a31515", num: "#098658", cmt: "#5c8527" };

  const kwSrc  = (KW_MAP[langId] ?? KW_MAP[63]).source;
  const cmtSrc = CMT_MAP[langId];

  // Build a single-pass regex so no group matches inside another group's output.
  // Groups (in order): comment?, string, number, keyword
  const parts: string[] = [];
  if (cmtSrc) parts.push(`(${cmtSrc})`);          // group: cmt (optional)
  parts.push(`("(?:[^"\\\\]|\\\\.)*"|'(?:[^'\\\\]|\\\\.)*'|\`(?:[^\`\\\\]|\\\\.)*\`)`); // str
  parts.push(`(\\b\\d+\\.?\\d*\\b)`);             // num
  parts.push(kwSrc);                               // kw (already has one capture group)

  const rx = new RegExp(parts.join("|"), "g");

  // Capture group indices shift depending on whether cmtSrc is present
  const hasCmt = !!cmtSrc;

  return e.replace(rx, (m, g1, g2, g3, g4) => {
    if (hasCmt) {
      // g1=cmt, g2=str, g3=num, g4=kw
      if (g1 !== undefined) return `<span style="color:${c.cmt}">${m}</span>`;
      if (g2 !== undefined) return `<span style="color:${c.str}">${m}</span>`;
      if (g3 !== undefined) return `<span style="color:${c.num}">${m}</span>`;
    } else {
      // g1=str, g2=num, g3=kw
      if (g1 !== undefined) return `<span style="color:${c.str}">${m}</span>`;
      if (g2 !== undefined) return `<span style="color:${c.num}">${m}</span>`;
    }
    return `<span style="color:${c.kw}">${m}</span>`;
  });
}
