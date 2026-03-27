"use client";

import { useState } from "react";
import { Play, Send, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { CodeExerciseProblemPanel } from "./code-exercise-problem-panel";

export interface CodeExerciseProps {
  exercise: {
    id: string;
    title: string;
    difficulty: "EASY" | "MEDIUM" | "HARD";
    problemId: string;
    description: string;
    examples: Array<{ input: string; output: string; explanation?: string }>;
    constraints: string[];
    starterCode: Record<string, string>;
    testCases: Array<{ id: string; input: string; expected: string }>;
    supportedLanguages: string[];
  };
  onSubmit: (code: string, language: string) => void;
  onRun: (code: string, language: string) => void;
}

/** Language display labels shown in the selector dropdown */
const LANGUAGE_LABELS: Record<string, string> = {
  go: "Go (1.21)",
  javascript: "JavaScript (Node 20)",
  typescript: "TypeScript (5.x)",
  python: "Python (3.12)",
  java: "Java (21)",
  cpp: "C++ (17)",
};

/**
 * Full-screen split-panel coding exercise component.
 * Left: scrollable problem description. Right: code editor + test cases.
 */
export function CodeExercise({ exercise, onSubmit, onRun }: CodeExerciseProps) {
  const firstLang = exercise.supportedLanguages[0] ?? "go";
  const [selectedLanguage, setSelectedLanguage] = useState(firstLang);
  const [code, setCode] = useState(exercise.starterCode[firstLang] ?? "");
  const [activeTestCase, setActiveTestCase] = useState(0);
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  function handleLanguageChange(lang: string) {
    setSelectedLanguage(lang);
    setCode(exercise.starterCode[lang] ?? "");
    setLangMenuOpen(false);
  }

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* ── Left panel: problem description ── */}
      <div className="w-[45%] min-w-[320px] bg-white border-r border-gray-200 flex flex-col">
        <CodeExerciseProblemPanel
          problemId={exercise.problemId}
          title={exercise.title}
          difficulty={exercise.difficulty}
          description={exercise.description}
          examples={exercise.examples}
          constraints={exercise.constraints}
        />
      </div>

      {/* ── Divider ── */}
      <div className="w-1 bg-gray-200 flex items-center justify-center cursor-col-resize hover:bg-primary-400 transition-colors">
        <div className="flex flex-col gap-1">
          <span className="w-1 h-1 rounded-full bg-gray-400" />
          <span className="w-1 h-1 rounded-full bg-gray-400" />
          <span className="w-1 h-1 rounded-full bg-gray-400" />
        </div>
      </div>

      {/* ── Right panel: editor + test cases ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center gap-3 px-4 py-2.5 bg-white border-b border-gray-200">
          {/* Language selector */}
          <div className="relative">
            <button
              onClick={() => setLangMenuOpen((v) => !v)}
              className="flex items-center gap-2 px-3 py-1.5 rounded border border-gray-300 bg-white text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-green-500" />
              {LANGUAGE_LABELS[selectedLanguage] ?? selectedLanguage}
              <ChevronDown className="h-3.5 w-3.5 text-gray-500" />
            </button>
            {langMenuOpen && (
              <div className="absolute top-full left-0 mt-1 z-10 bg-white border border-gray-200 rounded-md shadow-lg min-w-[160px]">
                {exercise.supportedLanguages.map((lang) => (
                  <button
                    key={lang}
                    onClick={() => handleLanguageChange(lang)}
                    className={cn(
                      "w-full text-left px-4 py-2 text-sm hover:bg-gray-50",
                      lang === selectedLanguage && "bg-primary-50 text-primary-700 font-medium"
                    )}
                  >
                    {LANGUAGE_LABELS[lang] ?? lang}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1" />

          {/* Run button */}
          <button
            onClick={() => onRun(code, selectedLanguage)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-gray-300 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <Play className="h-3.5 w-3.5" />
            Chay thu
          </button>

          {/* Submit button */}
          <button
            onClick={() => onSubmit(code, selectedLanguage)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors"
          >
            <Send className="h-3.5 w-3.5" />
            Nop bai
          </button>
        </div>

        {/* Code editor */}
        <div className="flex-1 bg-gray-900 overflow-hidden flex">
          {/* Line numbers */}
          <div className="select-none pt-4 px-3 text-right text-gray-600 text-sm font-mono leading-6 min-w-[3rem] bg-gray-900">
            {code.split("\n").map((_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>
          {/* Textarea */}
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
            className="flex-1 bg-transparent text-gray-100 text-sm font-mono leading-6 p-4 pl-2 resize-none outline-none caret-white"
          />
        </div>

        {/* ── Test cases panel ── */}
        <div className="h-48 bg-white border-t border-gray-200 flex flex-col">
          {/* Section header */}
          <div className="px-4 pt-2 pb-0 flex items-center gap-1 text-xs font-bold text-gray-500 tracking-widest uppercase">
            Testcases
          </div>
          {/* Case tabs */}
          <div className="flex gap-1 px-4 pt-2">
            {exercise.testCases.map((tc, idx) => (
              <button
                key={tc.id}
                onClick={() => setActiveTestCase(idx)}
                className={cn(
                  "px-3 py-1 rounded text-sm font-medium transition-colors",
                  idx === activeTestCase
                    ? "bg-primary-600 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                )}
              >
                Case {idx + 1}
              </button>
            ))}
          </div>
          {/* Case details */}
          {exercise.testCases[activeTestCase] && (
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 text-sm">
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                  Input
                </p>
                <div className="bg-gray-50 rounded border border-gray-200 px-3 py-2 font-mono text-gray-800">
                  {exercise.testCases[activeTestCase].input}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                  Expected
                </p>
                <div className="bg-gray-50 rounded border border-gray-200 px-3 py-2 font-mono text-gray-800">
                  {exercise.testCases[activeTestCase].expected}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
