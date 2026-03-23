"use client";

import { useState, useMemo } from "react";
import { Search, Filter, FileText, Clock, Users, TrendingUp, Bell, Mail, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ProgressBar } from "@/components/ui/progress-bar";
import { cn } from "@/lib/utils";

interface Assignment {
  id: string;
  title: string;
  courseName: string;
  courseId: string;
  deadline: string;
  deadlineLabel: string;
  isUrgent: boolean;
  submitted: number;
  total: number;
}

interface Submission {
  id: string;
  studentName: string;
  studentInitials: string;
  parentName: string;
  parentPhone: string;
  status: "submitted" | "graded" | "pending";
}

const MOCK_ASSIGNMENTS: Assignment[] = [
  { id: "1", title: "Bài tập: Xây dựng REST API", courseName: "Khóa Go Fiber", courseId: "c1", deadline: "2026-03-23T23:59:00", deadlineLabel: "Hạn: Hôm nay, 23:59", isUrgent: true, submitted: 30, total: 45 },
  { id: "2", title: "Thực hành: Middleware & Logging", courseName: "Khóa Go Fiber", courseId: "c1", deadline: "2026-03-25T23:59:00", deadlineLabel: "Hạn: Thứ 6", isUrgent: false, submitted: 5, total: 45 },
];

const MOCK_SUBMISSIONS: Submission[] = [
  { id: "s1", studentName: "Nguyen Anh", studentInitials: "NA", parentName: "PH: Chị Lan", parentPhone: "090 123 4567", status: "pending" },
  { id: "s2", studentName: "Hoàng Trung", studentInitials: "HT", parentName: "PH: Anh Tuấn", parentPhone: "091 987 6543", status: "pending" },
  { id: "s3", studentName: "Lê Minh", studentInitials: "LM", parentName: "PH: Chị Chi", parentPhone: "093 456 7890", status: "pending" },
];

export default function TeacherAssignmentsPage() {
  const [selectedId, setSelectedId] = useState<string | null>(MOCK_ASSIGNMENTS[0]?.id || null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<string[]>(["Khóa Go Fiber", "Hạn: Tuần này"]);
  const [submissionTab, setSubmissionTab] = useState("pending");

  const selectedAssignment = MOCK_ASSIGNMENTS.find((a) => a.id === selectedId);

  const removeFilter = (filter: string) => {
    setFilters(filters.filter((f) => f !== filter));
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Left Panel - Assignment List */}
      <div className="w-[360px] shrink-0 flex flex-col border-r">
        <div className="p-4 border-b space-y-3">
          <h1 className="text-lg font-semibold">Quản lý bài tập</h1>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input className="pl-9 pr-9" placeholder="Tìm tên bài tập..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7">
              <Filter className="w-4 h-4" />
            </Button>
          </div>

          {/* Filter chips */}
          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <Badge key={filter} variant="secondary" className="gap-1 pr-1">
                {filter}
                <button onClick={() => removeFilter(filter)} className="ml-1 hover:bg-gray-300 rounded-full p-0.5">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>

        {/* Assignment List */}
        <div className="flex-1 overflow-auto p-2 space-y-2">
          {MOCK_ASSIGNMENTS.map((assignment) => (
            <Card
              key={assignment.id}
              className={cn(
                "cursor-pointer transition-all hover:border-primary-300",
                selectedId === assignment.id && "border-primary-500 bg-primary-50"
              )}
              onClick={() => setSelectedId(assignment.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-primary-600 uppercase">{assignment.courseName}</span>
                  <Badge variant={assignment.isUrgent ? "destructive" : "secondary"} className="text-[10px]">
                    {assignment.deadlineLabel}
                  </Badge>
                </div>
                <p className="font-medium text-sm mb-3">{assignment.title}</p>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{assignment.submitted}/{assignment.total} đã nộp</span>
                  </div>
                  <ProgressBar value={(assignment.submitted / assignment.total) * 100} size="sm" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Right Panel - Assignment Detail */}
      <div className="flex-1 overflow-auto">
        {selectedAssignment ? (
          <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Quản lý bài tập &gt; {selectedAssignment.courseName}
                </p>
                <h2 className="text-xl font-semibold">{selectedAssignment.title}</h2>
                <p className="text-sm text-muted-foreground mt-1">Cập nhật lần cuối: 2 giờ trước</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline">Chỉnh sửa</Button>
                <Button>Xuất báo cáo</Button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">Tiến độ chung</p>
                  <div className="flex items-end gap-2">
                    <span className="text-2xl font-bold text-primary-600">66%</span>
                    <ProgressBar value={66} size="sm" className="flex-1 mb-1" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">Thời gian còn lại</p>
                  <span className="text-2xl font-bold text-red-500">12:15:30</span>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">Điểm trung bình</p>
                  <span className="text-2xl font-bold">8.2 / 10</span>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">Phản hồi tích cực</p>
                  <span className="text-2xl font-bold text-green-500">92%</span>
                </CardContent>
              </Card>
            </div>

            {/* Submission Tabs */}
            <Tabs value={submissionTab} onValueChange={setSubmissionTab}>
              <TabsList>
                <TabsTrigger value="all">Tất cả (45)</TabsTrigger>
                <TabsTrigger value="grading">Chờ chấm (10)</TabsTrigger>
                <TabsTrigger value="graded">Đã chấm (20)</TabsTrigger>
                <TabsTrigger value="pending">Chưa nộp (15)</TabsTrigger>
              </TabsList>

              <TabsContent value={submissionTab} className="mt-4">
                {/* Alert Banner */}
                <Card className="bg-orange-50 border-orange-200 mb-4">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-start gap-3">
                      <Bell className="w-5 h-5 text-orange-500 mt-0.5" />
                      <div>
                        <p className="font-medium text-orange-700">Nhắc nhở nộp bài</p>
                        <p className="text-sm text-orange-600">
                          Gửi thông báo đến tất cả phụ huynh có con chưa nộp bài tập này.
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" className="border-orange-300 text-orange-700 hover:bg-orange-100">
                      Nhắc nhở phụ huynh hàng loạt
                    </Button>
                  </CardContent>
                </Card>

                {/* Submissions Table */}
                <Card>
                  <div className="flex items-center justify-between p-4 border-b">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input className="pl-9 w-64" placeholder="Tìm tên học sinh..." />
                    </div>
                  </div>
                  <table className="w-full">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="p-4 text-xs font-medium text-muted-foreground">HỌC SINH & PHỤ HUYNH</th>
                        <th className="p-4 text-xs font-medium text-muted-foreground">LIÊN HỆ</th>
                        <th className="p-4 text-xs font-medium text-muted-foreground">TRẠNG THÁI</th>
                        <th className="p-4 text-xs font-medium text-muted-foreground">THAO TÁC</th>
                      </tr>
                    </thead>
                    <tbody>
                      {MOCK_SUBMISSIONS.map((sub) => (
                        <tr key={sub.id} className="border-b hover:bg-gray-50">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <Avatar fallback={sub.studentInitials} size="sm" className="bg-primary-100 text-primary-700" />
                              <div>
                                <p className="font-medium text-sm">{sub.studentName}</p>
                                <p className="text-xs text-muted-foreground">{sub.parentName}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="text-sm text-muted-foreground">{sub.parentPhone}</span>
                          </td>
                          <td className="p-4">
                            <Badge variant="warning" className="bg-orange-100 text-orange-700 border-orange-200">
                              Chưa nộp
                            </Badge>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Mail className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="text-primary-600">
                                Báo cáo
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Chọn một bài tập để xem chi tiết
          </div>
        )}
      </div>
    </div>
  );
}
