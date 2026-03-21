"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Search, Star, Plus, Users, BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type CourseStatus = "Đang dạy" | "Nháp" | "Đã kết thúc";

interface Course {
  id: string;
  title: string;
  students: number;
  rating: number;
  status: CourseStatus;
}

const mockCourses: Course[] = [
  { id: "1", title: "Toán cao cấp 1", students: 456, rating: 4.8, status: "Đang dạy" },
  { id: "2", title: "Đại số tuyến tính", students: 234, rating: 4.6, status: "Nháp" },
  { id: "3", title: "Xác suất thống kê", students: 189, rating: 4.9, status: "Đã kết thúc" },
  { id: "4", title: "Vật lý đại cương", students: 300, rating: 4.7, status: "Đang dạy" },
  { id: "5", title: "Nhập môn Khoa học Máy tính", students: 0, rating: 0, status: "Nháp" },
];

export default function TeacherCoursesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"Tất cả" | CourseStatus>("Tất cả");

  const filteredCourses = useMemo(() => {
    return mockCourses.filter((course) => {
      const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "Tất cả" || course.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [searchQuery, statusFilter]);

  const getStatusBadgeVariant = (status: CourseStatus) => {
    switch (status) {
      case "Đang dạy":
        return "success";
      case "Nháp":
        return "secondary";
      case "Đã kết thúc":
        return "outline";
      default:
        return "default";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="w-6 h-6" />
          Quản lý khóa học
        </h1>
        <Button asChild>
          <Link href="/teacher/courses" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Tạo khóa học mới
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Bộ lọc & Tìm kiếm</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
            <div className="relative w-full md:w-96">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-muted-foreground" />
              </div>
              <Input
                type="text"
                placeholder="Tìm kiếm theo tên khóa học..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Tabs value={statusFilter} onValueChange={(val) => setStatusFilter(val as "Tất cả" | CourseStatus)} className="w-full md:w-auto overflow-x-auto">
              <TabsList>
                <TabsTrigger value="Tất cả">Tất cả</TabsTrigger>
                <TabsTrigger value="Đang dạy">Đang dạy</TabsTrigger>
                <TabsTrigger value="Nháp">Nháp</TabsTrigger>
                <TabsTrigger value="Đã kết thúc">Đã kết thúc</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredCourses.length > 0 ? (
          filteredCourses.map((course) => (
            <Card key={course.id} className="hover:border-primary-300 transition-colors flex flex-col">
              <CardContent className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary-400 to-secondary-500 shrink-0" />
                    <Badge variant={getStatusBadgeVariant(course.status)}>
                      {course.status}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-lg line-clamp-2 mb-1" title={course.title}>
                    {course.title}
                  </h3>
                  <div className="flex items-center text-sm text-muted-foreground gap-4 mt-3">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-4 h-4" />
                      {course.students} học viên
                    </span>
                    <span className="flex items-center gap-1.5 text-yellow-500">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="font-medium text-foreground">{course.rating.toFixed(1)}</span>
                    </span>
                  </div>
                </div>
                <Button variant="outline" className="w-full mt-5" asChild>
                  <Link href={`/teacher/courses`}>
                    Quản lý
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-12 text-center text-muted-foreground border rounded-lg border-dashed">
            Không tìm thấy khóa học nào phù hợp với bộ lọc.
          </div>
        )}
      </div>
    </div>
  );
}
