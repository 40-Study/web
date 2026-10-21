"use client";

import dynamic from "next/dynamic";
import "./workbench.css";
import { useEffect, useState } from "react";
import { AlertTriangle, Check, Code2, Moon, Sun } from "lucide-react";
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
  const [loadFailed, setLoadFailed] = useState(false);
  // Editor tự gọi loader.init() nhưng chỉ ghi console khi lỗi, nên màn hình kẹt ở "Đang tải Monaco…".
  // init() trả cùng một promise cho mọi lần gọi; promise đã lỗi thì không thử lại được trong trang
  // này, nên lối thoát là tải lại trang.
  useEffect(() => {
    let active = true;
    const pending = loader.init();
    pending.catch((error: { type?: string }) => {
      if (active && error?.type !== "cancelation") setLoadFailed(true);
    });
    return () => {
      active = false;
      pending.cancel();
    };
  }, []);
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
      {loadFailed ? (
        <div
          role="alert"
          className="flex flex-col items-start gap-3 p-6 text-sm"
          style={{ minHeight: height }}
        >
          <p className="flex items-center gap-2 font-medium text-red-700">
            <AlertTriangle className="h-4 w-4" />
            Không tải được trình soạn thảo code.
          </p>
          <p className="text-muted-foreground">
            Kiểm tra kết nối mạng rồi tải lại trang. Bản nháp đã lưu trên trình duyệt vẫn được giữ.
          </p>
          <button
            type="button"
            className="rounded-lg border px-3 py-1.5 font-medium hover:bg-muted"
            onClick={() => window.location.reload()}
          >
            Tải lại trang
          </button>
        </div>
      ) : (
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
      )}
    </div>
  );
}
