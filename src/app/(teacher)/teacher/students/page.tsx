"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Download, Loader2, Search } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { QueryState } from "@/components/common/query-state";
import { useMyStudents } from "@/hooks/queries/use-classes";
import { buildCsv, downloadCsv } from "@/lib/csv-export";
import { withClassPrefix } from "@/lib/class-label";
import { matchesSearchQuery } from "@/lib/text-search";
import { StudentMobileCard } from "./student-mobile-card";
import { ParentContact } from "./parent-contact";
import { courseFilterOptions, groupStudents, STUDENT_STATUS_LABEL } from "./group-students";
import { StaleDataNotice } from "@/components/common/stale-data-notice";

export default function TeacherStudentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const { data, isLoading, isError, error, refetch } = useMyStudents();
  const rows = useMemo(() => data ?? [], [data]);
  // Q9-T-02: GET lỗi (và chưa có dữ liệu cũ) không được trông như "chưa có học viên nào".
  const loadFailed = isError && !data;
  // D6 (QA vòng 2): API trả 1 dòng/(học viên, khoá) — gộp về 1 dòng/học viên.
  const students = useMemo(() => groupStudents(rows), [rows]);
  const courseOptions = useMemo(() => courseFilterOptions(students), [students]);

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const matchesSearch = matchesSearchQuery(searchQuery, student.name, student.studentId, student.parentName);
      const matchesCourse =
        courseFilter === "all" || student.courses.some((c) => c.courseName === courseFilter);
      const matchesStatus = statusFilter === "all" || student.status === statusFilter;
      return matchesSearch && matchesCourse && matchesStatus;
    });
  }, [students, searchQuery, courseFilter, statusFilter]);

  const totalStudents = filteredStudents.length;
  const totalPages = Math.max(1, Math.ceil(totalStudents / pageSize));
  const pagedStudents = filteredStudents.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleExportStudents = () => {
    const rowsCsv = [
      ["Mã học viên", "Họ tên", "Phụ huynh", "Số điện thoại", "Khoá học", "Trạng thái"],
      ...filteredStudents.map((s) => [
        s.studentId ?? "",
        s.name,
        s.parentName ?? "",
        s.parentPhone ?? "",
        s.courses.map((c) => c.courseName).join("; "),
        STUDENT_STATUS_LABEL[s.status],
      ]),
    ];
    downloadCsv("teacher-students.csv", buildCsv(rowsCsv));
  };

  return (
    <div className="space-y-6">
      {/* D8 (QA vòng 2): tiêu đề + 2 nút trên 1 hàng tràn 3px ở 390px — cho xuống dòng. */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Quản lý học viên</h1>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleExportStudents} disabled={isLoading || loadFailed}>
            <Download className="mr-2 h-4 w-4" />
            Xuất CSV
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Tìm theo Mã HS, Tên, Phụ huynh..."
                aria-label="Tìm theo mã học sinh, tên hoặc phụ huynh"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            <Select
              value={courseFilter}
              onValueChange={(v) => {
                setCourseFilter(v);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-full md:w-[240px]">
                <SelectValue placeholder="Tất cả khoá học" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả khoá học</SelectItem>
                {courseOptions.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="active">Đang học</SelectItem>
                <SelectItem value="inactive">Không hoạt động</SelectItem>
                <SelectItem value="graduated">Hoàn thành</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Q10 #148 H1: refetch nền lỗi mà còn danh sách cache thì giữ danh sách + báo "Thử lại". */}
      {isError && !loadFailed && <StaleDataNotice resourceLabel="danh sách học viên" onRetry={() => refetch()} />}

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : loadFailed ? (
          <QueryState isError error={error} onRetry={() => refetch()} className="border-0 py-10">
            {null}
          </QueryState>
        ) : (
          <>
          {/* Q3-21: dưới md bảng 6 cột bị cắt cột trạng thái/thao tác -> hiện dạng thẻ. */}
          <ul className="divide-y md:hidden" data-testid="student-cards">
            {pagedStudents.length === 0 ? (
              <li className="py-10 text-center text-sm text-muted-foreground">
                {students.length === 0 ? "Chưa có học viên nào ghi danh khoá học của bạn." : "Không tìm thấy học viên phù hợp."}
              </li>
            ) : (
              pagedStudents.map((student) => (
                <StudentMobileCard key={student.id} student={student} />
              ))
            )}
          </ul>
          <div className="hidden overflow-x-auto md:block">
            <Table className="min-w-[760px]">
              <TableHeader>
                <TableRow>
                  <TableHead>HỌC VIÊN</TableHead>
                  <TableHead>PHỤ HUYNH LIÊN HỆ</TableHead>
                  <TableHead>KHOÁ HỌC</TableHead>
                  <TableHead>TRẠNG THÁI</TableHead>
                  <TableHead>THAO TÁC</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagedStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                      {students.length === 0 ? "Chưa có học viên nào ghi danh khoá học của bạn." : "Không tìm thấy học viên phù hợp."}
                    </TableCell>
                  </TableRow>
                ) : (
                  pagedStudents.map((student) => (
                    <TableRow key={student.id} data-testid="student-row">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar fallback={student.name.charAt(0)} size="sm" tone="soft" />
                          <div>
                            <p className="font-medium">{student.name}</p>
                            <p className="text-xs text-muted-foreground">Mã HS: {student.studentId ?? "—"}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {student.parentName ? (
                          <span className="text-sm">
                            <ParentContact name={student.parentName} phone={student.parentPhone} />
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <ul className="space-y-0.5 text-sm">
                          {student.courses.map((c) => (
                            <li key={`${c.courseId ?? c.courseName}-${c.className ?? ""}`}>
                              {c.courseName}
                              {c.className && c.className !== c.courseName && (
                                <span className="text-xs text-muted-foreground"> · {withClassPrefix(c.className)}</span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </TableCell>
                      <TableCell>
                        <Badge variant={student.status === "active" ? "success" : "secondary"} className="whitespace-nowrap text-xs">
                          {STUDENT_STATUS_LABEL[student.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Link href={`/teacher/students/${student.id}`} className="text-sm text-primary-600 hover:underline">
                          Hồ sơ
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          </>
        )}
      </Card>

      {!loadFailed && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">
            Hiển thị {pagedStudents.length} trong tổng số {totalStudents.toLocaleString("vi-VN")} học viên
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
              aria-label="Trang trước"
            >
              ‹
            </Button>
            <span className="px-2 text-sm text-muted-foreground">
              {currentPage}/{totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
              aria-label="Trang sau"
            >
              ›
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
