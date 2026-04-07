"use client";

import { useState, useCallback } from "react";
import {
  FileQuestion,
  Code2,
  FileText,
  Plus,
  Trash2,
  GripVertical,
  Check,
  X,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// ─── Types ─────────────────────────────────────────────────────────────────

export type ExerciseType = "quiz" | "code" | "essay";

// Quiz types
export interface QuizOption {
  id: string;
  text: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: QuizOption[];
  correctOptionId: string;
}

export interface QuizFormData {
  type: "quiz";
  title: string;
  questions: QuizQuestion[];
  timeLimit: number; // seconds
}

// Code types
export interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}

export interface CodeFormData {
  type: "code";
  title: string;
  description: string;
  language: string;
  autoGrade: boolean;
  testCases: TestCase[];
  solutionCode: string;
}

// Essay types
export interface EssayFormData {
  type: "essay";
  title: string;
  question: string;
  minWords?: number;
  maxWords?: number;
  timeLimit: number; // seconds
}

export type ExerciseFormData = QuizFormData | CodeFormData | EssayFormData;

interface ExerciseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ExerciseFormData) => void;
  isLoading?: boolean;
  lessonId?: string;
}

// ─── Constants ─────────────────────────────────────────────────────────────

const LANGUAGES = [
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "go", label: "Go" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
  { value: "c", label: "C" },
];

// ─── Helper functions ──────────────────────────────────────────────────────

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

function createEmptyQuestion(): QuizQuestion {
  return {
    id: generateId(),
    question: "",
    options: [
      { id: generateId(), text: "" },
      { id: generateId(), text: "" },
      { id: generateId(), text: "" },
      { id: generateId(), text: "" },
    ],
    correctOptionId: "",
  };
}

function createEmptyTestCase(): TestCase {
  return {
    id: generateId(),
    input: "",
    expectedOutput: "",
    isHidden: false,
  };
}

// ─── Component ─────────────────────────────────────────────────────────────

