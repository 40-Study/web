"use client";

import { useState } from "react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type ClassStatus = "ongoing" | "ended";

interface ClassItem {
  id: string;
  name: string;
  code: string;
  student_count: number;
  teacher_count: number;
  status: ClassStatus;
}

const MOCK_CLASSES: ClassItem[] = [
  {
    id: "cls_1",
    name: "Lớp Lập trình Python Cơ bản",
    code: "PYTHON-01",
    student_count: 24,
    teacher_count: 2,
    status: "ongoing",
  },
  {
    id: "cls_2",
    name: "Lớp Lập trình Web Frontend",
    code: "WEB-02",
    student_count: 30,
    teacher_count: 1,
    status: "ongoing",
  },
  {
    id: "cls_3",
    name: "Lớp Thuật toán Nâng cao",
    code: "ALGO-01",
    student_count: 15,
    teacher_count: 1,
    status: "ended",
  },
  {
    id: "cls_4",
    name: "Lớp Data Science",
    code: "DATA-03",
    student_count: 20,
    teacher_count: 2,
    status: "ended",
  },
];

export default function TeacherClassesPage() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const filteredClasses = MOCK_CLASSES.filter((cls) => {
    const matchesSearch =
      cls.name.toLowerCase().includes(search.toLowerCase()) ||
      cls.code.toLowerCase().includes(search.toLowerCase());

    const matchesTab =
      activeTab === "all" ||
      (activeTab === "ongoing" && cls.status === "ongoing") ||
      (activeTab === "ended" && cls.status === "ended");

    return matchesSearch && matchesTab;
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý lớp học</h1>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
          <TabsList>
            <TabsTrigger value="all">Tất cả</TabsTrigger>
            <TabsTrigger value="ongoing">Đang diễn ra</TabsTrigger>
            <TabsTrigger value="ended">Đã kết thúc</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="w-full sm:w-72">
          <Input
            type="search"
            placeholder="Tìm kiếm theo tên, mã lớp..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredClasses.map((cls) => (
          <Link
            key={cls.id}
            href={`/teacher/classes`}
            className="flex flex-col justify-between rounded-xl border bg-white p-5 shadow-sm transition-all hover:shadow-md"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-gray-900 line-clamp-2">{cls.name}</h3>
                <Badge
                  variant={cls.status === "ongoing" ? "success" : "secondary"}
                  className="shrink-0"
                >
                  {cls.status === "ongoing" ? "Đang diễn ra" : "Đã kết thúc"}
                </Badge>
              </div>
              <p className="mt-1 font-mono text-sm text-gray-500">{cls.code}</p>
            </div>

            <div className="mt-6 flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1.5">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-gray-400"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                <span>{cls.student_count} học sinh</span>
              </div>
              <div className="flex items-center gap-1.5">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-gray-400"
                >
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                </svg>
                <span>{cls.teacher_count} giáo viên</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {filteredClasses.length === 0 && (
        <div className="rounded-xl border border-dashed py-12 text-center">
          <p className="text-gray-500">Không tìm thấy lớp học nào phù hợp.</p>
        </div>
      )}
    </div>
  );
}
