"use client";

import dynamic from "next/dynamic";
import "./workbench.css";
import { useState } from "react";
import { Check, Code2, Moon, Sun } from "lucide-react";
import { loader } from "@monaco-editor/react";

// Same-origin runtime and workers, including installations without access to a CDN.
loader.config({ paths: { vs: "/monaco/vs" } });
const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

export function MonacoSourceEditor({
  value,
  onChange,
  language,
  modelPath,
  label,
  readOnly = false,
  height = "clamp(320px, 45dvh, 540px)",
}: {
  value: string;
  onChange: (value: string) => void;
  language: string;
  modelPath: string;
  label: string;
  readOnly?: boolean;
  height?: string;
}) {
  const [dark, setDark] = useState(false);
  const filename =
    (
      {
        python: "solution.py",
        python3: "solution.py",
        cpp: "solution.cpp",
        "c++": "solution.cpp",
        javascript: "solution.js",
        java: "Main.java",
        go: "main.go",
        c: "solution.c",
      } as Record<string, string>
    )[language] ?? "solution.txt";
  return (
    <div className="monaco-workbench" data-dark={dark}>
      <div className="monaco-filebar">
        <span className="monaco-filename">
          <Code2 className="h-3.5 w-3.5" />
          {filename}
        </span>
        <span className="monaco-save-state">
          <Check className="h-3 w-3" />
          {readOnly ? "Chỉ đọc" : "Tự lưu bản nháp"}
        </span>
        <button
          type="button"
          aria-label={dark ? "Giao diện code sáng" : "Giao diện code tối"}
          onClick={() => setDark((value) => !value)}
        >
          {dark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
        </button>
      </div>
      <Editor
        height={height}
        path={modelPath}
        language={language === "python3" ? "python" : language === "c++" ? "cpp" : language}
        value={value}
        onChange={(next) => onChange(next ?? "")}
        theme={dark ? "vs-dark" : "light"}
        loading={
          <p role="status" className="p-6 text-sm text-gray-300">
            Đang tải Monaco…
          </p>
        }
        options={{
          ariaLabel: label,
          readOnly,
          automaticLayout: true,
          accessibilitySupport: "on",
          editContext: false,
          fontFamily: "'SFMono-Regular', Menlo, Monaco, Consolas, monospace",
          fontSize: 14,
          lineHeight: 23,
          tabSize: 4,
          insertSpaces: true,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          padding: { top: 22, bottom: 20 },
          lineNumbersMinChars: 4,
          glyphMargin: false,
          renderLineHighlight: "line",
          roundedSelection: false,
          overviewRulerLanes: 0,
          hideCursorInOverviewRuler: true,
          bracketPairColorization: { enabled: true },
          smoothScrolling: true,
          scrollbar: { verticalScrollbarSize: 7, horizontalScrollbarSize: 7 },
          fixedOverflowWidgets: true,
        }}
      />
    </div>
  );
}
