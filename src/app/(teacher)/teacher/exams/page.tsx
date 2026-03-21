"use client";

import React, { useState, useMemo } from "react";
import { Search, FileText, Calendar, Clock, BookOpen, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

type ExamStatus = "Đã hoàn thành" | "Đang diễn ra" | "Sắp tới";

interface Exam {
  id: string;
  title: string;
  className: string;
  date: string;
  duration: string;
  status: ExamStatus;
}

const mockExams: Exam[] = [
  {
    id: "1",
    title: "Kiểm tra 15 phút: Vòng lặp",
    className: "Lớp Lập trình Python Cơ bản",
    date: "2024-05-20",
    duration: "15 phút",
    status: "Đã hoàn thành",
  },
  {
    id: "2",
    title: "Thi giữa kỳ: React & Next.js",
    className: "Lớp Lập trình Web Frontend",
    date: "2024-06-15",
    duration: "60 phút",
    status: "Đang diễn ra",
  },
  {
    id: "3",
    title: "Kiểm tra đầu vào",
    className: "Lớp Thuật toán Nâng cao",
    date: "2024-07-01",
    duration: "45 phút",
    status: "Sắp tới",
  },
  {
    id: "4",
    title: "Thi cuối kỳ: Machine Learning",
    className: "Lớp Data Science",
    date: "2024-06-20",
    duration: "90 phút",
    status: "Sắp tới",
  },
];

export default function TeacherExamsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"Tất cả" | ExamStatus>("Tất cả");

  const filteredExams = useMemo(() => {
    return mockExams.filter((exam) => {
      const matchText = `${exam.title} ${exam.className}`.toLowerCase();
      const matchesSearch = matchText.includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "Tất cả" || exam.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [searchQuery, statusFilter]);

  const getStatusBadgeVariant = (status: ExamStatus) => {
    switch (status) {
      case "Đã hoàn thành":
        return "success";
      case "Đang diễn ra":
        return "default";
      case "Sắp tới":
        return "secondary";
      default:
        return "default";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="w-6 h-6" />
          Quản lý bài kiểm tra
        </h1>
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Tạo bài kiểm tra
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
                placeholder="Tìm kiếm theo tiêu đề hoặc lớp học..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Tabs
              value={statusFilter}
              onValueChange={(val) => setStatusFilter(val as "Tất cả" | ExamStatus)}
              className="w-full md:w-auto overflow-x-auto"
            >
              <TabsList>
                <TabsTrigger value="Tất cả">Tất cả</TabsTrigger>
                <TabsTrigger value="Đã hoàn thành">Đã hoàn thành</TabsTrigger>
                <TabsTrigger value="Đang diễn ra">Đang diễn ra</TabsTrigger>
                <TabsTrigger value="Sắp tới">Sắp tới</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredExams.length > 0 ? (
          filteredExams.map((exam) => (
            <Card key={exam.id} className="hover:border-primary-300 transition-colors flex flex-col">
              <CardContent className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <Badge variant={getStatusBadgeVariant(exam.status)}>
                      {exam.status}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-lg line-clamp-2 mb-2" title={exam.title}>
                    {exam.title}
                  </h3>
                  
                  <div className="space-y-2 mt-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-gray-400" />
                      <span className="line-clamp-1" title={exam.className}>
                        {exam.className}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>Ngày: {exam.date}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span>Thời lượng: {exam.duration}</span>
                    </div>
                  </div>
                </div>
                
                <Button variant="outline" className="w-full mt-6">
                  Xem chi tiết
                </Button>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-12 text-center text-muted-foreground border rounded-lg border-dashed">
            Không tìm thấy bài kiểm tra nào phù hợp với bộ lọc.
          </div>
        )}
      </div>
    </div>
  );
}
