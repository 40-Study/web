"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Trophy,
  Clock,
  Users,
  Code,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Play,
  Loader2,
  Medal,
  Send,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  useContest,
  useContestProblems,
  useContestLeaderboard,
  useJoinContest,
  useSubmitAnswer,
  useMyContestSubmissions,
} from "@/hooks/queries/use-contests";
import { useAuthStore } from "@/stores/auth.store";
import type { ContestProblem, ContestSubmission } from "@/services/contest.service";

const DIFFICULTY_COLORS: Record<string, string> = {
  EASY: "bg-green-100 text-green-700",
  MEDIUM: "bg-yellow-100 text-yellow-700",
  HARD: "bg-red-100 text-red-700",
};

const DIFFICULTY_LABELS: Record<string, string> = {
  EASY: "Dễ",
  MEDIUM: "Trung bình",
  HARD: "Khó",
};

const SUBMISSION_STATUS_LABELS: Record<string, string> = {
  PENDING: "Đang chờ",
  JUDGING: "Đang chấm",
  ACCEPTED: "Đúng",
  WRONG_ANSWER: "Sai",
  TIME_LIMIT: "Quá thời gian",
  MEMORY_LIMIT: "Quá bộ nhớ",
  RUNTIME_ERROR: "Lỗi chạy",
  COMPILATION_ERROR: "Lỗi biên dịch",
};

function ProblemCard({
  problem,
  contestId,
  submissions,
}: {
  problem: ContestProblem;
  contestId: string;
  submissions: ContestSubmission[];
}) {
  const [answer, setAnswer] = useState("");
  const [selectedOption, setSelectedOption] = useState("");
  const submitMutation = useSubmitAnswer(contestId, problem.id);

  const bestSubmission = submissions.find(
    (s) => s.problem_id === problem.id && s.status === "ACCEPTED"
  );

  const handleSubmit = () => {
    if (problem.type === "CODE") {
      submitMutation.mutate({ code: answer, language: "python" });
    } else if (problem.type === "MULTIPLE_CHOICE") {
      submitMutation.mutate({ answer: selectedOption });
    } else {
      submitMutation.mutate({ answer });
    }
  };

  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{problem.title}</h3>
            <Badge className={cn("text-xs", DIFFICULTY_COLORS[problem.difficulty])}>
              {DIFFICULTY_LABELS[problem.difficulty]}
            </Badge>
            {bestSubmission && (
              <Badge className="bg-green-100 text-green-700 text-xs">
                <CheckCircle className="h-3 w-3 mr-1" />
                Đã giải
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {problem.points} điểm
            {problem.time_limit ? ` | Giới hạn: ${problem.time_limit}s` : ""}
          </p>
        </div>
      </div>

      <div className="prose prose-sm max-w-none">
        <div dangerouslySetInnerHTML={{ __html: problem.description.replace(/\n/g, "<br>") }} />
      </div>

      {problem.sample_input && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Input mẫu:</p>
          <pre className="bg-muted p-3 rounded text-sm">{problem.sample_input}</pre>
        </div>
      )}
      {problem.sample_output && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Output mẫu:</p>
          <pre className="bg-muted p-3 rounded text-sm">{problem.sample_output}</pre>
        </div>
      )}

      {/* Answer input */}
      {problem.type === "MULTIPLE_CHOICE" && problem.options ? (
        <div className="space-y-2">
          {Object.entries(problem.options as Record<string, string>).map(([key, value]) => (
            <label
              key={key}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                selectedOption === key
                  ? "border-primary bg-primary/5"
                  : "hover:bg-muted/50"
              )}
            >
              <input
                type="radio"
                name={`problem-${problem.id}`}
                value={key}
                checked={selectedOption === key}
                onChange={() => setSelectedOption(key)}
                className="accent-primary"
              />
              <span className="text-sm">
                <strong>{key}.</strong> {value}
              </span>
            </label>
          ))}
        </div>
      ) : (
        <Textarea
          placeholder={
            problem.type === "CODE"
              ? "Viết code của bạn ở đây..."
              : "Nhập câu trả lời..."
          }
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          rows={problem.type === "CODE" ? 10 : 3}
          className={problem.type === "CODE" ? "font-mono text-sm" : ""}
        />
      )}

      <Button
        onClick={handleSubmit}
        disabled={submitMutation.isPending}
        className="w-full"
      >
        {submitMutation.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <Send className="h-4 w-4 mr-2" />
        )}
        Nộp bài
      </Button>
    </Card>
  );
}

