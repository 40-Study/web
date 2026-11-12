"use client";

import { sanitizeHtml } from "@/lib/sanitize-html";
import { sessionStatusLabel } from "@/lib/session-status";
import { formatVnDateThenTime } from "@/lib/vn-datetime";
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
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
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
import { AssignmentListItem } from "./assignment-list-item";
import { orderAssignmentCourses } from "./assignment-course-order";
import { COURSE_STATUS_LABEL, isCourseStatus } from "@/types/approval";
import type { ApiCourse } from "@/services/course.service";
import type { AssignmentResponseDTO, AssignmentType, DifficultyLevel } from "@/services/assignment.service";

// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * Backend Assignment.Type chỉ nhận 3 giá trị (check:type IN ('live_coding',
 * 'homework','project') — internal/model/assignment.go). Không có "quiz"/
 * "document" như bản mock cũ; map gần nhất: quiz/code → live_coding.
 */
const ASSIGNMENT_TYPE_OPTIONS: { value: AssignmentType; label: string; icon: React.ReactNode }[] = [
  { value: "live_coding", label: "Lập trình trực tiếp", icon: <Code2 className="h-4 w-4" /> },
  { value: "homework", label: "Bài tập về nhà", icon: <FileText className="h-4 w-4" /> },
  { value: "project", label: "Dự án", icon: <Layers3 className="h-4 w-4" /> },
];

/** QA vòng 2 (D8): badge từng in thẳng enum `LIVE_CODING`; nay dùng nhãn tiếng Việt cùng nguồn với ô chọn. */
const TYPE_LABEL = Object.fromEntries(ASSIGNMENT_TYPE_OPTIONS.map((o) => [o.value, o.label])) as Record<AssignmentType, string>;

const DIFFICULTY_OPTIONS: { value: DifficultyLevel; label: string }[] = [
  { value: "easy", label: "Dễ" },
  { value: "medium", label: "Trung bình" },
  { value: "hard", label: "Khó" },
];

// ─── Main page ────────────────────────────────────────────────────────────────

