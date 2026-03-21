"use client";

import { Users, BookOpen, GraduationCap, TrendingUp } from "lucide-react";
import { StatsCard } from "@/components/dashboard/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
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

const enrollmentData = [
  { month: "Tháng 1", students: 120 },
  { month: "Tháng 2", students: 150 },
  { month: "Tháng 3", students: 180 },
  { month: "Tháng 4", students: 220 },
  { month: "Tháng 5", students: 270 },
  { month: "Tháng 6", students: 310 },
];

const completionData = [
  { course: "Python Cơ bản", rate: 85 },
  { course: "Web Frontend", rate: 72 },
  { course: "Data Science", rate: 68 },
  { course: "Thuật toán", rate: 90 },
];

const distributionData = [
  { name: "Tiểu học", value: 400 },
  { name: "THCS", value: 300 },
  { name: "THPT", value: 200 },
  { name: "Đại học/Khác", value: 100 },
];

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

export default function TeacherAnalyticsPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Thống kê & Phân tích</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Tổng học sinh"
          value="1,234"
          change={12.5}
          icon={<Users className="h-5 w-5" />}
        />
        <StatsCard
          title="Khóa học đang mở"
          value="15"
          change={0}
          icon={<BookOpen className="h-5 w-5" />}
        />
        <StatsCard
          title="Tỷ lệ hoàn thành (TB)"
          value="78%"
          change={5.2}
          icon={<GraduationCap className="h-5 w-5" />}
        />
        <StatsCard
          title="Doanh thu ước tính"
          value="45M ₫"
          change={8.4}
          icon={<TrendingUp className="h-5 w-5" />}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle>Xu hướng đăng ký (6 tháng gần nhất)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={enrollmentData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="students"
                    name="Số lượng đăng ký"
                    stroke="#8884d8"
                    activeDot={{ r: 8 }}
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tỷ lệ hoàn thành theo khóa học (%)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={completionData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="course" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="rate" name="Tỷ lệ (%)" fill="#82ca9d" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Phân bố học sinh</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {distributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
