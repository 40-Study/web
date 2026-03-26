"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, Plus, Users, Star, Play, Radio, Layers, FileEdit } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ProgressBar } from "@/components/ui/progress-bar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn, formatCurrency } from "@/lib/utils";

type CourseStatus = "published" | "draft" | "archived";
type CourseType = "video" | "livestream" | "hybrid";

interface Course {
  id: string;
  title: string;
  thumbnail?: string;
  type: CourseType;
  status: CourseStatus;
  students: number;
  rating: number;
  price: number;
  salePrice?: number;
  isBestSeller?: boolean;
  progress?: number;
  missingItems?: string;
}

const MOCK_COURSES: Course[] = [
  {
    id: "1",
    title: "Xây dựng API với Go Fiber cho doanh nghiệp",
    type: "video",
    status: "published",
    students: 1248,
    rating: 4.8,
    price: 85500000,
    isBestSeller: true,
  },
  {
    id: "2",
    title: "Mastering Python for Data Science 2026",
    type: "video",
    status: "published",
    students: 5409,
    rating: 4.9,
    price: 162200000,
    salePrice: 142200000,
  },
  {
    id: "3",
    title: "JavaScript Pro: From Zero to Senior Engineer",
    type: "hybrid",
    status: "published",
    students: 5309,
    rating: 4.7,
    price: 205500000,
  },
  {
    id: "4",
    title: "Chủ đề thi AWS Solutions Architect Associate C03",
    type: "livestream",
    status: "published",
    students: 456,
    rating: 4.6,
    price: 12400000,
  },
  {
    id: "5",
    title: "Trại huấn luyện Fullstack 2026",
    type: "hybrid",
    status: "draft",
    students: 0,
    rating: 0,
    price: 0,
    progress: 60,
    missingItems: "Thiếu 4 video & 2 bài tập",
  },
  {
    id: "6",
    title: "Next.js 15 & App Router",
    type: "video",
    status: "draft",
    students: 0,
    rating: 0,
    price: 0,
    progress: 25,
    missingItems: "Thiếu 12 video & nội dung chương trình",
  },
];

const TYPE_CONFIG: Record<CourseType, { label: string; icon: React.ReactNode; color: string }> = {
  video: { label: "VIDEO", icon: <Play className="w-3 h-3" />, color: "bg-green-500" },
  livestream: { label: "LIVESTREAM", icon: <Radio className="w-3 h-3" />, color: "bg-red-500" },
  hybrid: { label: "HYBRID", icon: <Layers className="w-3 h-3" />, color: "bg-blue-600" },
};

function CourseTypeBadge({ type }: { type: CourseType }) {
  const config = TYPE_CONFIG[type];
  return (
    <Badge className={cn("gap-1 text-white text-[10px]", config.color)}>
      {config.icon}
      {config.label}
    </Badge>
  );
}

