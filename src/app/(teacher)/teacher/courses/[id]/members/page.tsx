"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Loader2, Search, Users } from "lucide-react";
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
import { useMyStudents } from "@/hooks/queries/use-classes";
import { useCourse } from "@/hooks/queries/use-courses";
import { useAuthStore } from "@/stores/auth.store";
import { matchesSearchQuery } from "@/lib/text-search";
import { StaleDataNotice } from "@/components/common/stale-data-notice";
import { ResourceLoadError, ResourceUnavailable, isResourceUnavailableError, unavailableStatus } from "@/components/common/resource-unavailable";

export default function TeacherCourseMembersPage() {
  const params = useParams<{ id: string }>();
  const courseId = params.id;
  const [searchQuery, setSearchQuery] = useState("");

  const { data: allStudents = [], isLoading } = useMyStudents();
  // B-18: danh sách thành viên lọc từ "học viên của tôi" nên khoá không tồn tại hay của giảng viên khác
  // trước đây chỉ ra bảng rỗng như khoá chưa có ai. Kiểm khoá và chủ khoá như trang sửa khoá.
  const { data: course, isLoading: courseLoading, isError: courseError, error: courseErrorValue, refetch: refetchCourse } = useCourse(courseId);
  const teacherId = useAuthStore((s) => s.user?.id);
  const isAdmin = useAuthStore((s) => s.activeRole) === "SYSTEM_ADMIN";

  // Filter by course_id; if the course has an associated class, filter by class_id too
  const members = useMemo(
    () => allStudents.filter((s) => s.course_id === courseId || s.class_id === courseId),
    [allStudents, courseId]
  );

  // Use class_name or course_name for the title
  const courseTitle = course?.title ?? members[0]?.course_name ?? members[0]?.class_name ?? "Khoá học";

  const filteredMembers = useMemo(() => {
    return members.filter((member) => matchesSearchQuery(searchQuery, member.name, member.student_id));
  }, [members, searchQuery]);

  if (courseLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  // Lỗi 5xx/mạng khác "không tìm thấy": hiện lỗi + Thử lại, không báo khoá không tồn tại.
  if (courseError && !course && !isResourceUnavailableError(courseErrorValue)) {
    return <ResourceLoadError resourceLabel="khoá học" onRetry={() => refetchCourse()} />;
  }
  if (!course) {
    return <ResourceUnavailable status={unavailableStatus(courseErrorValue)} resourceLabel="khoá học" backHref="/teacher/courses" backLabel="Về Khoá học của tôi" />;
  }
  // Store chưa có user thì chưa so được chủ khoá: chờ, không nháy "Không có quyền".
  if (!isAdmin && !teacherId) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!isAdmin && course.instructor_id !== teacherId) {
    return <ResourceUnavailable status={403} resourceLabel="khoá học" backHref="/teacher/courses" backLabel="Về Khoá học của tôi" />;
  }

  return (
    <div className="space-y-6">
      {courseError && <StaleDataNotice resourceLabel="khoá học" onRetry={() => refetchCourse()} />}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/teacher/courses" aria-label="Quay lại danh sách khoá học">
              <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Thành viên khoá học</h1>
            <p className="text-sm text-muted-foreground">{courseTitle}</p>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Tìm theo tên hoặc mã học viên..."
              aria-label="Tìm theo tên hoặc mã học viên"
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
                            tone="soft"
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

    </div>
  );
}
