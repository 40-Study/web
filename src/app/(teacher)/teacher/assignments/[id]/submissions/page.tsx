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

// ─── Types ─────────────────────────────────────────────────────────────────

type SubmissionStatus = "submitted" | "not_submitted" | "late" | "graded";

interface StudentSubmission {
  studentId: string;
  studentName: string;
  studentAvatar?: string;
  parentId?: string;
  parentName?: string;
  parentEmail?: string;
  parentPhone?: string;
  status: SubmissionStatus;
  submittedAt?: string;
  score?: number;
  maxScore?: number;
}

interface AssignmentDetails {
  id: string;
  title: string;
  type: "quiz" | "code" | "essay";
  dueDate?: string;
  maxScore: number;
  totalStudents: number;
  submissions: StudentSubmission[];
}

// ─── Mock Data ─────────────────────────────────────────────────────────────

function generateMockSubmissions(total: number, submitted: number): StudentSubmission[] {
  const names = [
    "Nguyen Van A", "Tran Thi B", "Le Van C", "Pham Thi D", "Hoang Van E",
    "Vu Thi F", "Dang Van G", "Bui Thi H", "Do Van I", "Ngo Thi K",
    "Truong Van L", "Ly Thi M", "Cao Van N", "Dinh Thi O", "Vo Van P",
    "Ta Thi Q", "Mai Van R", "Duong Thi S", "Ho Van T", "Phan Thi U",
    "Trinh Van V", "Tran Van W", "Nguyen Thi X", "Le Thi Y", "Pham Van Z",
  ];

  return names.slice(0, total).map((name, idx) => ({
    studentId: `student-${idx + 1}`,
    studentName: name,
    parentId: `parent-${idx + 1}`,
    parentName: `Phụ huynh của ${name.split(" ").pop()}`,
    parentEmail: `parent${idx + 1}@email.com`,
    parentPhone: `09${String(Math.random()).slice(2, 10)}`,
    status: idx < submitted
      ? (idx < submitted - 3 ? "graded" : (idx < submitted - 1 ? "submitted" : "late"))
      : "not_submitted",
    submittedAt: idx < submitted
      ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
      : undefined,
    score: idx < submitted - 3 ? Math.floor(Math.random() * 30) + 70 : undefined,
    maxScore: 100,
  }));
}

const MOCK_ASSIGNMENT: AssignmentDetails = {
  id: "1",
  title: "Kiểm tra kiến thức Go cơ bản",
  type: "quiz",
  dueDate: "2026-04-15T23:59:59",
  maxScore: 100,
  totalStudents: 25,
  submissions: generateMockSubmissions(25, 18),
};

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

function getStatusConfig(status: SubmissionStatus) {
  switch (status) {
    case "submitted":
      return { label: "Đã nộp", color: "bg-blue-100 text-blue-700", icon: CheckCircle2 };
    case "graded":
      return { label: "Đã chấm", color: "bg-green-100 text-green-700", icon: CheckCircle2 };
    case "late":
      return { label: "Nộp muộn", color: "bg-yellow-100 text-yellow-700", icon: Clock };
    case "not_submitted":
    default:
      return { label: "Chưa nộp", color: "bg-red-100 text-red-700", icon: XCircle };
  }
}

// ─── Component ─────────────────────────────────────────────────────────────

