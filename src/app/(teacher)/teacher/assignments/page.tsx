"use client";

import DOMPurify from "isomorphic-dompurify";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Calendar,
  CheckCircle2,
  ClipboardList,
  Code2,
  FileText,
  Layers3,
  Loader2,
  Plus,
  Radio,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TiptapEditor } from "@/components/editor";
import { useAuthStore } from "@/stores/auth.store";
import { useMyCourses } from "@/hooks/queries/use-courses";
import { useTeacherLivestreamsForCourse } from "@/hooks/queries/use-livestream-v2";
import {
  useAssignmentsBySession,
  useCreateAssignment,
  usePublishAssignment,
  useUnpublishAssignment,
  useDeleteAssignment,
} from "@/hooks/queries/use-assignments";
import type { ApiCourse } from "@/services/course.service";
import type { AssignmentResponseDTO, AssignmentType, DifficultyLevel } from "@/services/assignment.service";

// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * Backend Assignment.Type chỉ nhận 3 giá trị (check:type IN ('live_coding',
 * 'homework','project') — internal/model/assignment.go). Không có "quiz"/
 * "document" như bản mock cũ; map gần nhất: quiz/code → live_coding.
 */
const ASSIGNMENT_TYPE_OPTIONS: { value: AssignmentType; label: string; icon: React.ReactNode }[] = [
  { value: "live_coding", label: "Live coding", icon: <Code2 className="h-4 w-4" /> },
  { value: "homework", label: "Bài tập về nhà", icon: <FileText className="h-4 w-4" /> },
  { value: "project", label: "Project", icon: <Layers3 className="h-4 w-4" /> },
];

const DIFFICULTY_OPTIONS: { value: DifficultyLevel; label: string }[] = [
  { value: "easy", label: "Dễ" },
  { value: "medium", label: "Trung bình" },
  { value: "hard", label: "Khó" },
];

