"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Search, GraduationCap, Calendar, Trophy, Mail } from "lucide-react";

interface Student {
  id: string; name: string; email: string; avatarUrl?: string;
  className: string; xp: number; level: number; joinDate: string;
}

const MOCK_STUDENTS: Student[] = [
  { id: "std_1", name: "Nguyễn Văn An", email: "an.nguyen@example.com", className: "Lớp Lập trình Python Cơ bản", xp: 2450, level: 3, joinDate: "2023-09-15" },
  { id: "std_2", name: "Trần Thị Bình", email: "binh.tran@example.com", className: "Lớp Lập trình Web Frontend", xp: 4120, level: 5, joinDate: "2023-08-01", avatarUrl: "https://i.pravatar.cc/150?u=std_2" },
  { id: "std_3", name: "Lê Hoàng Công", email: "cong.le@example.com", className: "Lớp Thuật toán Nâng cao", xp: 850, level: 1, joinDate: "2023-11-20" },
  { id: "std_4", name: "Phạm Dung", email: "dung.pham@example.com", className: "Lớp Lập trình Python Cơ bản", xp: 3200, level: 4, joinDate: "2023-09-16" },
  { id: "std_5", name: "Đặng Tiến Đạt", email: "dat.dang@example.com", className: "Lớp Data Science", xp: 5600, level: 6, joinDate: "2023-07-10", avatarUrl: "https://i.pravatar.cc/150?u=std_5" },
  { id: "std_6", name: "Hồ Lan Anh", email: "lananh.ho@example.com", className: "Lớp Lập trình Web Frontend", xp: 1800, level: 2, joinDate: "2023-10-05" },
];

type SortOption = "name_asc" | "name_desc" | "xp_desc" | "join_date_desc";

export default function TeacherStudentsPage() {
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [sortOption, setSortOption] = useState<SortOption>("xp_desc");

  const classes = useMemo(() => Array.from(new Set(MOCK_STUDENTS.map((s) => s.className))), []);

  const filteredAndSortedStudents = useMemo(() => {
    let result = [...MOCK_STUDENTS];
    if (search.trim()) {
      const lowerSearch = search.toLowerCase();
      result = result.filter(s => s.name.toLowerCase().includes(lowerSearch) || s.email.toLowerCase().includes(lowerSearch));
    }
    if (classFilter !== "all") result = result.filter(s => s.className === classFilter);

    result.sort((a, b) => {
      switch (sortOption) {
        case "name_asc": return a.name.localeCompare(b.name);
        case "name_desc": return b.name.localeCompare(a.name);
        case "xp_desc": return b.xp - a.xp;
        case "join_date_desc": return new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime();
        default: return 0;
      }
    });
    return result;
  }, [search, classFilter, sortOption]);

  const formatDate = (date: string) => new Date(date).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Danh sách Học sinh</h1>
      </div>

      <div className="flex flex-col gap-4 rounded-xl border bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input type="search" placeholder="Tìm theo tên, email..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Chọn lớp học" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả lớp học</SelectItem>
              {classes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={sortOption} onValueChange={(val) => setSortOption(val as SortOption)}>
            <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Sắp xếp" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="xp_desc">XP cao nhất</SelectItem>
              <SelectItem value="name_asc">Tên (A-Z)</SelectItem>
              <SelectItem value="name_desc">Tên (Z-A)</SelectItem>
              <SelectItem value="join_date_desc">Mới tham gia</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredAndSortedStudents.map((student) => (
          <div key={student.id} className="flex flex-col rounded-xl border bg-white p-5 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-start gap-4">
              <Avatar src={student.avatarUrl} fallback={student.name} size="lg" />
              <div className="flex-1 overflow-hidden">
                <h3 className="truncate font-semibold text-gray-900" title={student.name}>{student.name}</h3>
                <div className="mt-1 flex items-center gap-1.5 text-sm text-gray-500">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate" title={student.email}>{student.email}</span>
                </div>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <GraduationCap className="h-4 w-4 shrink-0 text-primary-500" />
                <span className="truncate font-medium">{student.className}</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1.5 font-medium text-gray-700">
                  <Trophy className="h-4 w-4 text-orange-500" />
                  <span>Cấp {student.level}</span>
                </div>
                <span className="font-bold text-primary-600">{student.xp.toLocaleString("vi-VN")} XP</span>
              </div>
              
              <div className="space-y-1">
                <ProgressBar value={(student.xp % 1000) / 10} variant="xp" size="sm" />
                <p className="text-right text-xs text-gray-500">{student.xp % 1000} / 1000 XP</p>
              </div>
            </div>

            <div className="mt-auto pt-4 flex items-center gap-2 border-t text-xs text-gray-500">
              <Calendar className="h-3.5 w-3.5" />
              <span>Tham gia: {formatDate(student.joinDate)}</span>
            </div>
          </div>
        ))}
      </div>

      {filteredAndSortedStudents.length === 0 && (
        <div className="rounded-xl border border-dashed py-12 text-center">
          <p className="text-gray-500">Không tìm thấy học sinh nào phù hợp.</p>
        </div>
      )}
    </div>
  );
}