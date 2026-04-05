"use client";

import DOMPurify from "isomorphic-dompurify";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Calendar, CheckCircle2, ClipboardList, Code2, FileText, HelpCircle, Layers3, Loader2, Plus, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TiptapEditor } from "@/components/editor";
import { useMyCourses } from "@/hooks/queries/use-courses";
import { useSections } from "@/hooks/queries/use-sections";
import { useLessons } from "@/hooks/queries/use-lessons";
import type { ApiCourse } from "@/services/course.service";
import type { Section } from "@/types/section";
import type { Lesson } from "@/types/lesson";
import {
  TeacherAssignmentStatus,
  TeacherAssignmentType,
  TeacherLessonAssignment,
} from "../courses/course-detail-data";

// ─── Types ────────────────────────────────────────────────────────────────────

type LessonItem = {
  id: string;
  title: string;
  sectionId: string;
  sectionTitle: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const ASSIGNMENT_TYPE_OPTIONS: { value: TeacherAssignmentType; label: string; icon: React.ReactNode }[] = [
  { value: "quiz", label: "Quiz", icon: <HelpCircle className="h-4 w-4" /> },
  { value: "code", label: "Code", icon: <Code2 className="h-4 w-4" /> },
  { value: "document", label: "Document", icon: <FileText className="h-4 w-4" /> },
  { value: "project", label: "Project", icon: <Layers3 className="h-4 w-4" /> },
];

const STATUS_OPTIONS: { value: TeacherAssignmentStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "closed", label: "Closed" },
];

const STATUS_BADGE_CLASS: Record<TeacherAssignmentStatus, string> = {
  draft: "bg-gray-100 text-gray-700 border-gray-200",
  published: "bg-green-100 text-green-700 border-green-200",
  closed: "bg-orange-100 text-orange-700 border-orange-200",
};

