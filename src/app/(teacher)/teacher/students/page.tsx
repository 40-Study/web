"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, Download, Bell } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
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

interface Student {
  id: string;
  name: string;
  studentId: string;
  birthYear: number;
  avatar?: string;
  parentName: string;
  parentPhone?: string;
  courseName: string;
  status: "active" | "completed" | "paused";
}

const MOCK_STUDENTS: Student[] = [
  { id: "1", name: "Trần Hoàng Khôi", studentId: "HCM-NTT-007762", birthYear: 2020, parentName: "Trần Văn Trung", courseName: "Lập trình Scratch Cơ bản", status: "active" },
  { id: "2", name: "Nguyễn Tuấn Anh", studentId: "HN-CGL-001234", birthYear: 2018, parentName: "Nguyễn Thị Lan", courseName: "Python Nhập môn", status: "active" },
  { id: "3", name: "Lê Minh Tuấn", studentId: "DN-MT-009912", birthYear: 2019, parentName: "Lê Văn Hùng", courseName: "Lập trình Scratch Cơ bản", status: "active" },
  { id: "4", name: "Hoàng Bảo Ngọc", studentId: "HN-HK-002231", birthYear: 2020, parentName: "Nguyễn Thu Hà", courseName: "Tiếng Anh Mầm non", status: "active" },
  { id: "5", name: "Vũ Đức Duy", studentId: "HCM-TB-003314", birthYear: 2017, parentName: "Vũ Đức Thịnh", courseName: "Toán Tư duy K2", status: "active" },
  { id: "6", name: "Phan Mỹ Linh", studentId: "HN-TX-004456", birthYear: 2021, parentName: "Phan Văn An", courseName: "Mỹ thuật Cơ bản", status: "active" },
  { id: "7", name: "Đỗ Gia Bảo", studentId: "HCM-Q1-008821", birthYear: 2018, parentName: "Đỗ Thành Danh", courseName: "Kỹ năng Sống S1", status: "active" },
  { id: "8", name: "Lý Thanh Hằng", studentId: "DN-HC-001156", birthYear: 2019, parentName: "Lý Hoàng Nam", courseName: "Robotics M1", status: "active" },
  { id: "9", name: "Bùi Minh Quân", studentId: "HN-LB-006823", birthYear: 2018, parentName: "Bùi Văn Thắng", courseName: "Cờ vua Nhập môn", status: "active" },
  { id: "10", name: "Ngô Phương Anh", studentId: "HCM-PN-005511", birthYear: 2020, parentName: "Ngô Văn Hiếu", courseName: "Lập trình Python", status: "active" },
];

export default function TeacherStudentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("active");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const filteredStudents = useMemo(() => {
    return MOCK_STUDENTS.filter((student) => {
      const matchesSearch =
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.parentName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCourse = courseFilter === "all" || student.courseName.includes(courseFilter);
      const matchesStatus = statusFilter === "all" || student.status === statusFilter;
      return matchesSearch && matchesCourse && matchesStatus;
    });
  }, [searchQuery, courseFilter, statusFilter]);

  const totalStudents = 1240;
  const totalPages = Math.ceil(totalStudents / pageSize);

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredStudents.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredStudents.map((s) => s.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Quản lý học viên</h1>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Xuất Excel
          </Button>
          <Button disabled={selectedIds.length === 0}>
            <Bell className="w-4 h-4 mr-2" />
            Gửi thông báo {selectedIds.length > 0 && `(${selectedIds.length})`}
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Tìm theo Mã HS, Tên, Phụ huynh..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={courseFilter} onValueChange={setCourseFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Tất cả Khóa học" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả Khóa học</SelectItem>
                <SelectItem value="Python">Python</SelectItem>
                <SelectItem value="Scratch">Scratch</SelectItem>
                <SelectItem value="Robotics">Robotics</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="active">Đang học</SelectItem>
                <SelectItem value="completed">Hoàn thành</SelectItem>
                <SelectItem value="paused">Tạm dừng</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
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
              <TableHead>KHÓA HỌC / LỚP</TableHead>
              <TableHead>TRẠNG THÁI</TableHead>
              <TableHead>THAO TÁC</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStudents.map((student) => (
              <TableRow key={student.id}>
                <TableCell>
                  <Checkbox checked={selectedIds.includes(student.id)} onCheckedChange={() => toggleSelect(student.id)} />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar fallback={student.name.charAt(0)} size="sm" className="bg-primary-100 text-primary-700" />
                    <div>
                      <p className="font-medium">{student.name}</p>
                      <p className="text-xs text-muted-foreground">Mã HS: {student.studentId} • Sinh: {student.birthYear}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Link href="#" className="text-primary-600 hover:underline text-sm">{student.parentName}</Link>
                </TableCell>
                <TableCell><span className="text-sm">{student.courseName}</span></TableCell>
                <TableCell>
                  <Badge variant={student.status === "active" ? "success" : "secondary"} className="text-xs">
                    {student.status === "active" ? "ĐANG HỌC" : "HOÀN THÀNH"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Link href={`/teacher/students/${student.id}`} className="text-primary-600 hover:underline text-sm">Hồ sơ</Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Hiển thị 1 - 10 trong tổng số {totalStudents.toLocaleString()} học sinh</p>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>‹</Button>
          {[1, 2, 3].map((page) => (
            <Button key={page} variant={currentPage === page ? "default" : "outline"} size="sm" onClick={() => setCurrentPage(page)}>{page}</Button>
          ))}
          <span className="px-2 text-muted-foreground">...</span>
          <Button variant="outline" size="sm" onClick={() => setCurrentPage(totalPages)}>{totalPages}</Button>
          <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)}>›</Button>
        </div>
      </div>
    </div>
  );
}
