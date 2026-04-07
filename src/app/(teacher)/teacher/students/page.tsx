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

export default function TeacherStudentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isNotifyDialogOpen, setIsNotifyDialogOpen] = useState(false);
  const pageSize = 10;

  const { data: students = [], isLoading } = useMyStudents();

  const courseOptions = useMemo(
    () => Array.from(new Set(students.map((s) => s.class_name).filter(Boolean))),
    [students]
  );

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const matchesSearch =
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (student.student_id ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (student.parent_name ?? "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCourse = courseFilter === "all" || student.class_name === courseFilter;
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
    const rows = [
      ["Mã học viên", "Họ tên", "Phụ huynh", "Số điện thoại", "Lớp học", "Trạng thái"],
      ...filteredStudents.map((s) => [
        s.student_id ?? "",
        s.name,
        s.parent_name ?? "",
        s.parent_phone ?? "",
        s.class_name,
        s.status,
      ]),
    ];

    const csv = rows.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "teacher-students.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleNotifySelected = () => {
    if (selectedIds.length === 0) return;
    setIsNotifyDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Quản lý học viên</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportStudents} disabled={isLoading}>
            <Download className="mr-2 h-4 w-4" />
            Xuất Excel
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
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Select value={courseFilter} onValueChange={setCourseFilter}>
              <SelectTrigger className="w-[240px]">
                <SelectValue placeholder="Tất cả Lớp học" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả Lớp học</SelectItem>
                {courseOptions.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
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

      <Card>
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedIds.length === filteredStudents.length && filteredStudents.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead>HỌC VIÊN</TableHead>
                <TableHead>PHỤ HUYNH LIÊN HỆ</TableHead>
                <TableHead>LỚP HỌC</TableHead>
                <TableHead>TRẠNG THÁI</TableHead>
                <TableHead>THAO TÁC</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    Không tìm thấy học viên phù hợp.
                  </TableCell>
                </TableRow>
              ) : (
                pagedStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <Checkbox checked={selectedIds.includes(student.id)} onCheckedChange={() => toggleSelect(student.id)} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar fallback={student.name.charAt(0)} size="sm" className="bg-primary-100 text-primary-700" />
                        <div>
                          <p className="font-medium">{student.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Mã HS: {student.student_id ?? "—"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <a
                        href={student.parent_phone ? `tel:${student.parent_phone}` : undefined}
                        className="text-sm text-primary-600 hover:underline"
                      >
                        {student.parent_name ?? "—"}
                      </a>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{student.class_name}</span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={student.status === "active" ? "success" : "secondary"}
                        className="text-xs"
                      >
                        {student.status === "active"
                          ? "ĐANG HỌC"
                          : student.status === "graduated"
                            ? "HOÀN THÀNH"
                            : "KHÔNG HĐ"}
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
        )}
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Hiển thị {Math.min(pageSize, totalStudents)} trong tổng số {totalStudents.toLocaleString()} học viên
        </p>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            ‹
          </Button>
          {Array.from({ length: Math.min(3, totalPages) }, (_, i) => i + 1).map((page) => (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentPage(page)}
            >
              {page}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
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
          .map((s) => ({ id: s.id, name: s.name, phone: s.parent_phone }))}
        contextLabel="Quản lý học viên"
      />
    </div>
  );
}
