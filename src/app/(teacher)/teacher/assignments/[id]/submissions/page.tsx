"use client";

import { useState, useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  Bell,
  Send,
  Users,
  Filter,
  Search,
  ChevronDown,
  ChevronRight,
  Eye,
  AlertTriangle,
  Loader2,
  FileQuestion,
  Code2,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useAssignment } from "@/hooks/queries/use-assignments";
import { useSubmissionsByAssignment } from "@/hooks/queries/use-submissions";
import type { SubmissionResponseDTO } from "@/services/submission.service";

// ─── Types ─────────────────────────────────────────────────────────────────

type DisplayStatus = "submitted" | "graded" | "late";

interface SubmissionRow {
  studentId: string;
  studentName: string;
  email?: string;
  status: DisplayStatus;
  submittedAt?: string;
  score?: number;
  maxScore: number;
  verdict: string;
  testCasesPassed: number;
  totalTestCases: number;
}

// ─── Helpers: map backend verdict to display status ───────────────────────

function deriveDisplayStatus(sub: SubmissionResponseDTO, endTime?: string): DisplayStatus {
  if (sub.verdict === "accepted") return "graded";
  if (endTime && sub.created_at > endTime) return "late";
  return "submitted";
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusConfig(status: DisplayStatus) {
  switch (status) {
    case "submitted":
      return { label: "Đã nộp", color: "bg-blue-100 text-blue-700", icon: CheckCircle2 };
    case "graded":
      return { label: "Đã chấm", color: "bg-green-100 text-green-700", icon: CheckCircle2 };
    case "late":
      return { label: "Nộp muộn", color: "bg-yellow-100 text-yellow-700", icon: Clock };
  }
}

// ─── Component ─────────────────────────────────────────────────────────────

export default function AssignmentSubmissionsPage() {
  const params = useParams<{ id: string }>();
  const assignmentId = params.id;

  const { data: assignment, isLoading: assignmentLoading } = useAssignment(assignmentId);
  const { data: submissionData, isLoading: submissionsLoading } = useSubmissionsByAssignment(assignmentId);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<DisplayStatus | "all">("all");
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [reminderModalOpen, setReminderModalOpen] = useState(false);
  const [reminderMessage, setReminderMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Map API submissions to display rows
  const submissions: SubmissionRow[] = useMemo(() => {
    if (!submissionData?.data) return [];
    return submissionData.data.map((sub) => ({
      studentId: sub.user_id,
      studentName: sub.user?.username || sub.user_id,
      email: sub.user?.email,
      status: deriveDisplayStatus(sub, assignment?.end_time ?? undefined),
      submittedAt: sub.created_at,
      score: sub.score,
      maxScore: 100,
      verdict: sub.verdict,
      testCasesPassed: sub.test_cases_passed,
      totalTestCases: sub.total_test_cases,
    }));
  }, [submissionData, assignment?.end_time]);

  const totalSubmissions = submissionData?.total ?? submissions.length;

  // Statistics
  const stats = useMemo(() => {
    const submitted = submissions.length;
    const graded = submissions.filter((s) => s.status === "graded").length;
    const late = submissions.filter((s) => s.status === "late").length;
    return { submitted, graded, late };
  }, [submissions]);

  // Filtered submissions
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((s) => {
      const matchesSearch = s.studentName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || s.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [submissions, searchQuery, statusFilter]);

  const toggleSelectAll = useCallback(() => {
    if (selectedStudents.size === filteredSubmissions.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(filteredSubmissions.map((s) => s.studentId)));
    }
  }, [filteredSubmissions, selectedStudents.size]);

  const toggleSelectStudent = useCallback((studentId: string) => {
    setSelectedStudents((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) next.delete(studentId);
      else next.add(studentId);
      return next;
    });
  }, []);

  const toggleExpandRow = useCallback((studentId: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) next.delete(studentId);
      else next.add(studentId);
      return next;
    });
  }, []);

  const handleOpenReminderModal = useCallback(() => {
    setSelectedStudents(new Set(submissions.map((s) => s.studentId)));
    setReminderMessage(
      `Kính gửi học sinh,\n\nNhắc nhở về bài tập "${assignment?.title || ""}". Vui lòng hoàn thành trước hạn.\n\nTrân trọng!`
    );
    setReminderModalOpen(true);
  }, [submissions, assignment?.title]);

  const handleSendReminder = useCallback(async () => {
    if (selectedStudents.size === 0) return;
    setIsSending(true);
    try {
      // API call here
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setReminderModalOpen(false);
      setSelectedStudents(new Set());
    } finally {
      setIsSending(false);
    }
  }, [selectedStudents]);

  const assignmentType = assignment?.type || "homework";
  const TypeIcon =
    assignmentType === "live_coding" ? Code2 : assignmentType === "homework" ? FileQuestion : FileText;

  if (assignmentLoading || submissionsLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="container max-w-6xl py-6 text-center text-muted-foreground">
        Không tìm thấy bài tập
      </div>
    );
  }

  return (
    <div className="container max-w-6xl py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/teacher/assignments">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "p-2 rounded-lg",
                assignmentType === "live_coding" && "bg-purple-100 text-purple-600",
                assignmentType === "homework" && "bg-blue-100 text-blue-600",
                assignmentType === "project" && "bg-orange-100 text-orange-600"
              )}
            >
              <TypeIcon className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">{assignment.title}</h1>
              <p className="text-sm text-muted-foreground">
                Hạn nộp: {formatDate(assignment.end_time)}
              </p>
            </div>
          </div>
        </div>
        <Button onClick={handleOpenReminderModal} className="gap-2">
          <Bell className="h-4 w-4" />
          Gửi nhắc nhở
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          label="Tổng bài nộp"
          value={totalSubmissions}
          color="bg-blue-100 text-blue-700"
        />
        <StatCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          label="Đã chấm điểm"
          value={stats.graded}
          subValue={totalSubmissions > 0 ? `${Math.round((stats.graded / totalSubmissions) * 100)}%` : undefined}
          color="bg-green-100 text-green-700"
        />
        <StatCard
          icon={<Clock className="h-5 w-5" />}
          label="Nộp muộn"
          value={stats.late}
          color="bg-yellow-100 text-yellow-700"
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm học sinh..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as DisplayStatus | "all")}
        >
          <SelectTrigger className="w-40">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="submitted">Đã nộp</SelectItem>
            <SelectItem value="late">Nộp muộn</SelectItem>
            <SelectItem value="graded">Đã chấm</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Submissions Table */}
      <div className="border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="w-12 p-3">
                <input
                  type="checkbox"
                  checked={
                    selectedStudents.size === filteredSubmissions.length &&
                    filteredSubmissions.length > 0
                  }
                  onChange={toggleSelectAll}
                  className="rounded border-input"
                />
              </th>
              <th className="text-left p-3 text-sm font-medium">Học sinh</th>
              <th className="text-left p-3 text-sm font-medium">Trạng thái</th>
              <th className="text-left p-3 text-sm font-medium">Thời gian nộp</th>
              <th className="text-left p-3 text-sm font-medium">Điểm</th>
              <th className="text-right p-3 text-sm font-medium">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredSubmissions.map((submission) => {
              const statusConfig = getStatusConfig(submission.status);
              const StatusIcon = statusConfig.icon;
              const isExpanded = expandedRows.has(submission.studentId);

              return (
                <>
                  <tr
                    key={submission.studentId}
                    className={cn(
                      "border-t hover:bg-muted/30 transition-colors",
                      selectedStudents.has(submission.studentId) && "bg-primary-50"
                    )}
                  >
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={selectedStudents.has(submission.studentId)}
                        onChange={() => toggleSelectStudent(submission.studentId)}
                        className="rounded border-input"
                      />
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleExpandRow(submission.studentId)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-medium text-sm">
                          {submission.studentName.charAt(0)}
                        </div>
                        <span className="font-medium">{submission.studentName}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <div
                        className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                          statusConfig.color
                        )}
                      >
                        <StatusIcon className="h-3.5 w-3.5" />
                        {statusConfig.label}
                      </div>
                    </td>
                    <td className="p-3 text-sm text-muted-foreground">
                      {formatDate(submission.submittedAt)}
                    </td>
                    <td className="p-3">
                      <span className="font-medium">
                        {submission.score}/{submission.maxScore}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" className="gap-1">
                          <Eye className="h-4 w-4" />
                          Xem bài
                        </Button>
                      </div>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr key={`${submission.studentId}-expanded`} className="bg-muted/20">
                      <td colSpan={6} className="p-4 pl-16">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Email:</span>{" "}
                            <span>{submission.email || "-"}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Verdict:</span>{" "}
                            <span className="font-medium">{submission.verdict}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Test cases:</span>{" "}
                            <span>{submission.testCasesPassed}/{submission.totalTestCases}</span>
                          </div>
                          {submission.status === "late" && (
                            <div className="flex items-center gap-2 text-yellow-600">
                              <AlertTriangle className="h-4 w-4" />
                              Bài nộp muộn
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>

        {filteredSubmissions.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">Không tìm thấy học sinh nào</div>
        )}
      </div>

      {/* Reminder Modal */}
      <Dialog open={reminderModalOpen} onOpenChange={setReminderModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Gửi thông báo nhắc nhở
            </DialogTitle>
            <DialogDescription>
              Thông báo sẽ được gửi đến phụ huynh của {selectedStudents.size} học sinh đã chọn
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Học sinh được chọn ({selectedStudents.size})
              </label>
              <div className="flex flex-wrap gap-2 mt-2 max-h-24 overflow-y-auto">
                {Array.from(selectedStudents).map((studentId) => {
                  const student = submissions.find((s) => s.studentId === studentId);
                  return (
                    <Badge key={studentId} variant="secondary" className="gap-1">
                      {student?.studentName || studentId}
                      <button
                        onClick={() => toggleSelectStudent(studentId)}
                        className="ml-1 hover:text-destructive"
                      >
                        <XCircle className="h-3 w-3" />
                      </button>
                    </Badge>
                  );
                })}
              </div>
            </div>

            <Textarea
              label="Nội dung thông báo"
              value={reminderMessage}
              onChange={(e) => setReminderMessage(e.target.value)}
              rows={6}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setReminderModalOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={handleSendReminder}
              disabled={selectedStudents.size === 0 || !reminderMessage.trim()}
              isLoading={isSending}
              className="gap-2"
            >
              <Send className="h-4 w-4" />
              Gửi thông báo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Stat Card ─────────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  subValue,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  subValue?: string;
  color: string;
}) {
  return (
    <div className="border rounded-xl p-4">
      <div className="flex items-center gap-3">
        <div className={cn("p-2 rounded-lg", color)}>{icon}</div>
        <div>
          <p className="text-2xl font-bold">
            {value}
            {subValue && (
              <span className="text-sm font-normal text-muted-foreground ml-1">({subValue})</span>
            )}
          </p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </div>
    </div>
  );
}
