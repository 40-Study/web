"use client";

import { useState } from "react";
import Link from "next/link";
import { Download, DollarSign, UserPlus, Users, TrendingUp, TrendingDown, Play, Radio, Layers } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { cn, formatCurrency } from "@/lib/utils";

// Mock data
const GROWTH_DATA = [
  { date: "1ST", revenue: 2.5, students: 15 },
  { date: "5TH", revenue: 4.2, students: 28 },
  { date: "10TH", revenue: 3.8, students: 22 },
  { date: "15TH", revenue: 5.5, students: 35 },
  { date: "20TH", revenue: 6.2, students: 42 },
  { date: "25TH", revenue: 5.8, students: 38 },
  { date: "31ST", revenue: 7.1, students: 48 },
];

const DISTRIBUTION_DATA = [
  { name: "Video", value: 720, percentage: 60, color: "#3B82F6" },
  { name: "Livestream", value: 360, percentage: 30, color: "#EF4444" },
  { name: "Hybrid", value: 120, percentage: 10, color: "#1E40AF" },
];

const COURSE_PERFORMANCE = [
  { id: "1", title: "Go Fiber Framework Mastery", type: "video", modules: 12, enrollments: 124, completion: 82, revenue: 45200000 },
  { id: "2", title: "AWS Cloud Practitioner 2024", type: "hybrid", modules: 0, enrollments: 98, completion: 65, revenue: 32800000 },
  { id: "3", title: "React Advanced Patterns", type: "video", modules: 8, enrollments: 56, completion: 90, revenue: 18500000 },
];

const KPI_DATA = [
  { label: "Tổng doanh thu", value: "125.4M ₫", change: 12.5, icon: DollarSign, positive: true },
  { label: "Học sinh mới", value: "342", change: 8.2, icon: UserPlus, positive: true },
  { label: "Học sinh đang học", value: "1,240", change: -1.1, icon: Users, positive: false },
  { label: "Tỷ lệ hoàn thành", value: "68%", change: -4.0, icon: TrendingUp, positive: false },
];

export default function TeacherAnalyticsPage() {
  const [dateRange, setDateRange] = useState("this-month");
  const [courseFilter, setCourseFilter] = useState("all");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">Thống kê tổng quan</h1>
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="this-month">Tháng này</SelectItem>
              <SelectItem value="last-month">Tháng trước</SelectItem>
              <SelectItem value="this-quarter">Quý này</SelectItem>
            </SelectContent>
          </Select>
          <Select value={courseFilter} onValueChange={setCourseFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Tất cả khóa học" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả khóa học</SelectItem>
              <SelectItem value="go-fiber">Go Fiber</SelectItem>
              <SelectItem value="aws">AWS Cloud</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline"><Download className="w-4 h-4 mr-2" />Tải báo cáo PDF</Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {KPI_DATA.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">{kpi.label}</span>
                <kpi.icon className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-bold">{kpi.value}</span>
                <Badge variant={kpi.positive ? "success" : "destructive"} className="text-xs gap-1">
                  {kpi.positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {kpi.positive ? "+" : ""}{kpi.change}%
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Growth Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Biểu đồ tăng trưởng</CardTitle>
            <p className="text-sm text-muted-foreground">Doanh thu & Học sinh tháng này</p>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={GROWTH_DATA} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="revenue" name="Doanh thu (M)" stroke="#3B82F6" strokeWidth={2} dot={{ r: 4 }} />
                  <Line yAxisId="right" type="monotone" dataKey="students" name="Học sinh" stroke="#10B981" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Distribution Pie Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Tỷ trọng học sinh</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] flex items-center">
              <div className="w-1/2 h-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={DISTRIBUTION_DATA} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" paddingAngle={2}>
                      {DISTRIBUTION_DATA.map((entry) => (<Cell key={entry.name} fill={entry.color} />))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold">1.2K</span>
                  <span className="text-xs text-muted-foreground">TỔNG HỌC SINH</span>
                </div>
              </div>
              <div className="w-1/2 space-y-3">
                {DISTRIBUTION_DATA.map((item) => (
                  <div key={item.name} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.percentage}% • {item.value} học sinh</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Course Performance Table */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">Hiệu suất khóa học chi tiết</CardTitle>
          <Link href="#" className="text-sm text-primary-600 hover:underline">Xem báo cáo chi tiết</Link>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left">
                <th className="p-4 text-xs font-medium text-muted-foreground">KHÓA HỌC</th>
                <th className="p-4 text-xs font-medium text-muted-foreground">LƯỢT ĐĂNG KÝ MỚI</th>
                <th className="p-4 text-xs font-medium text-muted-foreground">TỶ LỆ HOÀN THÀNH</th>
                <th className="p-4 text-xs font-medium text-muted-foreground">DOANH THU THÁNG</th>
              </tr>
            </thead>
            <tbody>
              {COURSE_PERFORMANCE.map((course) => (
                <tr key={course.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", course.type === "video" ? "bg-green-100" : "bg-blue-100")}>
                        {course.type === "video" ? <Play className="w-5 h-5 text-green-600" /> : <Layers className="w-5 h-5 text-blue-600" />}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{course.title}</p>
                        <p className="text-xs text-muted-foreground">{course.type === "video" ? `Video course • ${course.modules} modules` : "Hybrid • Livestream & Video"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4"><span className="font-medium">{course.enrollments}</span> <span className="text-muted-foreground text-sm">học sinh</span></td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <ProgressBar value={course.completion} size="sm" className="w-24" />
                      <span className="text-sm font-medium">{course.completion}%</span>
                    </div>
                  </td>
                  <td className="p-4 font-medium">{formatCurrency(course.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
