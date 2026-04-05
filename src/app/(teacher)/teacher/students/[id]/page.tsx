"use client";

import Link from "next/link";
import { useState } from "react";
import { notFound, useParams } from "next/navigation";
import { ArrowLeft, Bell, BookOpen, Loader2, Phone, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import TeacherNotificationDialog from "@/components/teacher/teacher-notification-dialog";
import { useMyStudents } from "@/hooks/queries/use-classes";

export default function TeacherStudentProfilePage() {
  const params = useParams<{ id: string }>();
  const [isNotifyDialogOpen, setIsNotifyDialogOpen] = useState(false);

  const { data: students = [], isLoading } = useMyStudents();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const student = students.find((s) => s.id === params.id);

  if (!student) {
    notFound();
  }

  // Classmates: same class, different id
  const classmates = students.filter(
    (s) => s.class_id === student.class_id && s.id !== student.id
  );

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
                <p className="text-sm text-muted-foreground">
                  Mã học viên: {student.student_id ?? "—"}
                </p>
              </div>
            </div>
            <Badge variant={student.status === "active" ? "success" : "secondary"}>
              {student.status === "active"
                ? "Đang học"
                : student.status === "graduated"
                  ? "Hoàn thành"
                  : "Không hoạt động"}
            </Badge>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <UserRound className="h-4 w-4" />
                Phụ huynh liên hệ
              </div>
              <p className="font-medium">{student.parent_name ?? "—"}</p>
              <a
                href={student.parent_phone ? `tel:${student.parent_phone}` : undefined}
                className="inline-flex items-center gap-2 text-sm text-primary-600 hover:underline"
              >
                <Phone className="h-4 w-4" />
                {student.parent_phone ?? "Chưa cập nhật"}
              </a>
            </div>

            <div className="rounded-lg border p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <BookOpen className="h-4 w-4" />
                Lớp học hiện tại
              </div>
              <p className="font-medium">{student.class_name}</p>
              {student.course_name && (
                <p className="text-sm text-muted-foreground">{student.course_name}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h2 className="mb-4 text-lg font-semibold">Bạn cùng lớp ({classmates.length})</h2>
          {classmates.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa có học viên khác trong lớp này.</p>
          ) : (
            <div className="space-y-3">
              {classmates.map((mate) => (
                <div key={mate.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium">{mate.name}</p>
                    <p className="text-sm text-muted-foreground">{mate.student_id ?? "—"}</p>
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
          { id: student.id, name: student.name, phone: student.parent_phone },
          ...classmates.map((mate) => ({ id: mate.id, name: mate.name, phone: mate.parent_phone })),
        ]}
        contextLabel={`Hồ sơ học viên: ${student.name}`}
      />
    </div>
  );
}
