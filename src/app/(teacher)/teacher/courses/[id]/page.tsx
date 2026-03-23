"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ChevronLeft,
  Play,
  FileText,
  Code,
  HelpCircle,
  Plus,
  GripVertical,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Lesson {
  id: string;
  title: string;
  type: "video" | "quiz" | "sandbox" | "document";
  duration?: string;
  questionCount?: number;
  fileSize?: string;
}

interface Chapter {
  id: string;
  title: string;
  lessons: Lesson[];
}

const MOCK_CURRICULUM: Chapter[] = [
  {
    id: "c1",
    title: "Chương 1: Nhập môn React & Component",
    lessons: [
      { id: "l1", title: "Giới thiệu về React Component", type: "video", duration: "12:45" },
      { id: "l2", title: "Thực hành: Tạo Component đầu tiên", type: "sandbox" },
    ],
  },
  {
    id: "c2",
    title: "Chương 2: JSX và Props",
    lessons: [
      { id: "l3", title: "Cú pháp JSX và Rendering", type: "video", duration: "18:20" },
      { id: "l4", title: "Trắc nghiệm kiến thức JSX", type: "quiz", questionCount: 10 },
      { id: "l5", title: "Tài liệu: Cheat sheet Props & State", type: "document", fileSize: "1.2 MB" },
    ],
  },
];

const LESSON_ICONS: Record<string, { icon: React.ReactNode; bg: string; color: string }> = {
  video: { icon: <Play className="w-4 h-4" />, bg: "bg-blue-100", color: "text-blue-600" },
  quiz: { icon: <HelpCircle className="w-4 h-4" />, bg: "bg-green-100", color: "text-green-600" },
  sandbox: { icon: <Code className="w-4 h-4" />, bg: "bg-orange-100", color: "text-orange-600" },
  document: { icon: <FileText className="w-4 h-4" />, bg: "bg-red-100", color: "text-red-600" },
};

const LESSON_LABELS: Record<string, string> = {
  video: "Video bài giảng",
  quiz: "Quiz",
  sandbox: "Sandbox IDE Practice",
  document: "PDF Document",
};

export default function CourseDetailPage() {
  const params = useParams();
  const courseId = params.id as string;
  const [curriculum, setCurriculum] = useState(MOCK_CURRICULUM);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/teacher/courses">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold">Lập trình ReactJS cho người mới bắt đầu</h1>
              <Badge className="bg-green-100 text-green-700 border-green-200">
                Đang xuất bản
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Eye className="w-4 h-4 mr-2" />
            Xem trước
          </Button>
          <Button>Cập nhật</Button>
        </div>
      </div>

      {/* Curriculum */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Chương trình học</h2>
          <p className="text-sm text-muted-foreground">
            Sắp xếp cấu trúc khóa học và các học liệu đi kèm.
          </p>
        </div>

        {curriculum.map((chapter, chapterIndex) => (
          <Card key={chapter.id}>
            <CardContent className="p-4">
              {/* Chapter Header */}
              <div className="flex items-center gap-3 mb-4">
                <GripVertical className="w-5 h-5 text-muted-foreground cursor-move" />
                <h3 className="font-medium flex-1">{chapter.title}</h3>
              </div>

              {/* Lessons */}
              <div className="space-y-2 ml-8">
                {chapter.lessons.map((lesson) => {
                  const icon = LESSON_ICONS[lesson.type];
                  return (
                    <div
                      key={lesson.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      <GripVertical className="w-4 h-4 text-muted-foreground cursor-move" />
                      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", icon.bg, icon.color)}>
                        {icon.icon}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{lesson.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {LESSON_LABELS[lesson.type]}
                          {lesson.duration && ` • ${lesson.duration}`}
                          {lesson.questionCount && ` • ${lesson.questionCount} câu hỏi`}
                          {lesson.fileSize && ` • ${lesson.fileSize}`}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add Lesson Button */}
              <Button
                variant="ghost"
                className="w-full mt-4 text-muted-foreground border border-dashed"
              >
                <Plus className="w-4 h-4 mr-2" />
                Thêm bài học mới
              </Button>
            </CardContent>
          </Card>
        ))}

        {/* Add Chapter Button */}
        <Card className="border-dashed">
          <CardContent className="p-6 text-center">
            <Button variant="ghost" className="text-muted-foreground">
              <Plus className="w-4 h-4 mr-2" />
              Thêm chương nội dung mới
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
