"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { BookOpen, Loader2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCreateDirectConversation } from "@/hooks/queries/use-conversations";
import type { ChildCourse } from "@/services/parent-dashboard.service";

/**
 * Tab "Khóa học" của trang chi tiết con. E2 (QA vòng 2): mỗi khoá có nút "Nhắn giảng viên" —
 * tạo/mở hội thoại trực tiếp (`POST /conversations/direct`) rồi chuyển sang /messages với hội
 * thoại đó được chọn sẵn. Khoá chưa gắn giảng viên (không có instructor_id) thì không hiện nút. Từ QA hồi quy
 * 03/10 backend cho phép nhắn giảng viên đang dạy con (conversation_service.go, nhánh phụ huynh -> giảng viên).
 */
export function ChildCoursesTab({ courses, isLoading }: { courses?: ChildCourse[]; isLoading: boolean }) {
  const router = useRouter();
  // Backend cho phụ huynh nhắn giảng viên đang dạy lớp/khoá mà con (liên kết đã xác nhận) ghi danh. Khi vẫn bị
  // từ chối (vd. giảng viên đã thôi dạy con, hoặc quyền liên hệ giảng viên của liên kết bị tắt) nói đúng điều
  // kiện đó thay vì danh sách quan hệ chung của backend (QA hồi quy A-06).
  const createConv = useCreateDirectConversation({
    forbiddenMessage:
      "Chưa nhắn được giảng viên này. Bạn chỉ nhắn được giảng viên đang dạy lớp hoặc khoá mà con bạn đang học, khi liên kết với con đã được xác nhận và còn quyền liên hệ giảng viên.",
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }
  if (!courses || courses.length === 0) {
    return <p className="text-center text-gray-500 py-8">Chưa đăng ký khóa học nào</p>;
  }

  const messageTeacher = (teacherId: string) =>
    createConv.mutate(teacherId, {
      onSuccess: (conv) => router.push(`/messages?conversation=${conv.id}`),
    });

  return (
    <div className="space-y-3">
      {courses.map((course) => (
        <div key={course.id} className="flex flex-wrap sm:flex-nowrap items-center gap-3 sm:gap-4 p-3 rounded-lg border hover:bg-gray-50">
          {course.course_thumbnail ? (
            <Image src={course.course_thumbnail} alt={course.course_name} width={80} height={45} className="rounded object-cover" />
          ) : (
            <div className="w-20 h-11 rounded bg-gray-200 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5 text-gray-400" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 truncate">{course.course_name}</h3>
            <p className="text-sm text-gray-500 truncate">{course.instructor_name || "Chưa có giảng viên"}</p>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-primary-600">{Math.round(course.progress_percent)}%</div>
            <div className="w-20 h-2 bg-gray-200 rounded-full mt-1">
              <div className="h-full bg-primary-500 rounded-full" style={{ width: `${Math.min(100, course.progress_percent)}%` }} />
            </div>
          </div>
          {course.instructor_id && (
            <Button
              size="sm"
              variant="outline"
              className="w-full sm:w-auto"
              disabled={createConv.isPending}
              onClick={() => messageTeacher(course.instructor_id!)}
            >
              <MessageCircle className="w-4 h-4 mr-1.5" />
              Nhắn giảng viên
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}
