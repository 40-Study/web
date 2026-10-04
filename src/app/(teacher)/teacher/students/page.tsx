"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Bell, Download, Loader2, Search } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import TeacherNotificationDialog from "@/components/teacher/teacher-notification-dialog";
import { useMyStudents } from "@/hooks/queries/use-classes";
import { buildCsv, downloadCsv } from "@/lib/csv-export";
import { withClassPrefix } from "@/lib/class-label";
import { courseFilterOptions, groupStudents, type GroupedStudent } from "./group-students";

const STATUS_LABEL: Record<GroupedStudent["status"], string> = {
  active: "ĐANG HỌC",
  graduated: "HOÀN THÀNH",
  inactive: "KHÔNG HOẠT ĐỘNG",
};

export default function TeacherStudentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isNotifyDialogOpen, setIsNotifyDialogOpen] = useState(false);
  const pageSize = 10;

  const { data: rows = [], isLoading } = useMyStudents();
  // D6 (QA vòng 2): API trả 1 dòng/(học viên, khoá) — gộp về 1 dòng/học viên.
  const students = useMemo(() => groupStudents(rows), [rows]);
  const courseOptions = useMemo(() => courseFilterOptions(students), [students]);

  const filteredStudents = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return students.filter((student) => {
      const matchesSearch =
        student.name.toLowerCase().includes(q) ||
        (student.studentId ?? "").toLowerCase().includes(q) ||
        (student.parentName ?? "").toLowerCase().includes(q);
      const matchesCourse =
        courseFilter === "all" || student.courses.some((c) => c.courseName === courseFilter);
      const matchesStatus = statusFilter === "all" || student.status === statusFilter;
      return matchesSearch && matchesCourse && matchesStatus;
    });
  }, [students, searchQuery, courseFilter, statusFilter]);

  const totalStudents = filteredStudents.length;
  const totalPages = Math.max(1, Math.ceil(totalStudents / pageSize));
  const pagedStudents = filteredStudents.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredStudents.length) {
      setSelectedIds([]);
      return;
    }
    setSelectedIds(filteredStudents.map((s) => s.id));
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const handleExportStudents = () => {
    const rowsCsv = [
      ["Mã học viên", "Họ tên", "Phụ huynh", "Số điện thoại", "Khoá học", "Trạng thái"],
      ...filteredStudents.map((s) => [
        s.studentId ?? "",
        s.name,
        s.parentName ?? "",
        s.parentPhone ?? "",
        s.courses.map((c) => c.courseName).join("; "),
        STATUS_LABEL[s.status],
      ]),
    ];
    downloadCsv("teacher-students.csv", buildCsv(rowsCsv));
  };

  const handleNotifySelected = () => {
    if (selectedIds.length === 0) return;
    setIsNotifyDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* D8 (QA vòng 2): tiêu đề + 2 nút trên 1 hàng tràn 3px ở 390px — cho xuống dòng. */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Quản lý học viên</h1>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleExportStudents} disabled={isLoading}>
            <Download className="mr-2 h-4 w-4" />
            Xuất CSV
          </Button>
          <Button disabled={selectedIds.length === 0} onClick={handleNotifySelected}>
            <Bell className="mr-2 h-4 w-4" />
            Gửi thông báo {selectedIds.length > 0 && `(${selectedIds.length})`}
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

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table className="min-w-[760px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedIds.length === filteredStudents.length && filteredStudents.length > 0}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Chọn tất cả học viên"
                    />
                  </TableHead>
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
                    <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                      {students.length === 0 ? "Chưa có học viên nào ghi danh khoá học của bạn." : "Không tìm thấy học viên phù hợp."}
                    </TableCell>
                  </TableRow>
                ) : (
                  pagedStudents.map((student) => (
                    <TableRow key={student.id} data-testid="student-row">
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.includes(student.id)}
                          onCheckedChange={() => toggleSelect(student.id)}
                          aria-label={`Chọn ${student.name}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar fallback={student.name.charAt(0)} size="sm" className="bg-primary-100 text-primary-700" />
                          <div>
                            <p className="font-medium">{student.name}</p>
                            <p className="text-xs text-muted-foreground">Mã HS: {student.studentId ?? "—"}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {student.parentName ? (
                          <a
                            href={student.parentPhone ? `tel:${student.parentPhone}` : undefined}
                            className="text-sm text-primary-600 hover:underline"
                          >
                            {student.parentName}
                          </a>
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
                        <Badge variant={student.status === "active" ? "success" : "secondary"} className="text-xs">
                          {STATUS_LABEL[student.status]}
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
        )}
      </Card>

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

      <TeacherNotificationDialog
        open={isNotifyDialogOpen}
        onOpenChange={setIsNotifyDialogOpen}
        recipients={students
          .filter((s) => selectedIds.includes(s.id))
          .map((s) => ({ id: s.id, name: s.name, phone: s.parentPhone }))}
        contextLabel="Quản lý học viên"
      />
    </div>
  );
}
