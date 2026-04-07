"use client";

import { useMemo } from "react";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { ArrowLeft, Loader2, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSections } from "@/hooks/queries/use-sections";
import { useLessons } from "@/hooks/queries/use-lessons";
import type { Section } from "@/types/section";
import type { Lesson } from "@/types/lesson";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Find lesson across all sections, returns { section, lesson } or null */
function findLessonInSections(
  sections: Section[],
  lessons: Map<string, Lesson[]>,
  lessonId: string
): { section: Section; lesson: Lesson } | null {
  for (const section of sections) {
    const sectionLessons = lessons.get(section.id) ?? [];
    const lesson = sectionLessons.find((l) => l.id === lessonId);
    if (lesson) return { section, lesson };
  }
  return null;
}

const LESSON_TYPE_LABEL: Record<string, string> = {
  video: "VIDEO",
  quiz: "QUIZ",
  article: "ARTICLE",
  sandbox: "SANDBOX",
  document: "DOCUMENT",
};

// ─── Inner component — rendered after sections load ───────────────────────────

function LessonDetailContent({
  courseId,
  lessonId,
  sections,
}: {
  courseId: string;
  lessonId: string;
  sections: Section[];
}) {
  // Load lessons for each section in parallel via individual hooks.
  // This is safe because hooks run in a stable order (sections order is stable).
  const s0 = useLessons(courseId, sections[0]?.id ?? "");
  const s1 = useLessons(courseId, sections[1]?.id ?? "");
  const s2 = useLessons(courseId, sections[2]?.id ?? "");
  const s3 = useLessons(courseId, sections[3]?.id ?? "");
  const s4 = useLessons(courseId, sections[4]?.id ?? "");
  const s5 = useLessons(courseId, sections[5]?.id ?? "");
  const s6 = useLessons(courseId, sections[6]?.id ?? "");
  const s7 = useLessons(courseId, sections[7]?.id ?? "");
  const s8 = useLessons(courseId, sections[8]?.id ?? "");
  const s9 = useLessons(courseId, sections[9]?.id ?? "");

  const allResults = [s0, s1, s2, s3, s4, s5, s6, s7, s8, s9];
  const isLoading = allResults.slice(0, sections.length).some((r) => r.isLoading);

  const lessonsMap = useMemo(() => {
    const map = new Map<string, Lesson[]>();
    sections.forEach((section, idx) => {
      const result = allResults[idx];
      if (result?.data) map.set(section.id, result.data);
    });
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections, s0.data, s1.data, s2.data, s3.data, s4.data, s5.data, s6.data, s7.data, s8.data, s9.data]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const found = findLessonInSections(sections, lessonsMap, lessonId);

  if (!found) {
    notFound();
    return null;
  }

  const { section, lesson } = found;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href={`/teacher/courses/${courseId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-semibold">{lesson.title}</h1>
            <p className="text-sm text-muted-foreground">{section.title}</p>
          </div>
        </div>
        <Button asChild>
          <Link href={`/teacher/assignments?courseId=${courseId}&lessonId=${lesson.id}`}>
            Giao bài tập
          </Link>
        </Button>
      </div>

      {/* Lesson info card */}
      <Card>
        <CardContent className="space-y-3 p-6">
          <div className="flex items-center gap-2">
            <Badge>{LESSON_TYPE_LABEL[lesson.type ?? "article"] ?? (lesson.type ?? "article").toUpperCase()}</Badge>
            <Badge variant={lesson.is_preview ? "success" : "secondary"}>
              {lesson.is_preview ? "Preview" : "Draft"}
            </Badge>
            {lesson.duration && (
              <Badge variant="outline">{Math.floor(lesson.duration / 60)}:{String(lesson.duration % 60).padStart(2, "0")}</Badge>
            )}
          </div>
          {lesson.description && (
            <div>
              <p className="text-sm font-medium">Mô tả</p>
              <p className="whitespace-pre-line text-sm text-muted-foreground">{lesson.description}</p>
            </div>
          )}
          <div className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Vị trí:</span> {lesson.position}
          </div>
        </CardContent>
      </Card>

      {/* Comments — no backend endpoint yet, show empty state */}
      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <h2 className="text-lg font-semibold">Bình luận học viên</h2>
          </div>
          <p className="text-sm text-muted-foreground">Chưa có bình luận nào cho bài học này.</p>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Page entry point ─────────────────────────────────────────────────────────

export default function TeacherLessonDetailPage() {
  const params = useParams<{ id: string; lessonId: string }>();
  const courseId = params.id;
  const lessonId = params.lessonId;

  const { data: sections, isLoading: sectionsLoading } = useSections(courseId);

  if (sectionsLoading || !sections) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <LessonDetailContent courseId={courseId} lessonId={lessonId} sections={sections} />
  );
}
