"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  Play,
  Radio,
  Layers,
  Check,
  Upload,
  Bold,
  Italic,
  List,
  Link as LinkIcon,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: 1, title: "Thông tin cơ bản", icon: "①" },
  { id: 2, title: "Hình ảnh & Mô tả", icon: "②" },
  { id: 3, title: "Cài đặt giá", icon: "③" },
  { id: 4, title: "Hoàn tất", icon: "④" },
];

const FORMATS = [
  {
    id: "video",
    label: "Video Quay Sẵn",
    description: "Học qua video bài giảng",
    icon: <Play className="w-6 h-6" />,
  },
  {
    id: "livestream",
    label: "Livestream",
    description: "Học trực tiếp qua Zoom/Meet",
    icon: <Radio className="w-6 h-6" />,
  },
  {
    id: "hybrid",
    label: "Hybrid (Kết hợp)",
    description: "Video & Buổi học trực tiếp",
    icon: <Layers className="w-6 h-6" />,
  },
];

export default function CreateCoursePage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    title: "",
    format: "hybrid",
    category: "",
    level: "all",
    shortDescription: "",
    coverImage: null as File | null,
    introVideoUrl: "",
    description: "",
    pricingType: "paid",
    price: "",
    salePrice: "",
    autoEnroll: true,
    startDate: "",
    vouchers: [] as string[],
    featured: false,
  });

  const updateFormData = (key: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSaveDraft = () => {
    // TODO: API call
  };

  const handlePublish = () => {
    // TODO: API call
    router.push("/teacher/courses");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-4">
        <Link
          href="/teacher/courses"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="w-4 h-4" />
          Quay lại
        </Link>
        <h1 className="text-lg font-semibold">Tạo khóa học mới</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSaveDraft}>
            Lưu nháp
          </Button>
          <Button onClick={currentStep === 4 ? handlePublish : handleNext}>
            {currentStep === 4 ? "Tiếp tục" : "Tiếp tục"}
          </Button>
        </div>
      </header>

      <div className="flex">
        {/* Left Sidebar - Progress */}
        <aside className="hidden md:block w-56 border-r bg-white p-6 min-h-[calc(100vh-73px)]">
          <div className="space-y-1">
            {STEPS.map((step, index) => {
              const isCompleted = step.id < currentStep;
              const isCurrent = step.id === currentStep;

              return (
                <div
                  key={step.id}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                    isCurrent && "bg-primary-50 text-primary-700 font-medium",
                    isCompleted && "text-green-600",
                    !isCurrent && !isCompleted && "text-muted-foreground"
                  )}
                >
                  <div
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-xs",
                      isCurrent && "bg-primary-600 text-white",
                      isCompleted && "bg-green-500 text-white",
                      !isCurrent && !isCompleted && "bg-gray-200"
                    )}
                  >
                    {isCompleted ? <Check className="w-3 h-3" /> : step.id}
                  </div>
                  {step.title}
                </div>
              );
            })}
          </div>

          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">TIẾN TRÌNH</p>
            <p className="text-lg font-semibold">{currentStep}/4</p>
            <div className="mt-2 h-1 bg-gray-200 rounded-full">
              <div
                className="h-full bg-primary-600 rounded-full transition-all"
                style={{ width: `${(currentStep / 4) * 100}%` }}
              />
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8 max-w-3xl">
          {currentStep === 1 && (
            <Step1BasicInfo
              formData={formData}
              updateFormData={updateFormData}
            />
          )}
          {currentStep === 2 && (
            <Step2Media formData={formData} updateFormData={updateFormData} />
          )}
          {currentStep === 3 && (
            <Step3Pricing formData={formData} updateFormData={updateFormData} />
          )}
          {currentStep === 4 && (
            <Step4Curriculum formData={formData} updateFormData={updateFormData} />
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="sticky bottom-0 border-t bg-white px-6 py-4">
        <div className="flex justify-between max-w-3xl mx-auto">
          {currentStep > 1 ? (
            <Button variant="ghost" onClick={handleBack}>
              <ChevronLeft className="w-4 h-4 mr-2" />
              Quay lại
            </Button>
          ) : (
            <Button variant="ghost" onClick={() => router.push("/teacher/courses")}>
              Hủy bỏ
            </Button>
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleSaveDraft}>
              Lưu nháp
            </Button>
            {currentStep === 4 ? (
              <Button onClick={handlePublish} className="bg-primary-600">
                Hoàn tất & Xuất bản 🚀
              </Button>
            ) : (
              <Button onClick={handleNext}>Tiếp tục bước kế tiếp</Button>
            )}
          </div>
        </div>
      </footer>

      {/* Tip Banner */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 max-w-2xl w-full px-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
          <span className="text-blue-500">💡</span>
          <p className="text-sm text-blue-700">
            <strong>Mẹo:</strong> Một tiêu đề khóa học rõ ràng và thu hút có thể
            tăng tỷ lệ chuyển đổi học viên lên đến 40%. Hãy chắc chắn rằng bạn
            đã bao hàm những kỹ năng cốt lõi sẽ giảng dạy.
          </p>
        </div>
      </div>
    </div>
  );
}

// Step 1: Basic Info
function Step1BasicInfo({
  formData,
  updateFormData,
}: {
  formData: Record<string, unknown>;
  updateFormData: (key: string, value: unknown) => void;
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Thông tin cơ bản</h2>

      <div className="space-y-2">
        <Label htmlFor="title">
          Tên khóa học <span className="text-red-500">*</span>
        </Label>
        <Input
          id="title"
          placeholder="Ví dụ: Thiết kế UI/UX nâng cao"
          value={formData.title as string}
          onChange={(e) => updateFormData("title", e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Đường dẫn khóa học (slug) sẽ được tạo tự động từ tên này để tối ưu SEO.
        </p>
      </div>

      <div className="space-y-2">
        <Label>
          Định dạng giảng dạy <span className="text-red-500">*</span>
        </Label>
        <div className="grid grid-cols-3 gap-4">
          {FORMATS.map((format) => (
            <Card
              key={format.id}
              className={cn(
                "cursor-pointer transition-all hover:border-primary-300",
                formData.format === format.id &&
                  "border-primary-500 bg-primary-50 ring-1 ring-primary-500"
              )}
              onClick={() => updateFormData("format", format.id)}
            >
              <CardContent className="p-4 text-center">
                <div
                  className={cn(
                    "mx-auto mb-2 w-12 h-12 rounded-full flex items-center justify-center",
                    formData.format === format.id
                      ? "bg-primary-100 text-primary-600"
                      : "bg-gray-100 text-gray-500"
                  )}
                >
                  {format.icon}
                </div>
                <p className="font-medium text-sm">{format.label}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {format.description}
                </p>
                {formData.format === format.id && (
                  <Check className="w-4 h-4 text-primary-600 mx-auto mt-2" />
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Danh mục</Label>
          <Select
            value={formData.category as string}
            onValueChange={(v) => updateFormData("category", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Chọn danh mục" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="programming">Lập trình</SelectItem>
              <SelectItem value="design">Thiết kế</SelectItem>
              <SelectItem value="business">Kinh doanh</SelectItem>
              <SelectItem value="marketing">Marketing</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Trình độ</Label>
          <Select
            value={formData.level as string}
            onValueChange={(v) => updateFormData("level", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Tất cả trình độ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trình độ</SelectItem>
              <SelectItem value="beginner">Người mới bắt đầu</SelectItem>
              <SelectItem value="intermediate">Trung cấp</SelectItem>
              <SelectItem value="advanced">Nâng cao</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Mô tả ngắn</Label>
          <span className="text-xs text-muted-foreground">
            {(formData.shortDescription as string)?.length || 0}/200 KÝ TỰ
          </span>
        </div>
        <Textarea
          placeholder="Tóm tắt ngắn gọn nội dung khóa học để thu hút học viên..."
          value={formData.shortDescription as string}
          onChange={(e) => updateFormData("shortDescription", e.target.value)}
          maxLength={200}
          rows={4}
        />
      </div>
    </div>
  );
}

// Step 2: Media
function Step2Media({
  formData,
  updateFormData,
}: {
  formData: Record<string, unknown>;
  updateFormData: (key: string, value: unknown) => void;
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Hình ảnh & Mô tả</h2>

      <div className="space-y-2">
        <Label>
          Ảnh bìa khóa học <span className="text-red-500">*</span>
        </Label>
        <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary-400 transition-colors cursor-pointer">
          <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm font-medium">Kéo thả ảnh vào đây hoặc click để chọn tệp</p>
          <p className="text-xs text-muted-foreground mt-1">
            Kích thước khuyến nghị: 1280×720px. Định dạng: JPG, PNG. Tối đa 5MB
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Video giới thiệu (URL)</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            🔗
          </span>
          <Input
            className="pl-10"
            placeholder="Ví dụ: https://youtube.com/watch?v=..."
            value={formData.introVideoUrl as string}
            onChange={(e) => updateFormData("introVideoUrl", e.target.value)}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Hỗ trợ link từ YouTube, Vimeo hoặc Google Drive.
        </p>
      </div>

      <div className="space-y-2">
        <Label>
          Mô tả chi tiết <span className="text-red-500">*</span>
        </Label>
        {/* Simple toolbar */}
        <div className="flex gap-1 border rounded-t-lg p-2 bg-gray-50">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Bold className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Italic className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <List className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <LinkIcon className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ImageIcon className="w-4 h-4" />
          </Button>
        </div>
        <Textarea
          className="rounded-t-none min-h-[200px]"
          placeholder="Nhập nội dung mô tả chi tiết khóa học của bạn..."
          value={formData.description as string}
          onChange={(e) => updateFormData("description", e.target.value)}
        />
      </div>
    </div>
  );
}

// Step 3: Pricing
function Step3Pricing({
  formData,
  updateFormData,
}: {
  formData: Record<string, unknown>;
  updateFormData: (key: string, value: unknown) => void;
}) {
  const price = parseFloat(formData.price as string) || 0;
  const salePrice = parseFloat(formData.salePrice as string) || 0;
  const discount = price > 0 && salePrice > 0 ? Math.round(((price - salePrice) / price) * 100) : 0;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Giá & Tiếp thị</h2>
      <p className="text-muted-foreground">
        Thiết lập chi phí và các chương trình ưu đãi cho khóa học của bạn
      </p>

      {/* Pricing Type */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">💰</span>
            <h3 className="font-medium">Cấu hình giá</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Card
              className={cn(
                "cursor-pointer",
                formData.pricingType === "free" && "border-primary-500 bg-primary-50"
              )}
              onClick={() => updateFormData("pricingType", "free")}
            >
              <CardContent className="p-4">
                <p className="font-medium">Miễn phí</p>
                <p className="text-sm text-muted-foreground">
                  Tất cả mọi người đều có thể học
                </p>
              </CardContent>
            </Card>
            <Card
              className={cn(
                "cursor-pointer",
                formData.pricingType === "paid" && "border-primary-500 bg-primary-50"
              )}
              onClick={() => updateFormData("pricingType", "paid")}
            >
              <CardContent className="p-4 flex items-start justify-between">
                <div>
                  <p className="font-medium">Có phí</p>
                  <p className="text-sm text-muted-foreground">
                    Thu phí ghi danh từ học viên
                  </p>
                </div>
                {formData.pricingType === "paid" && (
                  <Check className="w-5 h-5 text-primary-600" />
                )}
              </CardContent>
            </Card>
          </div>

          {formData.pricingType === "paid" && (
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <Label>Giá bán (đ)</Label>
                <Input
                  type="number"
                  placeholder="1.200.000"
                  value={formData.price as string}
                  onChange={(e) => updateFormData("price", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Giá khuyến mãi (đ)</Label>
                <Input
                  type="number"
                  placeholder="890.000"
                  value={formData.salePrice as string}
                  onChange={(e) => updateFormData("salePrice", e.target.value)}
                />
                {discount > 0 && (
                  <p className="text-xs text-green-600">Đã giảm {discount}% tự động áp dụng</p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enrollment Settings */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">📅</span>
            <h3 className="font-medium">Cài đặt ghi danh</h3>
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium">Cho phép ghi danh tự động</p>
              <p className="text-sm text-muted-foreground">
                Học viên sẽ vào học ngay sau khi thanh toán thành công
              </p>
            </div>
            <Switch
              checked={formData.autoEnroll as boolean}
              onCheckedChange={(v) => updateFormData("autoEnroll", v)}
            />
          </div>

          <div className="space-y-2 pt-3 border-t">
            <Label>Ngày bắt đầu khóa học</Label>
            <Input
              type="date"
              value={formData.startDate as string}
              onChange={(e) => updateFormData("startDate", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Marketing */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-lg">🏷️</span>
              <h3 className="font-medium">Tiếp thị & Ưu đãi</h3>
            </div>
            <Button variant="link" className="text-primary-600 p-0 h-auto">
              + THÊM VOUCHER
            </Button>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Mã giảm giá áp dụng</p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="gap-1">
                <input type="checkbox" className="w-3 h-3" />
                SUMMER2026 - Giảm 20% - Mùa hè rực rỡ
              </Badge>
              <Badge variant="outline" className="gap-1">
                <input type="checkbox" className="w-3 h-3" />
                WELCOME40 - Giảm 40% - Thành viên mới
              </Badge>
            </div>
          </div>

          <div className="flex items-center justify-between py-3 mt-4 border-t">
            <div>
              <p className="font-medium">Hiển thị trên mục Khóa học nổi bật</p>
              <p className="text-sm text-muted-foreground">
                Tăng tỷ lệ tiếp cận bằng cách hiển thị tại trang chủ
              </p>
            </div>
            <Switch
              checked={formData.featured as boolean}
              onCheckedChange={(v) => updateFormData("featured", v)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Step 4: Curriculum (simplified)
function Step4Curriculum({
  formData,
  updateFormData,
}: {
  formData: Record<string, unknown>;
  updateFormData: (key: string, value: unknown) => void;
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Chương trình học</h2>
      <p className="text-muted-foreground">
        Sắp xếp cấu trúc khóa học và các học liệu đi kèm.
      </p>

      {/* Chapter 1 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-muted-foreground cursor-move">⋮⋮</span>
            <h3 className="font-medium">Chương 1: Mở đầu & Cài đặt</h3>
          </div>

          {/* Lesson items */}
          <div className="space-y-2 ml-6">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="text-muted-foreground cursor-move">⋮⋮</span>
              <span className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <Play className="w-4 h-4 text-blue-600" />
              </span>
              <div className="flex-1">
                <p className="font-medium text-sm">1.1 Giới thiệu khóa học</p>
                <p className="text-xs text-muted-foreground">Video bài giảng • 12:45</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="text-muted-foreground cursor-move">⋮⋮</span>
              <span className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                <span className="text-orange-600 text-xs">▶</span>
              </span>
              <div className="flex-1">
                <p className="font-medium text-sm">1.2 Thực hành: Tạo Component đầu tiên</p>
                <p className="text-xs text-muted-foreground">Sandbox IDE Practice</p>
              </div>
            </div>
          </div>

          <Button variant="ghost" className="w-full mt-4 text-muted-foreground">
            + Thêm bài học mới
          </Button>
        </CardContent>
      </Card>

      {/* Chapter 2 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-muted-foreground cursor-move">⋮⋮</span>
            <h3 className="font-medium">Chương 2: JSX và Props</h3>
          </div>

          <div className="space-y-2 ml-6">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="text-muted-foreground cursor-move">⋮⋮</span>
              <span className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <Play className="w-4 h-4 text-blue-600" />
              </span>
              <div className="flex-1">
                <p className="font-medium text-sm">2.1 Cú pháp JSX và Rendering</p>
                <p className="text-xs text-muted-foreground">Video bài giảng • 18:20</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="text-muted-foreground cursor-move">⋮⋮</span>
              <span className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="w-4 h-4 text-green-600" />
              </span>
              <div className="flex-1">
                <p className="font-medium text-sm">2.2 Trắc nghiệm kiến thức JSX</p>
                <p className="text-xs text-muted-foreground">Quiz • 10 câu hỏi</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="text-muted-foreground cursor-move">⋮⋮</span>
              <span className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                <span className="text-red-600 text-xs">📄</span>
              </span>
              <div className="flex-1">
                <p className="font-medium text-sm">2.3 Tài liệu: Cheat sheet Props & State</p>
                <p className="text-xs text-muted-foreground">PDF Document • 1.2 MB</p>
              </div>
            </div>
          </div>

          <Button variant="ghost" className="w-full mt-4 text-muted-foreground">
            + Thêm bài học mới
          </Button>
        </CardContent>
      </Card>

      {/* Add Chapter */}
      <Card className="border-dashed">
        <CardContent className="p-6 text-center">
          <Button variant="ghost" className="text-muted-foreground">
            <span className="mr-2">+</span>
            Thêm chương nội dung mới
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
