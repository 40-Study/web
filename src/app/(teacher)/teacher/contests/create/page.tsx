"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Plus, Trash2, GripVertical } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useCreateContest, useCreateProblem } from "@/hooks/queries/use-contests";
import type { CreateContestDTO, CreateProblemDTO } from "@/services/contest.service";

interface ProblemDraft extends CreateProblemDTO {
  id: string;
}

export default function CreateContestPage() {
  const router = useRouter();
  const createContest = useCreateContest();
  const [step, setStep] = useState<"info" | "problems">("info");

  // Contest info
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"CODING" | "QUIZ" | "MIXED">("MIXED");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [duration, setDuration] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [createdContestId, setCreatedContestId] = useState<string | null>(null);

  // Problems
  const [problems, setProblems] = useState<ProblemDraft[]>([]);

  const handleCreateContest = () => {
    if (!title || !startTime || !endTime) return;

    const data: CreateContestDTO = {
      title,
      description: description || undefined,
      type,
      start_time: new Date(startTime).toISOString(),
      end_time: new Date(endTime).toISOString(),
      duration: duration ? parseInt(duration) : undefined,
      is_public: isPublic,
    };

    createContest.mutate(data, {
      onSuccess: (contest) => {
        setCreatedContestId(contest.id);
        setStep("problems");
      },
    });
  };

  const addProblem = () => {
    setProblems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        title: "",
        description: "",
        type: "MULTIPLE_CHOICE",
        difficulty: "EASY",
        points: 10,
      },
    ]);
  };

  const updateProblem = (id: string, updates: Partial<ProblemDraft>) => {
    setProblems((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  const removeProblem = (id: string) => {
    setProblems((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Button variant="ghost" size="sm" onClick={() => router.push("/teacher/contests")}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Quản lý cuộc thi
      </Button>

      <h1 className="text-2xl font-bold">Tạo cuộc thi mới</h1>

      {step === "info" && (
        <Card>
          <CardHeader>
            <CardTitle>Thông tin cuộc thi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tên cuộc thi *</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="VD: Cuộc thi lập trình Python" />
            </div>

            <div className="space-y-2">
              <Label>Mô tả</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Mô tả chi tiết về cuộc thi..." rows={4} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Loại cuộc thi</Label>
                <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CODING">Lập trình</SelectItem>
                    <SelectItem value="QUIZ">Trắc nghiệm</SelectItem>
                    <SelectItem value="MIXED">Tổng hợp</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Thời gian làm bài (phút)</Label>
                <Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="Không giới hạn" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Bắt đầu *</Label>
                <Input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Kết thúc *</Label>
                <Input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
              </div>
            </div>

            <div className="flex items-center justify-between py-2">
              <Label>Công khai cho tất cả học sinh</Label>
              <Switch checked={isPublic} onCheckedChange={setIsPublic} />
            </div>

            <Button
              className="w-full"
              onClick={handleCreateContest}
              disabled={!title || !startTime || !endTime || createContest.isPending}
            >
              {createContest.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Tạo và thêm bài thi
            </Button>
          </CardContent>
        </Card>
      )}

      {step === "problems" && createdContestId && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Thêm bài thi</h2>
            <Button variant="outline" size="sm" onClick={addProblem}>
              <Plus className="h-4 w-4 mr-2" />
              Thêm câu hỏi
            </Button>
          </div>

          {problems.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">
              <p>Chưa có câu hỏi nào. Nhấn &quot;Thêm câu hỏi&quot; để bắt đầu.</p>
            </Card>
          ) : (
            problems.map((problem, index) => (
              <ProblemEditor
                key={problem.id}
                problem={problem}
                index={index}
                contestId={createdContestId}
                onUpdate={(updates) => updateProblem(problem.id, updates)}
                onRemove={() => removeProblem(problem.id)}
              />
            ))
          )}

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={addProblem}>
              <Plus className="h-4 w-4 mr-2" />
              Thêm câu hỏi
            </Button>
            <Button className="flex-1" onClick={() => router.push("/teacher/contests")}>
              Hoàn tất
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function ProblemEditor({
  problem,
  index,
  contestId,
  onUpdate,
  onRemove,
}: {
  problem: ProblemDraft;
  index: number;
  contestId: string;
  onUpdate: (updates: Partial<ProblemDraft>) => void;
  onRemove: () => void;
}) {
  const createProblem = useCreateProblem(contestId);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    const { id, ...data } = problem;
    createProblem.mutate(data, {
      onSuccess: () => setSaved(true),
    });
  };

  return (
    <Card className={cn("p-4 space-y-3", saved && "border-green-200 bg-green-50/30")}>
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Câu {index + 1}</h3>
        <div className="flex items-center gap-2">
          {saved && <Badge className="bg-green-100 text-green-700 text-xs">Đã lưu</Badge>}
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onRemove}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>

      <Input
        placeholder="Tiêu đề câu hỏi"
        value={problem.title}
        onChange={(e) => onUpdate({ title: e.target.value })}
      />

      <Textarea
        placeholder="Nội dung câu hỏi (hỗ trợ markdown)"
        value={problem.description}
        onChange={(e) => onUpdate({ description: e.target.value })}
        rows={3}
      />

      <div className="grid grid-cols-3 gap-3">
        <Select value={problem.type} onValueChange={(v) => onUpdate({ type: v as ProblemDraft["type"] })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="MULTIPLE_CHOICE">Trắc nghiệm</SelectItem>
            <SelectItem value="SHORT_ANSWER">Tự luận ngắn</SelectItem>
            <SelectItem value="CODE">Code</SelectItem>
          </SelectContent>
        </Select>

        <Select value={problem.difficulty} onValueChange={(v) => onUpdate({ difficulty: v as ProblemDraft["difficulty"] })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="EASY">Dễ</SelectItem>
            <SelectItem value="MEDIUM">Trung bình</SelectItem>
            <SelectItem value="HARD">Khó</SelectItem>
          </SelectContent>
        </Select>

        <Input
          type="number"
          placeholder="Điểm"
          value={problem.points}
          onChange={(e) => onUpdate({ points: parseInt(e.target.value) || 0 })}
        />
      </div>

      {problem.type === "MULTIPLE_CHOICE" && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Đáp án đúng</Label>
          <Input
            placeholder="VD: A"
            value={problem.correct_answer ?? ""}
            onChange={(e) => onUpdate({ correct_answer: e.target.value })}
          />
        </div>
      )}

      {problem.type === "SHORT_ANSWER" && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Đáp án đúng</Label>
          <Input
            placeholder="Đáp án"
            value={problem.correct_answer ?? ""}
            onChange={(e) => onUpdate({ correct_answer: e.target.value })}
          />
        </div>
      )}

      {!saved && (
        <Button
          size="sm"
          className="w-full"
          onClick={handleSave}
          disabled={!problem.title || !problem.description || createProblem.isPending}
        >
          {createProblem.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Lưu câu hỏi
        </Button>
      )}
    </Card>
  );
}
