"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Bell, Loader2, Search, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import TeacherNotificationDialog from "@/components/teacher/teacher-notification-dialog";
import { useMyStudents } from "@/hooks/queries/use-classes";

export default function TeacherCourseMembersPage() {
  const params = useParams<{ id: string }>();
  const courseId = params.id;
  const [searchQuery, setSearchQuery] = useState("");
  const [isNotifyDialogOpen, setIsNotifyDialogOpen] = useState(false);

  const { data: allStudents = [], isLoading } = useMyStudents();

  // Filter by course_id; if the course has an associated class, filter by class_id too
  const members = useMemo(
    () => allStudents.filter((s) => s.course_id === courseId || s.class_id === courseId),
    [allStudents, courseId]
  );

  // Use class_name or course_name for the title
  const courseTitle = members[0]?.course_name ?? members[0]?.class_name ?? `Khóa học #${courseId}`;

  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      const q = searchQuery.toLowerCase();
      return (
        member.name.toLowerCase().includes(q) ||
        (member.student_id ?? "").toLowerCase().includes(q)
      );
    });
  }, [members, searchQuery]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/teacher/courses">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Thành viên khóa học</h1>
            <p className="text-sm text-muted-foreground">{courseTitle}</p>
          </div>
        </div>
        <Button
          onClick={() => setIsNotifyDialogOpen(true)}
          disabled={filteredMembers.length === 0}
        >
          <Bell className="mr-2 h-4 w-4" />
          Gửi thông báo ({filteredMembers.length})
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Tìm theo tên hoặc mã học viên..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Học viên</TableHead>
                  <TableHead>Mã học viên</TableHead>
                  <TableHead>Phụ huynh</TableHead>
                  <TableHead className="w-[120px] text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <Users className="h-5 w-5" />
                        Không có thành viên phù hợp.
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar
                            fallback={member.name.charAt(0)}
                            size="sm"
                            className="bg-primary-100 text-primary-700"
                          />
                          <span className="font-medium">{member.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{member.student_id ?? "—"}</TableCell>
                      <TableCell>{member.parent_name ?? "—"}</TableCell>
                      <TableCell className="text-right">
                        <Link
                          href={`/teacher/students/${member.id}`}
                          className="text-sm text-primary-600 hover:underline"
                        >
                          Hồ sơ
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <TeacherNotificationDialog
        open={isNotifyDialogOpen}
        onOpenChange={setIsNotifyDialogOpen}
        recipients={filteredMembers.map((member) => ({
          id: member.id,
          name: member.name,
          phone: member.parent_phone,
        }))}
        contextLabel={`Khóa học: ${courseTitle}`}
      />
    </div>
  );
}