export default function TeacherAssignmentsPage() {
  const searchParams = useSearchParams();
  const { user } = useAuthStore();

  const { data: apiCourses = [], isLoading: coursesLoading } = useMyCourses();

  const ordered = useMemo(() => orderAssignmentCourses(apiCourses as ApiCourse[]), [apiCourses]);
  const courses = useMemo(() => [...ordered.published, ...ordered.others], [ordered]);

  const [courseSearch, setCourseSearch] = useState("");
  // Khoá chưa xuất bản gom xuống cuối và thu gọn mặc định (QA-B-08).
  const [showUnpublished, setShowUnpublished] = useState(false);
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
    setSelectedCourseId(validCourse ? requestedCourseId! : ordered.defaultId);
    if (validCourse && ordered.others.some((c) => c.id === requestedCourseId)) setShowUnpublished(true);
  }, [courses, ordered, searchParams]);

  const filteredCourses = useMemo(() => {
    const query = courseSearch.trim().toLowerCase();
    const match = (c: { title: string }) => !query || c.title.toLowerCase().includes(query);
    return { published: ordered.published.filter(match), others: ordered.others.filter(match) };
  }, [courseSearch, ordered]);
  // Đang tìm kiếm thì không giấu kết quả trong nhóm thu gọn.
  const othersVisible = showUnpublished || courseSearch.trim() !== "";

  const renderCourseButton = (course: (typeof courses)[number]) => (
    <button
      key={course.id}
      type="button"
      onClick={() => {
        setSelectedCourseId(course.id);
        setSelectedSessionId("");
        setSelectedAssignmentId("");
      }}
      className={`w-full rounded-lg border p-3 text-left transition-colors ${
        selectedCourseId === course.id ? "border-primary-500 bg-primary-50 dark:bg-primary-500/10" : "hover:bg-muted/50"
      }`}
    >
      <p className="text-sm font-medium">{course.title}</p>
      <Badge variant="outline" className={course.isPublished ? "mt-2 border-green-200 text-green-700 dark:border-green-500/30 dark:text-green-300" : "mt-2"}>
        {isCourseStatus(course.status) ? COURSE_STATUS_LABEL[course.status] : "Chưa xuất bản"}
      </Badge>
    </button>
  );

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
        <h1 className="text-2xl font-bold">Quản lý bài tập</h1>
        <p className="text-sm text-muted-foreground">
          Chọn khoá học → chọn buổi học trực tiếp → giao bài tập lập trình trực tiếp, bài tập về nhà hoặc dự án.
        </p>
      </div>

      {/* Q3-20: 3 cột ở 1280px chỉ chừa ~270px cho form (nhãn/ô ngày bị cắt). Khoá học + buổi học xếp 2 cột
            phía trên, phần quản lý bài tập chiếm cả hàng bên dưới. */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Column 1: Course list */}
        <Card className="flex h-[22rem] flex-col overflow-hidden">
          <CardHeader className="border-b pb-3">
            <CardTitle className="text-base">1) Tất cả khoá học ({courses.length})</CardTitle>
            <Input
              placeholder="Tìm khoá học..."
              value={courseSearch}
              onChange={(e) => setCourseSearch(e.target.value)}
            />
          </CardHeader>
          <CardContent className="min-h-0 flex-1 space-y-2 overflow-auto p-3">
            {coursesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : filteredCourses.published.length + filteredCourses.others.length === 0 ? (
              <p className="text-sm text-muted-foreground">Không có khoá học phù hợp.</p>
            ) : (
              <>
                {filteredCourses.published.map(renderCourseButton)}
                {filteredCourses.published.length === 0 && !othersVisible && (
                  <p className="text-sm text-muted-foreground">Chưa có khoá học nào đã xuất bản.</p>
                )}
                {filteredCourses.others.length > 0 && (
                  <>
                    <button
                      type="button"
                      aria-expanded={othersVisible}
                      onClick={() => setShowUnpublished((v) => !v)}
                      className="w-full pt-2 text-left text-xs font-medium text-muted-foreground hover:text-foreground"
                    >
                      {othersVisible ? "Ẩn" : "Hiện"} khoá chưa xuất bản ({filteredCourses.others.length})
                    </button>
                    {othersVisible && filteredCourses.others.map(renderCourseButton)}
                  </>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Column 2: Livestream session list for the course */}
        <Card className="flex h-[22rem] flex-col overflow-hidden">
          <CardHeader className="border-b pb-3">
            <CardTitle className="text-base">2) Buổi học trực tiếp</CardTitle>
            <p className="text-xs text-muted-foreground">
              Bài tập gắn theo buổi học trực tiếp cụ thể của khoá học này.
            </p>
          </CardHeader>
          <CardContent className="min-h-0 flex-1 space-y-2 overflow-auto p-3">
            {!selectedCourseId ? (
              <p className="text-sm text-muted-foreground">Chọn khoá học để xem buổi học.</p>
            ) : sessionsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Khoá học này chưa có buổi học trực tiếp nào do bạn phụ trách.
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
                    selectedSessionId === session.id ? "border-primary-500 bg-primary-50 dark:bg-primary-500/10" : "hover:bg-muted/50"
                  }`}
                >
                  <p className="flex items-center gap-2 text-sm font-medium">
                    <Radio className="h-3.5 w-3.5 text-muted-foreground" />
                    {session.title}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {sessionStatusLabel(session.status)}
                    {session.scheduled_at ? ` · ${formatVnDateThenTime(session.scheduled_at)}` : ""}
                  </p>
                </button>
              ))
            )}
          </CardContent>
        </Card>

        {/* Column 3: Assignment management. `min-w-0`: cột lưới `1fr` mặc định không co nhỏ hơn nội dung (nút
            whitespace-nowrap) nên ở 1280px (breakpoint xl) cả trang tràn ngang 8px (Q2-07). */}
        <div className="min-w-0 space-y-4 lg:col-span-2">
          <Card>
            <CardContent className="p-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Khoá học đang chọn</p>
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
                <SummaryBox icon={<CheckCircle2 className="h-4 w-4" />} label="Đã công bố" value={stats.published} />
                <SummaryBox icon={<Calendar className="h-4 w-4" />} label="Bản nháp" value={stats.draft} />
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
                  placeholder="VD: Lập trình trực tiếp: JSX nâng cao"
                  disabled={!selectedSessionId}
                />
              </div>

              <div className="space-y-2">
                <Label>Loại bài tập</Label>
                <Select value={type} onValueChange={(v) => setType(v as AssignmentType)}>
                  <SelectTrigger disabled={!selectedSessionId}>
                    {/* SelectValue dùng chung chỉ biết nhãn sau khi mở danh sách lần đầu -> tự in nhãn (QA T #4). */}
                    <span>{TYPE_LABEL[type]}</span>
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
                    <span>{DIFFICULTY_OPTIONS.find((o) => o.value === difficulty)?.label ?? difficulty}</span>
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
                  className="h-auto min-h-10 max-w-full whitespace-normal text-center"
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
                <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
                  Không tải được danh sách bài tập. Vui lòng thử lại.
                </p>
              )}

              {selectedSessionId &&
                !assignmentsLoading &&
                assignments.map((assignment) => (
                  <AssignmentListItem
                    key={assignment.id}
                    assignment={assignment}
                    typeLabel={TYPE_LABEL[assignment.type] ?? assignment.type}
                    selected={assignment.id === selectedAssignmentId}
                    onSelect={() => setSelectedAssignmentId(assignment.id)}
                    onTogglePublish={() => handleTogglePublish(assignment)}
                    onDelete={() => handleDelete(assignment.id)}
                    togglePending={publishMutation.isPending || unpublishMutation.isPending}
                    deletePending={deleteMutation.isPending}
                  />
                ))}

              {selectedSessionId && !assignmentsLoading && !assignmentsError && assignments.length === 0 && (
                <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  Buổi học này chưa có bài tập. Hãy tạo bài tập đầu tiên ở form phía trên.
                </p>
              )}

              {selectedAssignment && (
                <div className="rounded-lg border bg-muted/50 p-4">
                  <p className="text-sm font-medium">Chi tiết nhanh: {selectedAssignment.title}</p>
                  <div
                    className="prose prose-sm mt-2 max-w-none text-sm text-muted-foreground"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(selectedAssignment.description) }}
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
