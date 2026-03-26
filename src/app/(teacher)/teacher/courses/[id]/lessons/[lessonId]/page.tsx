"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { ArrowLeft, Heart, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar } from "@/components/ui/avatar";
import {
  findLessonInChapters,
  getTeacherCourseDetail,
  loadTeacherCourseChapters,
  loadTeacherLessonComments,
  saveTeacherLessonComments,
  TeacherLessonComment,
} from "../../../course-detail-data";

export default function TeacherLessonDetailPage() {
  const params = useParams<{ id: string; lessonId: string }>();
  const courseId = params.id;
  const lessonId = params.lessonId;

  const [isHydrated, setIsHydrated] = useState(false);
  const [comments, setComments] = useState<TeacherLessonComment[]>([]);
  const [studentName, setStudentName] = useState("");
  const [commentContent, setCommentContent] = useState("");

  const chapters = useMemo(() => {
    if (!isHydrated) return getTeacherCourseDetail(courseId).chapters;
    return loadTeacherCourseChapters(courseId);
  }, [courseId, isHydrated]);

  const lessonData = useMemo(() => findLessonInChapters(chapters, lessonId), [chapters, lessonId]);

  useEffect(() => {
    setComments(loadTeacherLessonComments(courseId, lessonId));
    setIsHydrated(true);
  }, [courseId, lessonId]);

  useEffect(() => {
    if (!isHydrated) return;
    saveTeacherLessonComments(courseId, lessonId, comments);
  }, [comments, courseId, lessonId, isHydrated]);

  if (isHydrated && !lessonData) {
    notFound();
  }

  if (!lessonData) return null;

  const { chapter, lesson } = lessonData;

  const handleAddComment = () => {
    if (!studentName.trim() || !commentContent.trim()) return;
    setComments((prev) => [
      {
        id: `cmt-${Date.now()}`,
        studentName: studentName.trim(),
        content: commentContent.trim(),
        createdAt: new Date().toLocaleString("vi-VN"),
        likes: 0,
      },
      ...prev,
    ]);
    setStudentName("");
    setCommentContent("");
  };

  const handleLikeComment = (commentId: string) => {
    setComments((prev) => prev.map((comment) => (comment.id === commentId ? { ...comment, likes: comment.likes + 1 } : comment)));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/teacher/courses/${courseId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-semibold">{lesson.title}</h1>
          <p className="text-sm text-muted-foreground">{chapter.title}</p>
        </div>
      </div>

      <Card>
        <CardContent className="space-y-3 p-6">
          <div className="flex items-center gap-2">
            <Badge>{lesson.type.toUpperCase()}</Badge>
            <Badge variant={lesson.status === "published" ? "success" : "secondary"}>
              {lesson.status === "published" ? "Published" : "Draft"}
            </Badge>
            {lesson.duration && <Badge variant="outline">{lesson.duration}</Badge>}
            {lesson.questionCount && <Badge variant="outline">{lesson.questionCount} câu hỏi</Badge>}
            {lesson.fileSize && <Badge variant="outline">{lesson.fileSize}</Badge>}
          </div>
          <div>
            <p className="text-sm font-medium">Tóm tắt</p>
            <p className="text-sm text-muted-foreground">{lesson.summary}</p>
          </div>
          <div>
            <p className="text-sm font-medium">Nội dung bài học</p>
            <p className="whitespace-pre-line text-sm text-muted-foreground">{lesson.content}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <h2 className="text-lg font-semibold">Bình luận học viên ({comments.length})</h2>
          </div>

          <div className="space-y-3 rounded-lg border p-4">
            <div className="space-y-2">
              <Label htmlFor="student-name">Tên học viên *</Label>
              <Input id="student-name" placeholder="VD: Nguyễn Văn A" value={studentName} onChange={(e) => setStudentName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="student-comment">Nội dung bình luận *</Label>
              <Textarea
                id="student-comment"
                rows={3}
                placeholder="Đặt câu hỏi hoặc phản hồi về bài học..."
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
              />
            </div>
            <Button onClick={handleAddComment} disabled={!studentName.trim() || !commentContent.trim()}>
              Thêm bình luận
            </Button>
          </div>

          {comments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa có bình luận nào cho bài học này.</p>
          ) : (
            <div className="space-y-3">
              {comments.map((comment) => (
                <div key={comment.id} className="rounded-lg border p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar fallback={comment.studentName.charAt(0)} size="sm" className="bg-primary-100 text-primary-700" />
                      <div>
                        <p className="text-sm font-medium">{comment.studentName}</p>
                        <p className="text-xs text-muted-foreground">{comment.createdAt}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleLikeComment(comment.id)}>
                      <Heart className="mr-1 h-4 w-4" />
                      {comment.likes}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">{comment.content}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
