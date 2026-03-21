"use client";

import React, { useState, useMemo } from "react";
import { Search, ClipboardList, Calendar, Users, BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

type AssignmentStatus = "Đã chấm" | "Chờ chấm" | "Hết hạn";

interface Assignment {
  id: string;
  title: string;
  className: string;
  dueDate: string;
  submittedCount: number;
  totalStudent: number;
  status: AssignmentStatus;
}

const mockAssignments: Assignment[] = [
  {
    id: "1",
    title: "Bài tập thực hành: Hàm trong Python",
    className: "Lớp Lập trình Python Cơ bản",
    dueDate: "2024-05-20",
    submittedCount: 24,
    totalStudent: 24,
    status: "Đã chấm",
  },
  {
    id: "2",
    title: "Project cuối khóa: Website cá nhân",
    className: "Lớp Lập trình Web Frontend",
    dueDate: "2024-06-15",
    submittedCount: 15,
    totalStudent: 30,
    status: "Chờ chấm",
  },
  {
    id: "3",
    title: "Bài tập Quy hoạch động",
    className: "Lớp Thuật toán Nâng cao",
    dueDate: "2024-05-01",
    submittedCount: 10,
    totalStudent: 15,
    status: "Hết hạn",
  },
  {
    id: "4",
    title: "Phân tích bộ dữ liệu mẫu",
    className: "Lớp Data Science",
    dueDate: "2024-06-05",
    submittedCount: 20,
    totalStudent: 20,
    status: "Chờ chấm",
  },
];

export default function TeacherAssignmentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"Tất cả" | AssignmentStatus>("Tất cả");

  const filteredAssignments = useMemo(() => {
    return mockAssignments.filter((assignment) => {
      const matchText = `${assignment.title} ${assignment.className}`.toLowerCase();
      const matchesSearch = matchText.includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "Tất cả" || assignment.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [searchQuery, statusFilter]);

  const getStatusBadgeVariant = (status: AssignmentStatus) => {
    switch (status) {
      case "Đã chấm":
        return "success";
      case "Chờ chấm":
        return "warning";
      case "Hết hạn":
        return "destructive";
      default:
        return "default";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ClipboardList className="w-6 h-6" />
          Quản lý bài tập
        </h1>
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
              onValueChange={(val) => setStatusFilter(val as "Tất cả" | AssignmentStatus)}
              className="w-full md:w-auto overflow-x-auto"
            >
              <TabsList>
                <TabsTrigger value="Tất cả">Tất cả</TabsTrigger>
                <TabsTrigger value="Đã chấm">Đã chấm</TabsTrigger>
                <TabsTrigger value="Chờ chấm">Chờ chấm</TabsTrigger>
                <TabsTrigger value="Hết hạn">Hết hạn</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredAssignments.length > 0 ? (
          filteredAssignments.map((assignment) => (
            <Card key={assignment.id} className="hover:border-primary-300 transition-colors flex flex-col">
              <CardContent className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <Badge variant={getStatusBadgeVariant(assignment.status)}>
                      {assignment.status}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-lg line-clamp-2 mb-2" title={assignment.title}>
                    {assignment.title}
                  </h3>
                  
                  <div className="space-y-2 mt-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-gray-400" />
                      <span className="line-clamp-1" title={assignment.className}>
                        {assignment.className}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>Hạn nộp: {assignment.dueDate}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span>
                        Đã nộp: <span className="font-medium text-foreground">{assignment.submittedCount}</span>/{assignment.totalStudent}
                      </span>
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
            Không tìm thấy bài tập nào phù hợp với bộ lọc.
          </div>
        )}
      </div>
    </div>
  );
}
