"use client";

import dynamic from "next/dynamic";
import type { OnMount } from "@monaco-editor/react";
import { useCallback } from "react";
import { useCodeEditor } from "@/hooks/useCodeEditor";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-[#1e1e1e] text-gray-400 text-sm">
      Loading editor...
    </div>
  ),
});

export default function CodeEditor() {
  const {
    selectedLang,
    code,
    setCode,
    stdin,
    setStdin,
    result,
    running,
    error,
    showStdin,
    setShowStdin,
    selectLanguage,
    runCode,
    output,
    isError,
    statusColor,
    languages,
  } = useCodeEditor();

  const handleEditorMount: OnMount = useCallback((editor) => {
    editor.focus();
  }, []);

  return (
    <div className="flex flex-col h-screen bg-[#0d0d0d] text-gray-100 font-mono select-none">
      {/* ── Top bar ── */}
      <div className="flex items-center gap-3 px-4 py-2 bg-[#1a1a1a] border-b border-[#2a2a2a]">
        <span className="text-indigo-400 font-bold text-sm tracking-wider mr-2">
          40Study / Editor
        </span>

        <select
          value={selectedLang.id}
          onChange={(e) => selectLanguage(Number(e.target.value))}
          className="bg-[#2a2a2a] border border-[#3a3a3a] text-gray-200 text-sm rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          {languages.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>

        <button
          onClick={() => setShowStdin((v) => !v)}
          className={`text-xs px-2 py-1 rounded border transition ${
            showStdin
              ? "border-indigo-500 text-indigo-400"
              : "border-[#3a3a3a] text-gray-400 hover:text-gray-200"
          }`}
        >
          stdin
        </button>

        <div className="flex-1" />

        <button
          onClick={runCode}
          disabled={running}
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-1.5 rounded transition"
        >
          {running ? (
            <>
              <span className="animate-spin text-xs">⟳</span> Running...
            </>
          ) : (
            <>▶ Run</>
          )}
        </button>
      </div>

      {/* ── Editor + Output split ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Editor pane */}
        <div className="flex flex-col flex-1 border-r border-[#2a2a2a] overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <MonacoEditor
              height="100%"
              language={selectedLang.monaco}
              value={code}
              onChange={(value) => setCode(value ?? "")}
              onMount={handleEditorMount}
              theme="vs-dark"
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                lineNumbers: "on",
                wordWrap: "on",
                scrollBeyondLastLine: false,
                renderLineHighlight: "line",
                padding: { top: 12, bottom: 12 },
                tabSize: 4,
                automaticLayout: true,
              }}
            />
          </div>

          {showStdin && (
            <div className="border-t border-[#2a2a2a] flex flex-col" style={{ height: 120 }}>
              <div className="text-xs text-gray-500 px-3 pt-2 pb-1">stdin</div>
              <textarea
                value={stdin}
                onChange={(e) => setStdin(e.target.value)}
                placeholder="Type input here..."
                className="flex-1 resize-none bg-[#151515] text-gray-200 text-sm px-3 pb-2 focus:outline-none"
                spellCheck={false}
              />
            </div>
          )}
        </div>

        {/* Right: Output pane */}
        <div className="flex flex-col w-[380px] min-w-[260px] bg-[#111111] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 border-b border-[#2a2a2a]">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Output
            </span>
            {result && (
              <div className="flex items-center gap-3 text-xs">
                <span className={`font-semibold ${statusColor}`}>
                  {result.status.description}
                </span>
                {result.time && (
                  <span className="text-gray-500">{parseFloat(result.time) * 1000} ms</span>
                )}
                {result.memory && (
                  <span className="text-gray-500">{(result.memory / 1024).toFixed(1)} MB</span>
                )}
              </div>
            )}
          </div>

          <div className="flex-1 overflow-auto p-4 text-sm">
            {!result && !error && !running && (
              <p className="text-gray-600 text-xs">Press ▶ Run to execute your code.</p>
            )}
            {running && (
              <p className="text-gray-500 text-xs animate-pulse">Executing...</p>
            )}
            {error && (
              <pre className="text-red-400 whitespace-pre-wrap text-xs">{error}</pre>
            )}
            {result && !error && (
              <pre
                className={`whitespace-pre-wrap text-xs leading-relaxed ${
                  isError ? "text-red-400" : "text-green-300"
                }`}
              >
                {output || <span className="text-gray-600">(no output)</span>}
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
