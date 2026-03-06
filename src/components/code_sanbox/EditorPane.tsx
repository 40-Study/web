"use client";
import { memo, useEffect, useRef } from "react";
import Editor, { useMonaco } from "@monaco-editor/react";
import type { Theme, Language } from "./types";

interface Props {
  T: Theme;
  dark: boolean;
  code: string;
  setCode: (v: string) => void;
  lang: Language;
  focused?: boolean;
  onFocus?: () => void;
}

// Define custom VS Code–style themes once Monaco is loaded
function useMonacoThemes(dark: boolean) {
  const monaco = useMonaco();

  useEffect(() => {
    if (!monaco) return;
    monaco.editor.defineTheme("custom-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [],
      colors: {
        "editor.background": "#1e1e1e",
        "editor.foreground": "#d4d4d4",
        "editorLineNumber.foreground": "#858585",
        "editorLineNumber.activeForeground": "#c6c6c6",
        "editor.lineHighlightBackground": "#2a2d2e",
        "editorCursor.foreground": "#aeafad",
        "editor.selectionBackground": "#264f78",
        "editor.inactiveSelectionBackground": "#3a3d41",
        "scrollbarSlider.background": "#424242",
        "scrollbarSlider.hoverBackground": "#555555",
      },
    });
    monaco.editor.defineTheme("custom-light", {
      base: "vs",
      inherit: true,
      rules: [],
      colors: {
        "editor.background": "#ffffff",
        "editor.foreground": "#1e1e1e",
        "editorLineNumber.foreground": "#a0a0a0",
        "editorLineNumber.activeForeground": "#333333",
        "editor.lineHighlightBackground": "#f0f0f0",
        "editorCursor.foreground": "#333333",
        "editor.selectionBackground": "#add6ff",
        "editor.inactiveSelectionBackground": "#e5ebf1",
        "scrollbarSlider.background": "#c0c0c0",
        "scrollbarSlider.hoverBackground": "#aaaaaa",
      },
    });
  }, [monaco]);

  return dark ? "custom-dark" : "custom-light";
}

const EditorPane = memo(({ T, dark, code, setCode, lang, onFocus }: Props) => {
  const theme = useMonacoThemes(dark);
  // keep a stable ref to setCode to avoid re-mounting the editor on every keystroke
  const setCodeRef = useRef(setCode);
  setCodeRef.current = setCode;

  return (
    <div
      style={{ flex: 1, overflow: "hidden", background: T.bg, minHeight: 0 }}
      onFocus={onFocus}
    >
      <Editor
        height="100%"
        language={lang.monacoLang}
        value={code}
        theme={theme}
        onChange={(v) => setCodeRef.current(v ?? "")}
        options={{
          fontSize: 13,
          lineHeight: 21,
          fontFamily: "'Consolas','Cascadia Code','Menlo','Monaco','Courier New',monospace",
          fontLigatures: true,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          wordWrap: "on",
          tabSize: 4,
          insertSpaces: true,
          automaticLayout: true,
          scrollbar: {
            verticalScrollbarSize: 8,
            horizontalScrollbarSize: 8,
          },
          overviewRulerLanes: 0,
          hideCursorInOverviewRuler: true,
          renderLineHighlight: "line",
          lineNumbersMinChars: 3,
          padding: { top: 10, bottom: 10 },
          fixedOverflowWidgets: true,
        }}
      />
    </div>
  );
});
EditorPane.displayName = "EditorPane";
export default EditorPane;