function PublishedCourseCard({ course }: { course: Course }) {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gray-800">
        {course.thumbnail ? (
          <Image src={course.thumbnail} alt={course.title} fill className="object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-4xl font-bold text-white/20">40</div>
          </div>
        )}
        {/* Badges */}
        <div className="absolute top-2 left-2 flex gap-2">
          <CourseTypeBadge type={course.type} />
        </div>
        {course.isBestSeller && (
          <Badge className="absolute top-2 right-2 bg-orange-500 text-white text-[10px]">
            BÁN CHẠY
          </Badge>
        )}
      </div>

      <CardContent className="p-4 space-y-3">
        <h3 className="font-semibold line-clamp-2 min-h-[48px]">{course.title}</h3>

        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            {course.rating.toFixed(1)}
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            {course.students.toLocaleString()}
          </span>
        </div>

        <div className="flex items-baseline gap-2">
          {course.salePrice ? (
            <>
              <span className="text-lg font-bold text-primary-600">
                {formatCurrency(course.salePrice)}
              </span>
              <span className="text-sm text-muted-foreground line-through">
                {formatCurrency(course.price)}
              </span>
            </>
          ) : (
            <span className="text-lg font-bold">{formatCurrency(course.price)}</span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" className="w-full" asChild>
            <Link href={`/teacher/courses/${course.id}/members`}>Thành viên</Link>
          </Button>
          <Button variant="default" className="w-full" asChild>
            <Link href={`/teacher/courses/${course.id}`}>Xem chi tiết</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function DraftCourseCard({ course }: { course: Course }) {
  return (
    <Card className="overflow-hidden border-dashed">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <CourseTypeBadge type={course.type} />
          <Badge variant="warning" className="bg-orange-100 text-orange-700 border-orange-200">
            BẢN NHÁP
          </Badge>
        </div>

        {/* Placeholder thumbnail */}
        <div className="flex items-center justify-center h-24 bg-gray-100 rounded-lg mb-4">
          <FileEdit className="w-10 h-10 text-gray-300" />
        </div>

        <h3 className="font-semibold text-lg mb-4">{course.title}</h3>

        {/* Progress */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">TIẾN ĐỘ HOÀN THIỆN</span>
            <span className="font-medium text-primary-600">{course.progress}%</span>
          </div>
          <ProgressBar value={course.progress || 0} size="sm" />
        </div>

        {/* Missing items */}
        {course.missingItems && (
          <div className="flex items-center gap-2 text-sm text-orange-600 bg-orange-50 rounded-lg p-3 mb-4">
            <span className="w-4 h-4 rounded-full border-2 border-orange-400" />
            {course.missingItems}
          </div>
        )}

        <Button className="w-full" asChild>
          <Link href={`/teacher/courses/${course.id}/edit`}>
            <FileEdit className="w-4 h-4 mr-2" />
            Tiếp tục soạn thảo
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export default function TeacherCoursesPage() {
  const [activeTab, setActiveTab] = useState<CourseStatus>("published");
  const [searchQuery, setSearchQuery] = useState("");
  const [formatFilter, setFormatFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const courses = MOCK_COURSES;

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const matchesTab = course.status === activeTab;
      const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFormat = formatFilter === "all" || course.type === formatFilter;
      return matchesTab && matchesSearch && matchesFormat;
    });
  }, [courses, activeTab, searchQuery, formatFilter]);

  const counts = useMemo(() => ({
    published: courses.filter((c) => c.status === "published").length,
    draft: courses.filter((c) => c.status === "draft").length,
    archived: courses.filter((c) => c.status === "archived").length,
  }), [courses]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">Khóa học của tôi</h1>
        <Button asChild>
          <Link href="/teacher/courses/create" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Tạo khóa học mới
          </Link>
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as CourseStatus)}>
        <TabsList>
          <TabsTrigger value="published">Đang xuất bản ({counts.published})</TabsTrigger>
          <TabsTrigger value="draft">Bản nháp ({counts.draft})</TabsTrigger>
          <TabsTrigger value="archived">Lưu trữ ({counts.archived})</TabsTrigger>
        </TabsList>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mt-4">
          <div className="relative w-full md:w-96">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-muted-foreground" />
            </div>
            <Input
              type="text"
              placeholder="Tìm kiếm khóa học..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <Select value={formatFilter} onValueChange={setFormatFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Định dạng" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="livestream">Livestream</SelectItem>
                <SelectItem value="hybrid">Hybrid</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Sắp xếp" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Mới nhất</SelectItem>
                <SelectItem value="oldest">Cũ nhất</SelectItem>
                <SelectItem value="students">Học viên</SelectItem>
                <SelectItem value="rating">Đánh giá</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Content */}
        <TabsContent value="published" className="mt-6">
          {filteredCourses.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredCourses.map((course) => (
                <PublishedCourseCard key={course.id} course={course} />
              ))}
            </div>
          ) : (
            <EmptyState message="Không có khóa học đang xuất bản" />
          )}
        </TabsContent>

        <TabsContent value="draft" className="mt-6">
          {filteredCourses.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2">
              {filteredCourses.map((course) => (
                <DraftCourseCard key={course.id} course={course} />
              ))}
            </div>
          ) : (
            <EmptyState message="Không có bản nháp nào" />
          )}
        </TabsContent>

        <TabsContent value="archived" className="mt-6">
          <EmptyState message="Không có khóa học lưu trữ" />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg border-dashed">
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}