const TYPE_BADGE_CLASS: Record<TeacherAssignmentType, string> = {
  quiz: "bg-blue-100 text-blue-700 border-blue-200",
  code: "bg-purple-100 text-purple-700 border-purple-200",
  document: "bg-amber-100 text-amber-700 border-amber-200",
  project: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

// ─── Sub-component: lesson list for a selected course ─────────────────────────

/**
 * Loads sections + lessons for the selected course and exposes a flat lesson list.
 * Uses a render-prop pattern to avoid conditional hooks at the page level.
 */
function CourseLessonLoader({
  courseId,
  children,
}: {
  courseId: string;
  children: (lessons: LessonItem[], isLoading: boolean) => React.ReactNode;
}) {
  const { data: sections = [], isLoading: sectionsLoading } = useSections(courseId);

  // Load lessons for up to 10 sections in parallel (stable hook call count)
  const l0 = useLessons(courseId, sections[0]?.id ?? "");
  const l1 = useLessons(courseId, sections[1]?.id ?? "");
  const l2 = useLessons(courseId, sections[2]?.id ?? "");
  const l3 = useLessons(courseId, sections[3]?.id ?? "");
  const l4 = useLessons(courseId, sections[4]?.id ?? "");
  const l5 = useLessons(courseId, sections[5]?.id ?? "");
  const l6 = useLessons(courseId, sections[6]?.id ?? "");
  const l7 = useLessons(courseId, sections[7]?.id ?? "");
  const l8 = useLessons(courseId, sections[8]?.id ?? "");
  const l9 = useLessons(courseId, sections[9]?.id ?? "");

  const allResults = [l0, l1, l2, l3, l4, l5, l6, l7, l8, l9];
  const lessonsLoading = allResults.slice(0, sections.length).some((r) => r.isLoading);

  const lessonItems = useMemo<LessonItem[]>(() => {
    return sections.flatMap((section: Section, idx: number) => {
      const data: Lesson[] = allResults[idx]?.data ?? [];
      return data.map((lesson) => ({
        id: lesson.id,
        title: lesson.title,
        sectionId: section.id,
        sectionTitle: section.title,
      }));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections, l0.data, l1.data, l2.data, l3.data, l4.data, l5.data, l6.data, l7.data, l8.data, l9.data]);

  return <>{children(lessonItems, sectionsLoading || lessonsLoading)}</>;
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function TeacherAssignmentsPage() {
  const searchParams = useSearchParams();

  const { data: apiCourses = [], isLoading: coursesLoading } = useMyCourses();

  // Map API courses to the summary shape used in UI
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
  const [lessonSearch, setLessonSearch] = useState("");

  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [selectedLessonId, setSelectedLessonId] = useState<string>("");

  // In-memory assignments (no backend endpoint for teacher-lesson assignments yet)
  const [assignments, setAssignments] = useState<TeacherLessonAssignment[]>([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>("");

  const [title, setTitle] = useState("");
  const [type, setType] = useState<TeacherAssignmentType>("quiz");
  const [status, setStatus] = useState<TeacherAssignmentStatus>("draft");
  const [dueAt, setDueAt] = useState("");
  const [maxScore, setMaxScore] = useState("");
  const [instructions, setInstructions] = useState("");

  // Set initial course from URL params once courses load
  useEffect(() => {
    if (courses.length === 0) return;
    const requestedCourseId = searchParams.get("courseId");
    const validCourse = requestedCourseId && courses.some((c) => c.id === requestedCourseId);
    setSelectedCourseId(validCourse ? requestedCourseId! : courses[0]?.id ?? "");
    const requestedLessonId = searchParams.get("lessonId") ?? "";
    setSelectedLessonId(requestedLessonId);
  }, [courses, searchParams]);

  const filteredCourses = useMemo(() => {
    const query = courseSearch.trim().toLowerCase();
    if (!query) return courses;
    return courses.filter((c) => c.title.toLowerCase().includes(query));
  }, [courseSearch, courses]);

  const selectedCourse = useMemo(() => courses.find((c) => c.id === selectedCourseId), [courses, selectedCourseId]);

  const stats = useMemo(() => {
    const total = assignments.length;
    const published = assignments.filter((a) => a.status === "published").length;
    const draft = assignments.filter((a) => a.status === "draft").length;
    const closed = assignments.filter((a) => a.status === "closed").length;
    return { total, published, draft, closed };
  }, [assignments]);

  const selectedAssignment = useMemo(
    () => assignments.find((a) => a.id === selectedAssignmentId),
    [assignments, selectedAssignmentId]
  );

  const resetForm = () => {
    setTitle("");
    setType("quiz");
    setStatus("draft");
    setDueAt("");
    setMaxScore("");
    setInstructions("");
  };

  const handleCreateAssignment = () => {
    if (!selectedCourseId || !selectedLessonId || !title.trim() || !instructions.trim() || !dueAt.trim()) return;
    const now = new Date().toISOString();
    const newAssignment: TeacherLessonAssignment = {
      id: `asg-${Date.now()}`,
      courseId: selectedCourseId,
      lessonId: selectedLessonId,
      title: title.trim(),
      type,
      status,
      dueAt,
      instructions: instructions.trim(),
      maxScore: maxScore.trim() ? Number(maxScore) || undefined : undefined,
      createdAt: now,
      updatedAt: now,
    };
    setAssignments((prev) => [newAssignment, ...prev]);
    setSelectedAssignmentId(newAssignment.id);
    resetForm();
  };

  const handleChangeAssignmentStatus = (assignmentId: string, nextStatus: TeacherAssignmentStatus) => {
    setAssignments((prev) =>
      prev.map((a) =>
        a.id === assignmentId ? { ...a, status: nextStatus, updatedAt: new Date().toISOString() } : a
      )
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Quản lí bài tập giáo viên</h1>
        <p className="text-sm text-muted-foreground">
          Chọn khóa học → chọn lesson → giao bài tập chi tiết theo loại quiz, code, document, project.
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
                    setSelectedLessonId("");
                    setAssignments([]);
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

        {/* Column 2: Lesson list (loads real data) */}
        <Card className="h-[calc(100vh-15rem)] overflow-hidden">
          <CardHeader className="border-b pb-3">
            <CardTitle className="text-base">2) Lesson của khóa</CardTitle>
            <Input
              placeholder="Tìm lesson hoặc chương..."
              value={lessonSearch}
              onChange={(e) => setLessonSearch(e.target.value)}
              disabled={!selectedCourseId}
            />
          </CardHeader>
          <CardContent className="space-y-2 overflow-auto p-3">
            {selectedCourseId ? (
              <CourseLessonLoader courseId={selectedCourseId}>
                {(lessons, isLoading) => {
                  if (isLoading) {
                    return (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      </div>
                    );
                  }

                  const filtered = lessons.filter((l) => {
                    const q = lessonSearch.trim().toLowerCase();
                    if (!q) return true;
                    return l.title.toLowerCase().includes(q) || l.sectionTitle.toLowerCase().includes(q);
                  });

                  // Sync selectedLesson when lessons load
                  const selectedLesson = lessons.find((l) => l.id === selectedLessonId);

                  if (filtered.length === 0) {
                    return <p className="text-sm text-muted-foreground">Khóa học này chưa có lesson.</p>;
                  }

                  return (
                    <>
                      {filtered.map((lesson) => (
                        <button
                          key={lesson.id}
                          type="button"
                          onClick={() => {
                            setSelectedLessonId(lesson.id);
                            setAssignments([]);
                            setSelectedAssignmentId("");
                          }}
                          className={`w-full rounded-lg border p-3 text-left transition-colors ${
                            selectedLessonId === lesson.id ? "border-primary-500 bg-primary-50" : "hover:bg-gray-50"
                          }`}
                        >
                          <p className="text-sm font-medium">{lesson.title}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{lesson.sectionTitle}</p>
                        </button>
                      ))}
                      {/* hidden — keeps selectedLesson reference stable */}
                      <span className="hidden">{selectedLesson?.id}</span>
                    </>
                  );
                }}
              </CourseLessonLoader>
            ) : (
              <p className="text-sm text-muted-foreground">Chọn khóa học để xem lesson.</p>
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
                  <p className="text-xs text-muted-foreground">Lesson đang chọn</p>
                  <p className="mt-1 font-medium">{selectedLessonId ? `ID: ${selectedLessonId}` : "Chưa chọn"}</p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-4">
                <SummaryBox icon={<ClipboardList className="h-4 w-4" />} label="Tổng bài" value={stats.total} />
                <SummaryBox icon={<CheckCircle2 className="h-4 w-4" />} label="Published" value={stats.published} />
                <SummaryBox icon={<Target className="h-4 w-4" />} label="Draft" value={stats.draft} />
                <SummaryBox icon={<Calendar className="h-4 w-4" />} label="Closed" value={stats.closed} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">3) Giao bài tập cho lesson</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="assignment-title">Tên bài tập *</Label>
                <Input
                  id="assignment-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="VD: Quiz JSX nâng cao"
                  disabled={!selectedLessonId}
                />
              </div>

              <div className="space-y-2">
                <Label>Loại bài tập</Label>
                <Select value={type} onValueChange={(v) => setType(v as TeacherAssignmentType)}>
                  <SelectTrigger disabled={!selectedLessonId}>
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
                <Label>Trạng thái</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as TeacherAssignmentStatus)}>
                  <SelectTrigger disabled={!selectedLessonId}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="assignment-due">Hạn nộp *</Label>
                <Input
                  id="assignment-due"
                  type="datetime-local"
                  value={dueAt}
                  onChange={(e) => setDueAt(e.target.value)}
                  disabled={!selectedLessonId}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="assignment-max-score">Thang điểm</Label>
                <Input
                  id="assignment-max-score"
                  type="number"
                  min={1}
                  value={maxScore}
                  onChange={(e) => setMaxScore(e.target.value)}
                  placeholder="VD: 10 hoặc 100"
                  disabled={!selectedLessonId}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="assignment-instructions">Yêu cầu chi tiết *</Label>
                {selectedLessonId ? (
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
                  disabled={!selectedLessonId || !title.trim() || !instructions.trim() || !dueAt.trim()}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Tạo bài tập cho lesson này
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Danh sách bài tập theo lesson ({assignments.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {assignments.map((assignment) => (
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
                      <Badge variant="outline" className={STATUS_BADGE_CLASS[assignment.status]}>
                        {assignment.status.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">Hạn nộp: {assignment.dueAt.replace("T", " ")}</p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {STATUS_OPTIONS.map((opt) => (
                      <Button
                        key={opt.value}
                        size="sm"
                        variant={assignment.status === opt.value ? "default" : "outline"}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleChangeAssignmentStatus(assignment.id, opt.value);
                        }}
                      >
                        {opt.label}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}

              {assignments.length === 0 && (
                <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  Lesson này chưa có bài tập. Hãy tạo bài tập đầu tiên ở form phía trên.
                </p>
              )}

              {selectedAssignment && (
                <div className="rounded-lg border bg-gray-50 p-4">
                  <p className="text-sm font-medium">Chi tiết nhanh: {selectedAssignment.title}</p>
                  <div
                    className="prose prose-sm mt-2 max-w-none text-sm text-muted-foreground"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedAssignment.instructions) }}
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