const TYPE_BADGE_CLASS: Record<AssignmentType, string> = {
  live_coding: "bg-purple-100 text-purple-700 border-purple-200",
  homework: "bg-amber-100 text-amber-700 border-amber-200",
  project: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

// ─── Main page ────────────────────────────────────────────────────────────────

export default function TeacherAssignmentsPage() {
  const searchParams = useSearchParams();
  const { user } = useAuthStore();

  const { data: apiCourses = [], isLoading: coursesLoading } = useMyCourses();

  const courses = useMemo(
    () =>
      apiCourses.map((c: ApiCourse) => ({
        id: c.id,
        title: c.title,
        status: (c.status === "published" ? "published" : "draft") as "published" | "draft",
      })),
    [apiCourses]
  );

  const [courseSearch, setCourseSearch] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>("");

  const [title, setTitle] = useState("");
  const [type, setType] = useState<AssignmentType>("live_coding");
  const [difficulty, setDifficulty] = useState<DifficultyLevel>("medium");
  const [language, setLanguage] = useState("python");
  const [dueAt, setDueAt] = useState("");
  const [instructions, setInstructions] = useState("");

  // Set initial course from URL params once courses load
  useEffect(() => {
    if (courses.length === 0) return;
    const requestedCourseId = searchParams.get("courseId");
    const validCourse = requestedCourseId && courses.some((c) => c.id === requestedCourseId);
    setSelectedCourseId(validCourse ? requestedCourseId! : courses[0]?.id ?? "");
  }, [courses, searchParams]);

  const filteredCourses = useMemo(() => {
    const query = courseSearch.trim().toLowerCase();
    if (!query) return courses;
    return courses.filter((c) => c.title.toLowerCase().includes(query));
  }, [courseSearch, courses]);

  const selectedCourse = useMemo(() => courses.find((c) => c.id === selectedCourseId), [courses, selectedCourseId]);

  const { data: sessions = [], isLoading: sessionsLoading } = useTeacherLivestreamsForCourse(
    user?.id ?? "",
    selectedCourseId
  );

  const {
    data: assignmentList,
    isLoading: assignmentsLoading,
    isError: assignmentsError,
  } = useAssignmentsBySession(selectedSessionId);
  const assignments = useMemo(() => assignmentList?.data ?? [], [assignmentList]);

  const createMutation = useCreateAssignment();
  const publishMutation = usePublishAssignment();
  const unpublishMutation = useUnpublishAssignment();
  const deleteMutation = useDeleteAssignment();

  const stats = useMemo(() => {
    const total = assignments.length;
    const published = assignments.filter((a) => a.is_published).length;
    return { total, published, draft: total - published };
  }, [assignments]);

  const selectedAssignment = useMemo(
    () => assignments.find((a) => a.id === selectedAssignmentId),
    [assignments, selectedAssignmentId]
  );

  const resetForm = () => {
    setTitle("");
    setType("live_coding");
    setDifficulty("medium");
    setLanguage("python");
    setDueAt("");
    setInstructions("");
  };

  const handleCreateAssignment = () => {
    if (!selectedSessionId || !title.trim() || !instructions.trim()) return;
    createMutation.mutate(
      {
        sessionId: selectedSessionId,
        dto: {
          session_id: selectedSessionId,
          type,
          title: title.trim(),
          description: instructions.trim(),
          difficulty,
          language: language
            .split(",")
            .map((l) => l.trim())
            .filter(Boolean),
          end_time: dueAt ? new Date(dueAt).toISOString() : undefined,
        },
      },
      {
        onSuccess: (created) => {
          setSelectedAssignmentId(created.id);
          resetForm();
        },
      }
    );
  };

  const handleTogglePublish = (assignment: AssignmentResponseDTO) => {
    if (assignment.is_published) {
      unpublishMutation.mutate({ id: assignment.id, sessionId: selectedSessionId });
    } else {
      publishMutation.mutate({ id: assignment.id, sessionId: selectedSessionId });
    }
  };

  const handleDelete = (assignmentId: string) => {
    deleteMutation.mutate({ id: assignmentId, sessionId: selectedSessionId });
    if (selectedAssignmentId === assignmentId) setSelectedAssignmentId("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Quản lí bài tập giáo viên</h1>
        <p className="text-sm text-muted-foreground">
          Chọn khóa học → chọn buổi học (livestream) → giao bài tập live_coding / homework / project.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[320px_360px_1fr]">
        {/* Column 1: Course list */}
        <Card className="h-[calc(100vh-15rem)] overflow-hidden">
          <CardHeader className="border-b pb-3">
            <CardTitle className="text-base">1) Tất cả khóa học ({courses.length})</CardTitle>
            <Input
              placeholder="Tìm khóa học..."
              value={courseSearch}
              onChange={(e) => setCourseSearch(e.target.value)}
            />
          </CardHeader>
          <CardContent className="space-y-2 overflow-auto p-3">
            {coursesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : filteredCourses.length === 0 ? (
              <p className="text-sm text-muted-foreground">Không có khóa học phù hợp.</p>
            ) : (
              filteredCourses.map((course) => (
                <button
                  key={course.id}
                  type="button"
                  onClick={() => {
                    setSelectedCourseId(course.id);
                    setSelectedSessionId("");
                    setSelectedAssignmentId("");
                  }}
                  className={`w-full rounded-lg border p-3 text-left transition-colors ${
                    selectedCourseId === course.id ? "border-primary-500 bg-primary-50" : "hover:bg-gray-50"
                  }`}
                >
                  <p className="text-sm font-medium">{course.title}</p>
                  <Badge
                    variant="outline"
                    className={course.status === "published" ? "mt-2 border-green-200 text-green-700" : "mt-2"}
                  >
                    {course.status === "published" ? "Published" : "Draft"}
                  </Badge>
                </button>
              ))
            )}
          </CardContent>
        </Card>

        {/* Column 2: Livestream session list for the course */}
        <Card className="h-[calc(100vh-15rem)] overflow-hidden">
          <CardHeader className="border-b pb-3">
            <CardTitle className="text-base">2) Buổi học (livestream)</CardTitle>
            <p className="text-xs text-muted-foreground">
              Bài tập gắn theo buổi livestream cụ thể của khóa học này.
            </p>
          </CardHeader>
          <CardContent className="space-y-2 overflow-auto p-3">
            {!selectedCourseId ? (
              <p className="text-sm text-muted-foreground">Chọn khóa học để xem buổi học.</p>
            ) : sessionsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Khóa học này chưa có buổi livestream nào do bạn host.
              </p>
            ) : (
              sessions.map((session) => (
                <button
                  key={session.id}
                  type="button"
                  onClick={() => {
                    setSelectedSessionId(session.id);
                    setSelectedAssignmentId("");
                  }}
                  className={`w-full rounded-lg border p-3 text-left transition-colors ${
                    selectedSessionId === session.id ? "border-primary-500 bg-primary-50" : "hover:bg-gray-50"
                  }`}
                >
                  <p className="flex items-center gap-2 text-sm font-medium">
                    <Radio className="h-3.5 w-3.5 text-muted-foreground" />
                    {session.title}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {session.status ?? "scheduled"}
                    {session.scheduled_at ? ` · ${new Date(session.scheduled_at).toLocaleString("vi-VN")}` : ""}
                  </p>
                </button>
              ))
            )}
          </CardContent>
        </Card>

        {/* Column 3: Assignment management */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Khóa học đang chọn</p>
                  <p className="mt-1 font-medium">{selectedCourse?.title ?? "Chưa chọn"}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Buổi học đang chọn</p>
                  <p className="mt-1 font-medium">
                    {sessions.find((s) => s.id === selectedSessionId)?.title ?? "Chưa chọn"}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <SummaryBox icon={<ClipboardList className="h-4 w-4" />} label="Tổng bài" value={stats.total} />
                <SummaryBox icon={<CheckCircle2 className="h-4 w-4" />} label="Published" value={stats.published} />
                <SummaryBox icon={<Calendar className="h-4 w-4" />} label="Draft" value={stats.draft} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">3) Giao bài tập cho buổi học</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="assignment-title">Tên bài tập *</Label>
                <Input
                  id="assignment-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="VD: Live coding: JSX nâng cao"
                  disabled={!selectedSessionId}
                />
              </div>

              <div className="space-y-2">
                <Label>Loại bài tập</Label>
                <Select value={type} onValueChange={(v) => setType(v as AssignmentType)}>
                  <SelectTrigger disabled={!selectedSessionId}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSIGNMENT_TYPE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <span className="inline-flex items-center gap-2">
                          {opt.icon}
                          {opt.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Độ khó</Label>
                <Select value={difficulty} onValueChange={(v) => setDifficulty(v as DifficultyLevel)}>
                  <SelectTrigger disabled={!selectedSessionId}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DIFFICULTY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="assignment-language">Ngôn ngữ (phân cách bởi dấu phẩy) *</Label>
                <Input
                  id="assignment-language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  placeholder="VD: python,cpp"
                  disabled={!selectedSessionId}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="assignment-due">Hạn nộp</Label>
                <Input
                  id="assignment-due"
                  type="datetime-local"
                  value={dueAt}
                  onChange={(e) => setDueAt(e.target.value)}
                  disabled={!selectedSessionId}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="assignment-instructions">Yêu cầu chi tiết *</Label>
                {selectedSessionId ? (
                  <TiptapEditor
                    value={instructions}
                    onChange={setInstructions}
                    placeholder="Mô tả tiêu chí chấm, yêu cầu đầu ra, deadline..."
                    minHeight={150}
                  />
                ) : (
                  <div className="h-[150px] rounded-xl border border-border bg-muted/50" />
                )}
              </div>

              <div className="md:col-span-2">
                <Button
                  onClick={handleCreateAssignment}
                  disabled={
                    !selectedSessionId ||
                    !title.trim() ||
                    !instructions.trim() ||
                    !language.trim() ||
                    createMutation.isPending
                  }
                >
                  {createMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  Tạo bài tập cho buổi học này
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Danh sách bài tập theo buổi học ({assignments.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!selectedSessionId && (
                <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  Chọn một buổi học ở cột giữa để xem bài tập.
                </p>
              )}

              {selectedSessionId && assignmentsLoading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              )}

              {selectedSessionId && assignmentsError && (
                <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                  Không tải được danh sách bài tập. Vui lòng thử lại.
                </p>
              )}

              {selectedSessionId &&
                !assignmentsLoading &&
                assignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className={`rounded-lg border p-3 transition-colors ${
                      assignment.id === selectedAssignmentId ? "border-primary-500 bg-primary-50" : "hover:bg-gray-50"
                    }`}
                    onClick={() => setSelectedAssignmentId(assignment.id)}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium">{assignment.title}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={TYPE_BADGE_CLASS[assignment.type]}>
                          {assignment.type.toUpperCase()}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={
                            assignment.is_published
                              ? "bg-green-100 text-green-700 border-green-200"
                              : "bg-gray-100 text-gray-700 border-gray-200"
                          }
                        >
                          {assignment.is_published ? "PUBLISHED" : "DRAFT"}
                        </Badge>
                      </div>
                    </div>
                    {assignment.end_time && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Hạn nộp: {new Date(assignment.end_time).toLocaleString("vi-VN")}
                      </p>
                    )}

                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant={assignment.is_published ? "outline" : "default"}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTogglePublish(assignment);
                        }}
                        disabled={publishMutation.isPending || unpublishMutation.isPending}
                      >
                        {assignment.is_published ? "Hủy công bố" : "Công bố"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:bg-red-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(assignment.id);
                        }}
                        disabled={deleteMutation.isPending}
                      >
                        Xóa
                      </Button>
                    </div>
                  </div>
                ))}

              {selectedSessionId && !assignmentsLoading && !assignmentsError && assignments.length === 0 && (
                <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  Buổi học này chưa có bài tập. Hãy tạo bài tập đầu tiên ở form phía trên.
                </p>
              )}

              {selectedAssignment && (
                <div className="rounded-lg border bg-gray-50 p-4">
                  <p className="text-sm font-medium">Chi tiết nhanh: {selectedAssignment.title}</p>
                  <div
                    className="prose prose-sm mt-2 max-w-none text-sm text-muted-foreground"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedAssignment.description) }}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function SummaryBox({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-lg border p-3">
      <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>
  );
}
