"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, Plus, Users, Star, Play, Radio, Layers, FileEdit, Loader2, Trash2 } from "lucide-react";
import { useMyCourses, useDeleteCourse } from "@/hooks/queries/use-courses";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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

/** Map API course to local Course type + calculate progress */
function mapApiCourse(c: { id: string; title: string; short_description?: string; description?: string; thumbnail_url?: string; status?: string; total_students?: number; average_rating?: number | string; price?: number | string; discount_price?: number | string; is_featured?: boolean; is_free?: boolean; objectives?: string[]; requirements?: string[] }): Course {
  const status = c.status === "published" ? "published" : c.status === "archived" ? "archived" : "draft";

  // Calculate completion progress for drafts
  const checks = [
    !!c.title,
    !!c.short_description,
    !!c.description,
    !!c.thumbnail_url,
    c.is_free || (Number(c.price) > 0),
    (c.objectives?.length ?? 0) > 0,
  ];
  const done = checks.filter(Boolean).length;
  const progress = Math.round((done / checks.length) * 100);

  const missing: string[] = [];
  if (!c.description) missing.push("mô tả chi tiết");
  if (!c.thumbnail_url) missing.push("ảnh bìa");
  if (!c.is_free && !Number(c.price)) missing.push("giá bán");

  return {
    id: c.id,
    title: c.title,
    thumbnail: c.thumbnail_url,
    type: "video",
    status,
    students: c.total_students || 0,
    rating: Number(c.average_rating) || 0,
    price: Number(c.price) || 0,
    salePrice: c.discount_price ? Number(c.discount_price) : undefined,
    isBestSeller: c.is_featured,
    progress,
    missingItems: missing.length > 0 ? `Thiếu: ${missing.join(", ")}` : undefined,
  };
}

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

function CourseCard({ course, onDelete }: { course: Course; onDelete: (id: string) => void }) {
  const isDraft = course.status === "draft";
  const canDelete = isDraft || course.students === 0;

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!canDelete) {
      toast.error("Không thể xóa khóa học đã có học viên đăng ký");
      return;
    }
    if (confirm(`Bạn có chắc muốn xóa khóa học "${course.title}"?`)) {
      onDelete(course.id);
    }
  };

  return (
    <Card className={cn("overflow-hidden hover:shadow-md transition-shadow group", isDraft && "border-dashed")}>
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gray-100">
        {course.thumbnail ? (
          <Image src={course.thumbnail} alt={course.title} fill className="object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
            <FileEdit className="w-8 h-8 text-gray-200" />
          </div>
        )}
        <div className="absolute top-2 left-2">
          <CourseTypeBadge type={course.type} />
        </div>
        {isDraft && (
          <Badge className="absolute top-2 right-2 bg-orange-100 text-orange-700 border-orange-200 text-[10px]">
            BẢN NHÁP
          </Badge>
        )}
        {course.isBestSeller && !isDraft && (
          <Badge className="absolute top-2 right-2 bg-orange-500 text-white text-[10px]">
            BÁN CHẠY
          </Badge>
        )}
        {/* Delete button */}
        {canDelete && (
          <button
            onClick={handleDelete}
            className="absolute bottom-2 right-2 p-1.5 rounded-full bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
            title="Xóa khóa học"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <CardContent className="p-3 space-y-2">
        <h3 className="font-semibold text-sm line-clamp-2 min-h-[40px]">{course.title}</h3>

        {/* Stats row — only for published */}
        {!isDraft && (
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
              {course.rating.toFixed(1)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {course.students}
            </span>
            <span className="ml-auto font-medium text-gray-900">
              {course.price ? formatCurrency(course.price) : "Miễn phí"}
            </span>
          </div>
        )}

        {/* Missing items for draft */}
        {isDraft && course.missingItems && (
          <p className="text-[11px] text-orange-600">{course.missingItems}</p>
        )}

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-1.5 pt-1">
          {isDraft ? (
            <>
              <Button size="sm" variant="outline" className="w-full text-xs h-8" asChild>
                <Link href={`/teacher/courses/${course.id}`}>Phát hành</Link>
              </Button>
              <Button size="sm" className="w-full text-xs h-8" asChild>
                <Link href={`/teacher/courses/${course.id}/edit`}>Tiếp tục sửa</Link>
              </Button>
            </>
          ) : (
            <>
              <Button size="sm" variant="outline" className="w-full text-xs h-8" asChild>
                <Link href={`/teacher/courses/${course.id}/members`}>Thành viên</Link>
              </Button>
              <Button size="sm" className="w-full text-xs h-8" asChild>
                <Link href={`/teacher/courses/${course.id}`}>Chi tiết</Link>
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function TeacherCoursesPage() {
  const [activeTab, setActiveTab] = useState<CourseStatus>("published");
  const [searchQuery, setSearchQuery] = useState("");
  const [formatFilter, setFormatFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const { data: apiCourses, isLoading } = useMyCourses();
  const deleteCourse = useDeleteCourse();
  const courses = useMemo(() => (apiCourses || []).map(mapApiCourse), [apiCourses]);

  const handleDeleteCourse = (id: string) => {
    deleteCourse.mutate(id);
  };

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
                {formatFilter === "all" ? "Tất cả định dạng" : <SelectValue />}
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả định dạng</SelectItem>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="livestream">Livestream</SelectItem>
                <SelectItem value="hybrid">Kết hợp</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[140px]">
                {sortBy === "newest" ? "Mới nhất" : <SelectValue />}
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
                <CourseCard key={course.id} course={course} onDelete={handleDeleteCourse} />
              ))}
            </div>
          ) : (
            <EmptyState message="Không có khóa học đang xuất bản" />
          )}
        </TabsContent>

        <TabsContent value="draft" className="mt-6">
          {filteredCourses.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredCourses.map((course) => (
                <CourseCard key={course.id} course={course} onDelete={handleDeleteCourse} />
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
