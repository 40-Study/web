"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Calendar, CheckCircle2, ClipboardList, Code2, FileText, HelpCircle, Layers3, Plus, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  getTeacherAssignmentCourseSummaries,
  loadTeacherCourseChapters,
  loadTeacherLessonAssignments,
  saveTeacherLessonAssignments,
  TeacherAssignmentStatus,
  TeacherAssignmentType,
  TeacherLessonAssignment,
} from "../courses/course-detail-data";

type LessonItem = {
  id: string;
  title: string;
  chapterId: string;
  chapterTitle: string;
};

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

export default function TeacherAssignmentsPage() {
  const searchParams = useSearchParams();
  const [isHydrated, setIsHydrated] = useState(false);

  const [courseSearch, setCourseSearch] = useState("");
  const [lessonSearch, setLessonSearch] = useState("");

  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [selectedLessonId, setSelectedLessonId] = useState<string>("");

  const [assignments, setAssignments] = useState<TeacherLessonAssignment[]>([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>("");

  const [title, setTitle] = useState("");
  const [type, setType] = useState<TeacherAssignmentType>("quiz");
  const [status, setStatus] = useState<TeacherAssignmentStatus>("draft");
  const [dueAt, setDueAt] = useState("");
  const [maxScore, setMaxScore] = useState("");
  const [instructions, setInstructions] = useState("");

  const courses = useMemo(() => getTeacherAssignmentCourseSummaries(), []);

  const filteredCourses = useMemo(() => {
    const query = courseSearch.trim().toLowerCase();
    if (!query) return courses;
    return courses.filter((course) => course.title.toLowerCase().includes(query));
  }, [courseSearch, courses]);

  const lessons = useMemo<LessonItem[]>(() => {
    if (!selectedCourseId) return [];
    const chapters = loadTeacherCourseChapters(selectedCourseId);
    return chapters.flatMap((chapter) =>
      chapter.lessons.map((lesson) => ({
        id: lesson.id,
        title: lesson.title,
        chapterId: chapter.id,
        chapterTitle: chapter.title,
      }))
    );
  }, [selectedCourseId]);

  const filteredLessons = useMemo(() => {
    const query = lessonSearch.trim().toLowerCase();
    if (!query) return lessons;
    return lessons.filter(
      (lesson) => lesson.title.toLowerCase().includes(query) || lesson.chapterTitle.toLowerCase().includes(query)
    );
  }, [lessonSearch, lessons]);

  const selectedCourse = useMemo(
    () => courses.find((course) => course.id === selectedCourseId),
    [courses, selectedCourseId]
  );

  const selectedLesson = useMemo(
    () => lessons.find((lesson) => lesson.id === selectedLessonId),
    [lessons, selectedLessonId]
  );

  const selectedAssignment = useMemo(
    () => assignments.find((assignment) => assignment.id === selectedAssignmentId),
    [assignments, selectedAssignmentId]
  );

  const stats = useMemo(() => {
    const total = assignments.length;
    const published = assignments.filter((item) => item.status === "published").length;
    const draft = assignments.filter((item) => item.status === "draft").length;
    const closed = assignments.filter((item) => item.status === "closed").length;
    return { total, published, draft, closed };
  }, [assignments]);

  useEffect(() => {
    setIsHydrated(true);

    const requestedCourseId = searchParams.get("courseId");
    const hasRequestedCourse = requestedCourseId
      ? courses.some((course) => course.id === requestedCourseId)
      : false;
    const initialCourseId = hasRequestedCourse ? requestedCourseId! : courses[0]?.id ?? "";
    setSelectedCourseId(initialCourseId);

    const initialLessonId = searchParams.get("lessonId") ?? "";
    setSelectedLessonId(initialLessonId);
  }, [courses, searchParams]);

  useEffect(() => {
    if (!selectedCourseId) return;
    if (selectedLessonId && lessons.some((lesson) => lesson.id === selectedLessonId)) return;

    const firstLessonId = lessons[0]?.id ?? "";
    setSelectedLessonId(firstLessonId);
  }, [lessons, selectedCourseId, selectedLessonId]);

  useEffect(() => {
    if (!selectedCourseId || !selectedLessonId) {
      setAssignments([]);
      setSelectedAssignmentId("");
      return;
    }

    const data = loadTeacherLessonAssignments(selectedCourseId, selectedLessonId).filter(
      (assignment) => assignment.courseId === selectedCourseId && assignment.lessonId === selectedLessonId
    );
    setAssignments(data);
    setSelectedAssignmentId(data[0]?.id ?? "");
  }, [selectedCourseId, selectedLessonId]);

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

    const nextAssignments = [newAssignment, ...assignments];
    setAssignments(nextAssignments);
    setSelectedAssignmentId(newAssignment.id);
    saveTeacherLessonAssignments(selectedCourseId, selectedLessonId, nextAssignments);
    resetForm();
  };

  const handleChangeAssignmentStatus = (assignmentId: string, nextStatus: TeacherAssignmentStatus) => {
    if (!selectedCourseId || !selectedLessonId) return;

    const nextAssignments = assignments.map((assignment) =>
      assignment.id === assignmentId
        ? {
            ...assignment,
            status: nextStatus,
            updatedAt: new Date().toISOString(),
          }
        : assignment
    );

    setAssignments(nextAssignments);
    saveTeacherLessonAssignments(selectedCourseId, selectedLessonId, nextAssignments);
  };

  if (!isHydrated) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Quản lí bài tập giáo viên</h1>
        <p className="text-sm text-muted-foreground">
          Chọn khóa học → chọn lesson → giao bài tập chi tiết theo loại quiz, code, document, project.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[320px_360px_1fr]">
        <Card className="h-[calc(100vh-15rem)] overflow-hidden">
          <CardHeader className="border-b pb-3">
            <CardTitle className="text-base">1) Tất cả khóa học ({courses.length})</CardTitle>
            <Input
              placeholder="Tìm khóa học..."
              value={courseSearch}
              onChange={(event) => setCourseSearch(event.target.value)}
            />
          </CardHeader>
          <CardContent className="space-y-2 overflow-auto p-3">
            {filteredCourses.map((course) => (
              <button
                key={course.id}
                type="button"
                onClick={() => setSelectedCourseId(course.id)}
                className={`w-full rounded-lg border p-3 text-left transition-colors ${
                  selectedCourseId === course.id ? "border-primary-500 bg-primary-50" : "hover:bg-gray-50"
                }`}
              >
                <p className="font-medium text-sm">{course.title}</p>
                <Badge
                  variant="outline"
                  className={course.status === "published" ? "mt-2 border-green-200 text-green-700" : "mt-2"}
                >
                  {course.status === "published" ? "Published" : "Draft"}
                </Badge>
              </button>
            ))}
            {filteredCourses.length === 0 && <p className="text-sm text-muted-foreground">Không có khóa học phù hợp.</p>}
          </CardContent>
        </Card>

        <Card className="h-[calc(100vh-15rem)] overflow-hidden">
          <CardHeader className="border-b pb-3">
            <CardTitle className="text-base">2) Lesson của khóa</CardTitle>
            <Input
              placeholder="Tìm lesson hoặc chương..."
              value={lessonSearch}
              onChange={(event) => setLessonSearch(event.target.value)}
              disabled={!selectedCourseId}
            />
          </CardHeader>
          <CardContent className="space-y-2 overflow-auto p-3">
            {filteredLessons.map((lesson) => (
              <button
                key={lesson.id}
                type="button"
                onClick={() => setSelectedLessonId(lesson.id)}
                className={`w-full rounded-lg border p-3 text-left transition-colors ${
                  selectedLessonId === lesson.id ? "border-primary-500 bg-primary-50" : "hover:bg-gray-50"
                }`}
              >
                <p className="font-medium text-sm">{lesson.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{lesson.chapterTitle}</p>
              </button>
            ))}
            {selectedCourseId && filteredLessons.length === 0 && (
              <p className="text-sm text-muted-foreground">Khóa học này chưa có lesson.</p>
            )}
          </CardContent>
        </Card>

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
                  <p className="mt-1 font-medium">{selectedLesson?.title ?? "Chưa chọn"}</p>
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
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="VD: Quiz JSX nâng cao"
                  disabled={!selectedLessonId}
                />
              </div>

              <div className="space-y-2">
                <Label>Loại bài tập</Label>
                <Select value={type} onValueChange={(value) => setType(value as TeacherAssignmentType)}>
                  <SelectTrigger disabled={!selectedLessonId}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSIGNMENT_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <span className="inline-flex items-center gap-2">
                          {option.icon}
                          {option.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Trạng thái</Label>
                <Select value={status} onValueChange={(value) => setStatus(value as TeacherAssignmentStatus)}>
                  <SelectTrigger disabled={!selectedLessonId}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
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
                  onChange={(event) => setDueAt(event.target.value)}
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
                  onChange={(event) => setMaxScore(event.target.value)}
                  placeholder="VD: 10 hoặc 100"
                  disabled={!selectedLessonId}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="assignment-instructions">Yêu cầu chi tiết *</Label>
                <Textarea
                  id="assignment-instructions"
                  rows={4}
                  value={instructions}
                  onChange={(event) => setInstructions(event.target.value)}
                  placeholder="Mô tả tiêu chí chấm, yêu cầu đầu ra, deadline..."
                  disabled={!selectedLessonId}
                />
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
                    <p className="font-medium text-sm">{assignment.title}</p>
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
                    {STATUS_OPTIONS.map((option) => (
                      <Button
                        key={option.value}
                        size="sm"
                        variant={assignment.status === option.value ? "default" : "outline"}
                        onClick={(event) => {
                          event.stopPropagation();
                          handleChangeAssignmentStatus(assignment.id, option.value);
                        }}
                      >
                        {option.label}
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
                  <p className="mt-2 text-sm text-muted-foreground whitespace-pre-line">{selectedAssignment.instructions}</p>
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
