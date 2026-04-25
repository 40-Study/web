"use client";

import { useState, useCallback } from "react";
import {
  Play,
  Send,
  ChevronDown,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Lightbulb,
  Loader2,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ExerciseExample {
  input: string;
  output: string;
  explanation?: string;
}

export interface ExerciseConstraint {
  text: string;
  codeHighlights?: string[];
}

export interface ExerciseTestCase {
  id: string;
  input: string;
  expectedOutput: string;
}

export interface ExerciseData {
  id: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  description: string;
  codeHighlights?: string[]; // Words to highlight as code in description
  examples: ExerciseExample[];
  constraints: ExerciseConstraint[];
  testCases: ExerciseTestCase[];
  starterCode: string;
  solution?: string;
  supportedLanguages: { id: string; name: string; version: string }[];
}

export interface TestResult {
  caseId: string;
  passed: boolean;
  input: string;
  output: string;
  expected: string;
  runtime?: number;
}

export interface SubmitResult {
  status: "accepted" | "wrong_answer" | "time_limit" | "runtime_error" | "compile_error";
  runtime?: number;
  memory?: number;
  testResults: TestResult[];
  message?: string;
}

interface ExerciseLessonContentProps {
  exercise: ExerciseData;
  onRun?: (code: string, language: string) => Promise<TestResult[]>;
  onSubmit?: (code: string, language: string) => Promise<SubmitResult>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function renderTextWithCode(text: string, highlights?: string[]) {
  if (!highlights || highlights.length === 0) {
    return <span>{text}</span>;
  }

  // Build regex to match any of the highlights
  const pattern = highlights.map(h => h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const regex = new RegExp(`(${pattern})`, 'g');
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, idx) =>
        highlights.includes(part) ? (
          <code key={idx} className="px-1.5 py-0.5 mx-0.5 bg-gray-100 text-gray-800 rounded font-mono text-sm">
            {part}
          </code>
        ) : (
          <span key={idx}>{part}</span>
        )
      )}
    </>
  );
}

function getDifficultyConfig(difficulty: ExerciseData["difficulty"]) {
  switch (difficulty) {
    case "easy":
      return { label: "Dễ", color: "bg-green-100 text-green-700" };
    case "medium":
      return { label: "Trung bình", color: "bg-yellow-100 text-yellow-700" };
    case "hard":
      return { label: "Khó", color: "bg-red-100 text-red-700" };
  }
}

function getStatusConfig(status: SubmitResult["status"]) {
  switch (status) {
    case "accepted":
      return { label: "Accepted", color: "text-green-600", icon: CheckCircle };
    case "wrong_answer":
      return { label: "Wrong Answer", color: "text-red-600", icon: XCircle };
    case "time_limit":
      return { label: "Time Limit Exceeded", color: "text-orange-600", icon: Clock };
    case "runtime_error":
      return { label: "Runtime Error", color: "text-red-600", icon: XCircle };
    case "compile_error":
      return { label: "Compile Error", color: "text-red-600", icon: XCircle };
  }
}

// ─── Problem Panel Component ─────────────────────────────────────────────────