export default function ContestDetailPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const { user } = useAuthStore();

  const { data: contest, isLoading } = useContest(params.slug);
  const { data: problems } = useContestProblems(contest?.id ?? "");
  const { data: leaderboard } = useContestLeaderboard(contest?.id ?? "");
  const { data: mySubmissions } = useMyContestSubmissions(contest?.id ?? "");
  const joinMutation = useJoinContest();

  // useState must be called before any early returns
  const isParticipating = !!contest?.my_participation;
  const [tab, setTab] = useState(isParticipating ? "problems" : "leaderboard");

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!contest) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        Không tìm thấy cuộc thi
      </div>
    );
  }

  const isActive = contest.status === "ACTIVE";
  const canJoin = (isActive || contest.status === "UPCOMING") && !isParticipating;

  return (
    <div className="container max-w-5xl mx-auto py-6 space-y-6">
      {/* Back button */}
      <Button variant="ghost" size="sm" onClick={() => router.push("/contests")}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Tất cả cuộc thi
      </Button>

      {/* Contest header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{contest.title}</h1>
            {contest.description && (
              <p className="text-muted-foreground mt-2">{contest.description}</p>
            )}
          </div>
          {canJoin && (
            <Button
              onClick={() => joinMutation.mutate(contest.id)}
              disabled={joinMutation.isPending}
              size="lg"
            >
              <Play className="h-4 w-4 mr-2" />
              Tham gia
            </Button>
          )}
        </div>

        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          <Badge variant="outline" className="gap-1">
            <Clock className="h-3.5 w-3.5" />
            {new Date(contest.start_time).toLocaleString("vi-VN")} -{" "}
            {new Date(contest.end_time).toLocaleString("vi-VN")}
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Users className="h-3.5 w-3.5" />
            {contest.participant_count} thí sinh
          </Badge>
          {contest.duration && (
            <Badge variant="outline" className="gap-1">
              <Clock className="h-3.5 w-3.5" />
              {contest.duration} phút
            </Badge>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="problems" className="gap-1">
            <Code className="h-4 w-4" />
            Bài thi ({problems?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="leaderboard" className="gap-1">
            <Trophy className="h-4 w-4" />
            Bảng xếp hạng
          </TabsTrigger>
        </TabsList>

        <TabsContent value="problems" className="space-y-4 mt-4">
          {!isParticipating ? (
            <Card className="p-8 text-center text-muted-foreground">
              <Trophy className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Hãy tham gia cuộc thi để xem đề bài</p>
            </Card>
          ) : problems && problems.length > 0 ? (
            problems.map((problem) => (
              <ProblemCard
                key={problem.id}
                problem={problem}
                contestId={contest.id}
                submissions={mySubmissions ?? []}
              />
            ))
          ) : (
            <p className="text-center text-muted-foreground py-8">Chưa có bài thi nào</p>
          )}
        </TabsContent>

        <TabsContent value="leaderboard" className="mt-4">
          <Card>
            <div className="divide-y">
              {/* Header */}
              <div className="grid grid-cols-12 gap-2 px-4 py-3 text-xs font-medium text-muted-foreground bg-muted/50">
                <div className="col-span-1">#</div>
                <div className="col-span-7">Thí sinh</div>
                <div className="col-span-2 text-right">Điểm</div>
                <div className="col-span-2 text-right">Thời gian</div>
              </div>

              {leaderboard?.participants?.length ? (
                leaderboard.participants.map((p, i) => (
                  <div
                    key={p.id}
                    className={cn(
                      "grid grid-cols-12 gap-2 px-4 py-3 items-center",
                      p.user_id === user?.id && "bg-primary/5"
                    )}
                  >
                    <div className="col-span-1 font-bold">
                      {i < 3 ? (
                        <Medal
                          className={cn(
                            "h-5 w-5",
                            i === 0
                              ? "text-yellow-500"
                              : i === 1
                                ? "text-gray-400"
                                : "text-orange-400"
                          )}
                        />
                      ) : (
                        <span className="text-muted-foreground">{i + 1}</span>
                      )}
                    </div>
                    <div className="col-span-7 flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                        {(p.user_name ?? "?")[0].toUpperCase()}
                      </div>
                      <span className="text-sm font-medium truncate">
                        {p.user_name ?? "Unknown"}
                      </span>
                    </div>
                    <div className="col-span-2 text-right font-semibold text-primary">
                      {p.total_score}
                    </div>
                    <div className="col-span-2 text-right text-xs text-muted-foreground">
                      {p.finished_at
                        ? new Date(p.finished_at).toLocaleTimeString("vi-VN")
                        : "—"}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  Chưa có thí sinh nào
                </div>
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