export function ExerciseModal({
  open,
  onOpenChange,
  onSubmit,
  isLoading = false,
}: ExerciseModalProps) {
  const [exerciseType, setExerciseType] = useState<ExerciseType | null>(null);

  // Quiz state
  const [quizForm, setQuizForm] = useState<QuizFormData>({
    type: "quiz",
    title: "",
    questions: [createEmptyQuestion()],
    timeLimit: 300,
  });

  // Code state
  const [codeForm, setCodeForm] = useState<CodeFormData>({
    type: "code",
    title: "",
    description: "",
    language: "javascript",
    autoGrade: true,
    testCases: [createEmptyTestCase()],
    solutionCode: "",
  });

  // Essay state
  const [essayForm, setEssayForm] = useState<EssayFormData>({
    type: "essay",
    title: "",
    question: "",
    minWords: 50,
    maxWords: 500,
    timeLimit: 600,
  });

  const handleBack = useCallback(() => {
    setExerciseType(null);
  }, []);

  const handleSubmit = useCallback(() => {
    if (exerciseType === "quiz") {
      onSubmit(quizForm);
    } else if (exerciseType === "code") {
      onSubmit(codeForm);
    } else if (exerciseType === "essay") {
      onSubmit(essayForm);
    }
  }, [exerciseType, quizForm, codeForm, essayForm, onSubmit]);

  // Quiz handlers
  const addQuestion = useCallback(() => {
    setQuizForm((prev) => ({
      ...prev,
      questions: [...prev.questions, createEmptyQuestion()],
    }));
  }, []);

  const removeQuestion = useCallback((qId: string) => {
    setQuizForm((prev) => ({
      ...prev,
      questions: prev.questions.filter((q) => q.id !== qId),
    }));
  }, []);

  const updateQuestion = useCallback(
    (qId: string, field: keyof QuizQuestion, value: unknown) => {
      setQuizForm((prev) => ({
        ...prev,
        questions: prev.questions.map((q) =>
          q.id === qId ? { ...q, [field]: value } : q
        ),
      }));
    },
    []
  );

  const updateOption = useCallback((qId: string, optId: string, text: string) => {
    setQuizForm((prev) => ({
      ...prev,
      questions: prev.questions.map((q) =>
        q.id === qId
          ? {
              ...q,
              options: q.options.map((o) => (o.id === optId ? { ...o, text } : o)),
            }
          : q
      ),
    }));
  }, []);

  const addOption = useCallback((qId: string) => {
    setQuizForm((prev) => ({
      ...prev,
      questions: prev.questions.map((q) =>
        q.id === qId
          ? { ...q, options: [...q.options, { id: generateId(), text: "" }] }
          : q
      ),
    }));
  }, []);

  // Code handlers
  const addTestCase = useCallback(() => {
    setCodeForm((prev) => ({
      ...prev,
      testCases: [...prev.testCases, createEmptyTestCase()],
    }));
  }, []);

  const removeTestCase = useCallback((tcId: string) => {
    setCodeForm((prev) => ({
      ...prev,
      testCases: prev.testCases.filter((tc) => tc.id !== tcId),
    }));
  }, []);

  const updateTestCase = useCallback(
    (tcId: string, field: keyof TestCase, value: unknown) => {
      setCodeForm((prev) => ({
        ...prev,
        testCases: prev.testCases.map((tc) =>
          tc.id === tcId ? { ...tc, [field]: value } : tc
        ),
      }));
    },
    []
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Them bai tap</DialogTitle>
          <DialogDescription>
            {!exerciseType
              ? "Chon loai bai tap ban muon tao"
              : exerciseType === "quiz"
              ? "Tao bai trac nghiem"
              : exerciseType === "code"
              ? "Tao bai thuc hanh Code"
              : "Tao bai tu luan"}
          </DialogDescription>
        </DialogHeader>

        {/* Type Selection */}
        {!exerciseType && (
          <div className="grid grid-cols-3 gap-4 py-4">
            <TypeCard
              icon={<FileQuestion className="h-8 w-8" />}
              label="Trac nghiem (Quiz)"
              selected={false}
              onClick={() => setExerciseType("quiz")}
            />
            <TypeCard
              icon={<Code2 className="h-8 w-8" />}
              label="Thuc hanh Code"
              selected={false}
              onClick={() => setExerciseType("code")}
            />
            <TypeCard
              icon={<FileText className="h-8 w-8" />}
              label="Tu luan"
              selected={false}
              onClick={() => setExerciseType("essay")}
            />
          </div>
        )}

        {/* Quiz Form */}
        {exerciseType === "quiz" && (
          <div className="space-y-6 py-4">
            <Input
              label="Tieu de bai kiem tra"
              placeholder="VD: Kiem tra kien thuc Go co ban"
              value={quizForm.title}
              onChange={(e) => setQuizForm((prev) => ({ ...prev, title: e.target.value }))}
            />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Soan thao cau hoi trac nghiem
                </h3>
                <span className="text-sm text-muted-foreground">
                  Tong cong: {quizForm.questions.length} cau hoi
                </span>
              </div>

              {quizForm.questions.map((q, qIdx) => (
                <div key={q.id} className="border rounded-xl p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <GripVertical className="h-5 w-5 text-muted-foreground mt-2.5 cursor-grab" />
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">
                          Cau hoi {qIdx + 1}
                        </span>
                        {quizForm.questions.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeQuestion(q.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                      <Input
                        placeholder="Nhap cau hoi..."
                        value={q.question}
                        onChange={(e) => updateQuestion(q.id, "question", e.target.value)}
                      />

                      {/* Options */}
                      <div className="space-y-2">
                        {q.options.map((opt) => (
                          <div key={opt.id} className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => updateQuestion(q.id, "correctOptionId", opt.id)}
                              className={cn(
                                "flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                                q.correctOptionId === opt.id
                                  ? "border-primary-600 bg-primary-600 text-white"
                                  : "border-input hover:border-primary-400"
                              )}
                            >
                              {q.correctOptionId === opt.id && (
                                <Check className="h-3 w-3" />
                              )}
                            </button>
                            <Input
                              placeholder="Nhap phuong an..."
                              value={opt.text}
                              onChange={(e) => updateOption(q.id, opt.id, e.target.value)}
                              className="flex-1"
                            />
                          </div>
                        ))}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => addOption(q.id)}
                          className="text-primary-600"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Them phuong an
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <Button variant="outline" onClick={addQuestion} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Them cau hoi moi
              </Button>
            </div>
          </div>
        )}

        {/* Code Form */}
        {exerciseType === "code" && (
          <div className="space-y-6 py-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Cau hinh bai tap sandbox
                </label>
              </div>
              <Select
                value={codeForm.language}
                onValueChange={(v) => setCodeForm((prev) => ({ ...prev, language: v }))}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <Switch
                  checked={codeForm.autoGrade}
                  onCheckedChange={(v) =>
                    setCodeForm((prev) => ({ ...prev, autoGrade: v }))
                  }
                />
                <span className="text-sm">Cham diem tu dong</span>
              </div>
            </div>

            <Textarea
              label="De bai"
              placeholder="Hay viet mot function tinh tong cac so chan trong mang..."
              value={codeForm.description}
              onChange={(e) =>
                setCodeForm((prev) => ({ ...prev, description: e.target.value }))
              }
              rows={4}
            />

            {/* Test Cases */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Test Cases
              </h3>
              {codeForm.testCases.map((tc, idx) => (
                <div key={tc.id} className="border rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-primary-600">
                      Test case #{idx + 1}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateTestCase(tc.id, "isHidden", !tc.isHidden)}
                        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                      >
                        {tc.isHidden ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                        {tc.isHidden ? "An" : "Hien"}
                      </button>
                      {codeForm.testCases.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeTestCase(tc.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Textarea
                      label="Test Case Input"
                      placeholder="Nhap dau vao (e.g., [1, 2, 3, 4, 5, 6])"
                      value={tc.input}
                      onChange={(e) => updateTestCase(tc.id, "input", e.target.value)}
                      rows={2}
                    />
                    <Textarea
                      label="Expected Test Output"
                      placeholder="Nhap dau ra mong doi (e.g., 12)"
                      value={tc.expectedOutput}
                      onChange={(e) =>
                        updateTestCase(tc.id, "expectedOutput", e.target.value)
                      }
                      rows={2}
                    />
                  </div>
                </div>
              ))}
              <Button variant="outline" onClick={addTestCase} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add New Test Case
              </Button>
            </div>

            {/* Solution */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Giai phap (Solution)
                </label>
                <button className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
                  <EyeOff className="h-4 w-4" />
                  An giai phap
                </button>
              </div>
              <div className="bg-[#1e1e1e] rounded-xl p-4 font-mono text-sm">
                <Textarea
                  placeholder="function calculateEvenSum(numbers) {&#10;  return numbers.reduce((sum, n) => {&#10;    return n % 2 === 0 ? sum + n : sum;&#10;  }, 0);&#10;}"
                  value={codeForm.solutionCode}
                  onChange={(e) =>
                    setCodeForm((prev) => ({ ...prev, solutionCode: e.target.value }))
                  }
                  rows={6}
                  className="bg-transparent border-none text-green-400 placeholder:text-gray-500 resize-y"
                />
              </div>
            </div>
          </div>
        )}

        {/* Essay Form */}
        {exerciseType === "essay" && (
          <div className="space-y-6 py-4">
            <Input
              label="Tieu de bai tu luan"
              placeholder="VD: Phan tich uu va nhuoc diem cua Go"
              value={essayForm.title}
              onChange={(e) =>
                setEssayForm((prev) => ({ ...prev, title: e.target.value }))
              }
            />

            <Textarea
              label="De bai"
              placeholder="Hay trinh bay chi tiet ve cac uu diem va nhuoc diem cua ngon ngu Go..."
              value={essayForm.question}
              onChange={(e) =>
                setEssayForm((prev) => ({ ...prev, question: e.target.value }))
              }
              rows={4}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                type="number"
                label="So tu toi thieu"
                placeholder="50"
                value={essayForm.minWords || ""}
                onChange={(e) =>
                  setEssayForm((prev) => ({
                    ...prev,
                    minWords: e.target.value ? Number(e.target.value) : undefined,
                  }))
                }
              />
              <Input
                type="number"
                label="So tu toi da"
                placeholder="500"
                value={essayForm.maxWords || ""}
                onChange={(e) =>
                  setEssayForm((prev) => ({
                    ...prev,
                    maxWords: e.target.value ? Number(e.target.value) : undefined,
                  }))
                }
              />
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Thoi gian lam bai (phut)
              </label>
              <Select
                value={String(essayForm.timeLimit / 60)}
                onValueChange={(v) =>
                  setEssayForm((prev) => ({ ...prev, timeLimit: Number(v) * 60 }))
                }
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 phut</SelectItem>
                  <SelectItem value="10">10 phut</SelectItem>
                  <SelectItem value="15">15 phut</SelectItem>
                  <SelectItem value="20">20 phut</SelectItem>
                  <SelectItem value="30">30 phut</SelectItem>
                  <SelectItem value="45">45 phut</SelectItem>
                  <SelectItem value="60">60 phut</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {exerciseType && (
          <DialogFooter className="flex items-center justify-between sm:justify-between">
            <Button variant="ghost" onClick={handleBack}>
              Quay lai
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Huy
              </Button>
              <Button onClick={handleSubmit} isLoading={isLoading}>
                Luu bai tap
              </Button>
            </div>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Type Card Sub-component ───────────────────────────────────────────────

interface TypeCardProps {
  icon: React.ReactNode;
  label: string;
  selected: boolean;
  onClick: () => void;
}

function TypeCard({ icon, label, selected, onClick }: TypeCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 transition-all hover:shadow-md",
        selected
          ? "border-primary-600 bg-primary-50 text-primary-700"
          : "border-input hover:border-primary-300"
      )}
    >
      <div className="p-3 rounded-xl bg-primary-100 text-primary-600">{icon}</div>
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}

export default ExerciseModal;