export default function AssignmentSubmissionsPage() {
  const params = useParams<{ id: string }>();
  const assignmentId = params.id;

  // In real app, fetch from API
  const assignment = MOCK_ASSIGNMENT;

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<SubmissionStatus | "all">("all");
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [reminderModalOpen, setReminderModalOpen] = useState(false);
  const [reminderMessage, setReminderMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Statistics
  const stats = useMemo(() => {
    const submitted = assignment.submissions.filter(
      (s) => s.status === "submitted" || s.status === "graded" || s.status === "late"
    ).length;
    const graded = assignment.submissions.filter((s) => s.status === "graded").length;
    const notSubmitted = assignment.submissions.filter((s) => s.status === "not_submitted").length;
    const late = assignment.submissions.filter((s) => s.status === "late").length;
    return { submitted, graded, notSubmitted, late };
  }, [assignment.submissions]);

  // Filtered submissions
  const filteredSubmissions = useMemo(() => {
    return assignment.submissions.filter((s) => {
      const matchesSearch = s.studentName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || s.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [assignment.submissions, searchQuery, statusFilter]);

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
    const notSubmittedIds = assignment.submissions
      .filter((s) => s.status === "not_submitted")
      .map((s) => s.studentId);
    setSelectedStudents(new Set(notSubmittedIds));
    setReminderMessage(
      `Kính gửi Phụ huynh,\n\nHọc sinh của quý phụ huynh chưa nộp bài tập "${assignment.title}". Vui lòng nhắc nhở em hoàn thành trước hạn.\n\nTrân trọng!`
    );
    setReminderModalOpen(true);
  }, [assignment]);

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

  const TypeIcon =
    assignment.type === "quiz" ? FileQuestion : assignment.type === "code" ? Code2 : FileText;

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
                assignment.type === "quiz" && "bg-blue-100 text-blue-600",
                assignment.type === "code" && "bg-purple-100 text-purple-600",
                assignment.type === "essay" && "bg-orange-100 text-orange-600"
              )}
            >
              <TypeIcon className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">{assignment.title}</h1>
              <p className="text-sm text-muted-foreground">
                Hạn nộp: {formatDate(assignment.dueDate)}
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
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          icon={<Users className="h-5 w-5" />}
          label="Tổng học sinh"
          value={assignment.totalStudents}
          color="bg-gray-100 text-gray-700"
        />
        <StatCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          label="Đã nộp"
          value={stats.submitted}
          subValue={`${Math.round((stats.submitted / assignment.totalStudents) * 100)}%`}
          color="bg-blue-100 text-blue-700"
        />
        <StatCard
          icon={<XCircle className="h-5 w-5" />}
          label="Chưa nộp"
          value={stats.notSubmitted}
          subValue={`${Math.round((stats.notSubmitted / assignment.totalStudents) * 100)}%`}
          color="bg-red-100 text-red-700"
        />
        <StatCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          label="Đã chấm điểm"
          value={stats.graded}
          subValue={`${Math.round((stats.graded / assignment.totalStudents) * 100)}%`}
          color="bg-green-100 text-green-700"
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
          onValueChange={(v) => setStatusFilter(v as SubmissionStatus | "all")}
        >
          <SelectTrigger className="w-40">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="submitted">Đã nộp</SelectItem>
            <SelectItem value="not_submitted">Chưa nộp</SelectItem>
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
                      {submission.score !== undefined ? (
                        <span className="font-medium">
                          {submission.score}/{submission.maxScore || assignment.maxScore}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-2">
                        {(submission.status === "submitted" || submission.status === "late") && (
                          <Button variant="ghost" size="sm" className="gap-1">
                            <Eye className="h-4 w-4" />
                            Xem bài
                          </Button>
                        )}
                        {submission.status === "not_submitted" && submission.parentId && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedStudents(new Set([submission.studentId]));
                              setReminderModalOpen(true);
                            }}
                            className="gap-1 text-yellow-600 hover:text-yellow-700"
                          >
                            <Bell className="h-4 w-4" />
                            Nhắc nhở
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr key={`${submission.studentId}-expanded`} className="bg-muted/20">
                      <td colSpan={6} className="p-4 pl-16">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Phụ huynh:</span>{" "}
                            <span className="font-medium">
                              {submission.parentName || "Chưa cập nhật"}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Email:</span>{" "}
                            <span>{submission.parentEmail || "-"}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Số điện thoại:</span>{" "}
                            <span>{submission.parentPhone || "-"}</span>
                          </div>
                          {submission.status === "not_submitted" && (
                            <div className="flex items-center gap-2 text-yellow-600">
                              <AlertTriangle className="h-4 w-4" />
                              Học sinh chưa nộp bài
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
                  const student = assignment.submissions.find((s) => s.studentId === studentId);
                  return (
                    <Badge key={studentId} variant="secondary" className="gap-1">
                      {student?.studentName}
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
