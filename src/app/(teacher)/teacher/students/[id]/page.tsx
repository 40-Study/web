"use client";

import Link from "next/link";
import { useState } from "react";
import { notFound, useParams } from "next/navigation";
import { ArrowLeft, Bell, BookOpen, Phone, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import TeacherNotificationDialog from "@/components/teacher/teacher-notification-dialog";
import { getTeacherStudentById, getStudentsByCourseId } from "../student-mock-data";

export default function TeacherStudentProfilePage() {
  const params = useParams<{ id: string }>();
  const [isNotifyDialogOpen, setIsNotifyDialogOpen] = useState(false);
  const student = getTeacherStudentById(params.id);

  if (!student) {
    notFound();
  }

  const classmates = getStudentsByCourseId(student.courseId).filter((item) => item.id !== student.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/teacher/students">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Hồ sơ học viên</h1>
        </div>
        <Button onClick={() => setIsNotifyDialogOpen(true)}>
          <Bell className="mr-2 h-4 w-4" />
          Gửi thông báo
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <Avatar fallback={student.name.charAt(0)} size="lg" className="bg-primary-100 text-primary-700" />
              <div>
                <p className="text-xl font-semibold">{student.name}</p>
                <p className="text-sm text-muted-foreground">Mã học viên: {student.studentId}</p>
              </div>
            </div>
            <Badge variant={student.status === "active" ? "success" : "secondary"}>
              {student.status === "active" ? "Đang học" : student.status === "completed" ? "Hoàn thành" : "Tạm dừng"}
            </Badge>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <UserRound className="h-4 w-4" />
                Phụ huynh liên hệ
              </div>
              <p className="font-medium">{student.parentName}</p>
              <a href={student.parentPhone ? `tel:${student.parentPhone}` : undefined} className="inline-flex items-center gap-2 text-sm text-primary-600 hover:underline">
                <Phone className="h-4 w-4" />
                {student.parentPhone || "Chưa cập nhật"}
              </a>
            </div>

            <div className="rounded-lg border p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <BookOpen className="h-4 w-4" />
                Khóa học hiện tại
              </div>
              <p className="font-medium">{student.courseName}</p>
              <p className="text-sm text-muted-foreground">Năm sinh: {student.birthYear}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h2 className="mb-4 text-lg font-semibold">Bạn cùng khóa ({classmates.length})</h2>
          {classmates.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa có học viên khác trong khóa này.</p>
          ) : (
            <div className="space-y-3">
              {classmates.map((mate) => (
                <div key={mate.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium">{mate.name}</p>
                    <p className="text-sm text-muted-foreground">{mate.studentId}</p>
                  </div>
                  <Link href={`/teacher/students/${mate.id}`} className="text-sm text-primary-600 hover:underline">
                    Xem hồ sơ
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <TeacherNotificationDialog
        open={isNotifyDialogOpen}
        onOpenChange={setIsNotifyDialogOpen}
        recipients={[
          { id: student.id, name: student.name, phone: student.parentPhone },
          ...classmates.map((mate) => ({ id: mate.id, name: mate.name, phone: mate.parentPhone })),
        ]}
        contextLabel={`Hồ sơ học viên: ${student.name}`}
      />
    </div>
  );
}