function ProblemPanel({ exercise }: { exercise: ExerciseData }) {
  const diffConfig = getDifficultyConfig(exercise.difficulty);

  return (
    <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <span className={cn("px-2.5 py-1 rounded text-xs font-bold uppercase", diffConfig.color)}>
          {diffConfig.label}
        </span>
        <span className="text-sm text-gray-400">ID: {exercise.id}</span>
      </div>

      {/* Title */}
      <h1 className="text-xl font-bold text-gray-900 mb-4">
        Bài tập: {exercise.title}
      </h1>

      {/* Description */}
      <div className="text-gray-700 leading-relaxed mb-6">
        {renderTextWithCode(exercise.description, exercise.codeHighlights)}
      </div>

      {/* Examples */}
      <div className="space-y-4 mb-6">
        {exercise.examples.map((example, idx) => (
          <div key={idx}>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-600 mb-2">
              <Lightbulb className="w-4 h-4 text-yellow-500" />
              Ví dụ {idx + 1}:
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm font-mono">
              <div>
                <span className="text-gray-500">Input: </span>
                <span className="text-gray-800">{example.input}</span>
              </div>
              <div>
                <span className="text-gray-500">Output: </span>
                <span className="text-gray-800">{example.output}</span>
              </div>
              {example.explanation && (
                <div className="pt-2 border-t border-gray-200">
                  <span className="text-gray-500">Giải thích: </span>
                  <span className="text-gray-700 font-sans">{example.explanation}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Constraints */}
      <div>
        <h3 className="font-semibold text-gray-800 mb-3">Ràng buộc:</h3>
        <ul className="space-y-2">
          {exercise.constraints.map((constraint, idx) => (
            <li key={idx} className="text-gray-700 text-sm">
              {renderTextWithCode(constraint.text, constraint.codeHighlights)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ─── Code Editor Panel Component ─────────────────────────────────────────────

function CodeEditorPanel({
  exercise,
  code,
  onCodeChange,
  selectedLanguage,
  onLanguageChange,
  onRun,
  onSubmit,
  isRunning,
  isSubmitting,
  testResults,
  submitResult,
  showSolution,
  onToggleSolution,
}: {
  exercise: ExerciseData;
  code: string;
  onCodeChange: (code: string) => void;
  selectedLanguage: string;
  onLanguageChange: (lang: string) => void;
  onRun: () => void;
  onSubmit: () => void;
  isRunning: boolean;
  isSubmitting: boolean;
  testResults: TestResult[] | null;
  submitResult: SubmitResult | null;
  showSolution: boolean;
  onToggleSolution: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"testcases" | "results">("testcases");
  const [selectedCase, setSelectedCase] = useState(0);

  const currentLang = exercise.supportedLanguages.find(l => l.id === selectedLanguage);
  const hasResults = testResults !== null || submitResult !== null;
  const displayResults = submitResult?.testResults || testResults || [];

  return (
    <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm overflow-hidden relative">
      {/* Editor Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        {/* Language Selector */}
        <div className="relative">
          <button className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            {currentLang?.name} ({currentLang?.version})
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onRun}
            disabled={isRunning || isSubmitting}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              isRunning
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            )}
          >
            {isRunning ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            Chạy thử
          </button>
          <button
            onClick={onSubmit}
            disabled={isRunning || isSubmitting}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              isSubmitting
                ? "bg-blue-400 text-white cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            )}
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Nộp bài
          </button>
        </div>
      </div>

      {/* Code Editor Area */}
      <div className="h-[280px] min-h-[200px] bg-gray-900 p-4 overflow-auto scrollbar-dark">
        <textarea
          value={code}
          onChange={(e) => onCodeChange(e.target.value)}
          className="w-full h-full bg-transparent text-gray-100 font-mono text-sm resize-none outline-none"
          placeholder="// Viết code của bạn ở đây..."
          spellCheck={false}
        />
      </div>

      {/* Resizer */}
      <div className="h-2 bg-gray-100 flex items-center justify-center cursor-row-resize hover:bg-gray-200 transition-colors shrink-0">
        <div className="flex gap-1">
          <span className="w-1 h-1 rounded-full bg-gray-400" />
          <span className="w-1 h-1 rounded-full bg-gray-400" />
          <span className="w-1 h-1 rounded-full bg-gray-400" />
        </div>
      </div>

      {/* Test Results Panel */}
      <div className="flex-1 min-h-[200px] flex flex-col">
        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setActiveTab("testcases")}
            className={cn(
              "px-4 py-3 text-sm font-medium transition-colors",
              activeTab === "testcases"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            TESTCASES
          </button>
          <button
            onClick={() => setActiveTab("results")}
            className={cn(
              "px-4 py-3 text-sm font-medium transition-colors",
              activeTab === "results"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            TEST RESULTS
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
          {activeTab === "testcases" && !hasResults && (
            <div className="space-y-4">
              {/* Test case buttons */}
              <div className="flex flex-wrap gap-2">
                {exercise.testCases.map((tc, idx) => (
                  <button
                    key={tc.id}
                    onClick={() => setSelectedCase(idx)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                      selectedCase === idx
                        ? "bg-gray-200 text-gray-800"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    )}
                  >
                    Case {idx + 1}
                  </button>
                ))}
              </div>

              {/* Selected case details */}
              {exercise.testCases[selectedCase] && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      Input
                    </label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-lg font-mono text-sm text-gray-700">
                      {exercise.testCases[selectedCase].input}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      Expected Output
                    </label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-lg font-mono text-sm text-gray-700">
                      {exercise.testCases[selectedCase].expectedOutput}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {(activeTab === "results" || hasResults) && (
            <div className="space-y-4">
              {/* Status header */}
              {submitResult && (
                <div className="flex items-center gap-3">
                  {(() => {
                    const config = getStatusConfig(submitResult.status);
                    const Icon = config.icon;
                    return (
                      <>
                        <span className={cn("text-lg font-bold", config.color)}>
                          {config.label}
                        </span>
                        {submitResult.runtime && (
                          <span className="text-sm text-gray-500">
                            Runtime: {submitResult.runtime}ms
                          </span>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}

              {/* Test case buttons with results */}
              <div className="flex flex-wrap gap-2">
                {displayResults.map((result, idx) => (
                  <button
                    key={result.caseId}
                    onClick={() => setSelectedCase(idx)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                      selectedCase === idx
                        ? result.passed
                          ? "bg-green-100 text-green-700 ring-2 ring-green-300"
                          : "bg-red-100 text-red-700 ring-2 ring-red-300"
                        : result.passed
                        ? "bg-green-50 text-green-600 hover:bg-green-100"
                        : "bg-red-50 text-red-600 hover:bg-red-100"
                    )}
                  >
                    Case {idx + 1}
                    {result.passed ? (
                      <CheckCircle className="w-3.5 h-3.5" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5" />
                    )}
                  </button>
                ))}
              </div>

              {/* Selected result details */}
              {displayResults[selectedCase] && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      Input
                    </label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-lg font-mono text-sm text-gray-700">
                      {displayResults[selectedCase].input}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                        Output
                      </label>
                      <div className={cn(
                        "mt-1 p-3 rounded-lg font-mono text-sm",
                        displayResults[selectedCase].passed
                          ? "bg-green-50 text-green-700"
                          : "bg-red-50 text-red-700"
                      )}>
                        {displayResults[selectedCase].output}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                        Expected
                      </label>
                      <div className="mt-1 p-3 bg-gray-50 rounded-lg font-mono text-sm text-gray-700">
                        {displayResults[selectedCase].expected}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Solution Toggle Button */}
        {exercise.solution && (
          <div className="border-t border-gray-100 shrink-0">
            <button
              onClick={onToggleSolution}
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Giải pháp (Solution)
              </div>
              <div className="flex items-center gap-1 text-blue-600">
                {showSolution ? (
                  <>
                    <EyeOff className="w-4 h-4" />
                    Ẩn giải pháp
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4" />
                    Xem giải pháp
                  </>
                )}
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Solution Panel - Slides up from bottom (outside overflow container) */}
      {exercise.solution && (
        <div
          className={cn(
            "absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl border border-gray-200 border-b-0 transition-all duration-300 ease-out z-10",
            showSolution
              ? "translate-y-0 opacity-100"
              : "translate-y-full opacity-0 pointer-events-none"
          )}
        >
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-700">Giải pháp mẫu</h4>
              <button
                onClick={onToggleSolution}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
              >
                <EyeOff className="w-4 h-4" />
              </button>
            </div>
            <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto max-h-[300px] overflow-y-auto scrollbar-dark">
              <pre className="text-sm font-mono text-gray-100">
                {exercise.solution}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function ExerciseLessonContent({
  exercise,
  onRun,
  onSubmit,
}: ExerciseLessonContentProps) {
  const [code, setCode] = useState(exercise.starterCode);
  const [selectedLanguage, setSelectedLanguage] = useState(exercise.supportedLanguages[0]?.id || "go");
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[] | null>(null);
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);
  const [showSolution, setShowSolution] = useState(false);

  const handleRun = useCallback(async () => {
    if (!onRun) {
      // Demo mode - simulate results
      setIsRunning(true);
      await new Promise(r => setTimeout(r, 1000));

      const demoResults: TestResult[] = exercise.testCases.map((tc, idx) => ({
        caseId: tc.id,
        passed: Math.random() > 0.3,
        input: tc.input,
        output: tc.expectedOutput,
        expected: tc.expectedOutput,
        runtime: Math.floor(Math.random() * 50) + 5,
      }));

      setTestResults(demoResults);
      setIsRunning(false);
      return;
    }

    setIsRunning(true);
    try {
      const results = await onRun(code, selectedLanguage);
      setTestResults(results);
    } catch (error) {
      console.error("Run failed:", error);
    } finally {
      setIsRunning(false);
    }
  }, [code, selectedLanguage, onRun, exercise.testCases]);

  const handleSubmit = useCallback(async () => {
    if (!onSubmit) {
      // Demo mode - simulate submit
      setIsSubmitting(true);
      await new Promise(r => setTimeout(r, 1500));

      const allPassed = Math.random() > 0.5;
      const demoResults: TestResult[] = exercise.testCases.map((tc, idx) => ({
        caseId: tc.id,
        passed: allPassed || idx > 0,
        input: tc.input,
        output: allPassed ? tc.expectedOutput : "wrong",
        expected: tc.expectedOutput,
        runtime: Math.floor(Math.random() * 50) + 5,
      }));

      setSubmitResult({
        status: allPassed ? "accepted" : "wrong_answer",
        runtime: Math.floor(Math.random() * 100) + 10,
        testResults: demoResults,
      });
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await onSubmit(code, selectedLanguage);
      setSubmitResult(result);
    } catch (error) {
      console.error("Submit failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  }, [code, selectedLanguage, onSubmit, exercise.testCases]);

  return (
    <div className="flex-1 flex gap-5 p-5 overflow-hidden">
      {/* Left: Problem Description */}
      <div className="w-[380px] bg-white rounded-2xl shadow-sm overflow-hidden shrink-0 flex flex-col">
        <ProblemPanel exercise={exercise} />
      </div>

      {/* Middle: Code Editor */}
      <CodeEditorPanel
        exercise={exercise}
        code={code}
        onCodeChange={setCode}
        selectedLanguage={selectedLanguage}
        onLanguageChange={setSelectedLanguage}
        onRun={handleRun}
        onSubmit={handleSubmit}
        isRunning={isRunning}
        isSubmitting={isSubmitting}
        testResults={testResults}
        submitResult={submitResult}
        showSolution={showSolution}
        onToggleSolution={() => setShowSolution(!showSolution)}
      />
    </div>
  );
}

