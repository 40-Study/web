"use client";

import { Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { validateDiscountPrice, type CourseFormData, type UpdateCourseFormField } from "./course-form-model";

/** Bước "Cài đặt giá" — dùng chung trang tạo và trang sửa khoá. */
export function CoursePricingStep({
  formData,
  update,
  showFeatured = true,
}: {
  formData: CourseFormData;
  update: UpdateCourseFormField;
  // Công tắc "nổi bật" chưa được gửi lên backend ở trang tạo — trang sửa ẩn để không hứa suông.
  showFeatured?: boolean;
}) {
  const price = parseFloat(formData.price) || 0;
  const salePrice = parseFloat(formData.discount_price) || 0;
  const discount = price > 0 && salePrice > 0 && salePrice < price
    ? Math.round(((price - salePrice) / price) * 100)
    : 0;
  // Báo ngay khi gõ (không chờ bấm lưu): backend từ chối 400 DISCOUNT_PRICE_INVALID với giá khuyến mãi
  // <= 0 hoặc >= giá bán, nên để người dùng thấy lý do tại đúng ô nhập.
  const discountError = validateDiscountPrice(formData);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Cài đặt giá</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Thiết lập chi phí và chương trình ưu đãi cho khóa học
        </p>
      </div>

      {/* Pricing Type */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <h3 className="font-medium">Cấu hình giá</h3>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => update("is_free", true)}
              className={cn(
                "rounded-xl border-2 p-4 text-left transition-all",
                formData.is_free
                  ? "border-primary-500 bg-primary-50"
                  : "border-gray-200 hover:border-gray-300"
              )}
            >
              <p className="font-medium">Miễn phí</p>
              <p className="text-sm text-muted-foreground">Tất cả đều có thể học</p>
            </button>
            <button
              type="button"
              onClick={() => update("is_free", false)}
              className={cn(
                "rounded-xl border-2 p-4 text-left transition-all",
                !formData.is_free
                  ? "border-primary-500 bg-primary-50"
                  : "border-gray-200 hover:border-gray-300"
              )}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">Có phí</p>
                  <p className="text-sm text-muted-foreground">Thu phí ghi danh</p>
                </div>
                {!formData.is_free && <Check className="w-5 h-5 text-primary-600 shrink-0" />}
              </div>
            </button>
          </div>

          {!formData.is_free && (
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-2">
                <Label>Giá bán (VNĐ)</Label>
                <Input
                  type="number"
                  placeholder="1200000"
                  value={formData.price}
                  onChange={(e) => update("price", e.target.value)}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label>Giá khuyến mãi (VNĐ)</Label>
                <Input
                  type="number"
                  placeholder="890000"
                  value={formData.discount_price}
                  onChange={(e) => update("discount_price", e.target.value)}
                  className={cn("h-11", discountError && "border-red-500 focus-visible:ring-red-500")}
                  aria-invalid={discountError ? true : undefined}
                  aria-describedby={discountError ? "discount-price-error" : undefined}
                />
                {discountError ? (
                  <p id="discount-price-error" role="alert" className="text-xs text-red-600">
                    {discountError} Muốn bỏ khuyến mãi, hãy để trống ô này.
                  </p>
                ) : (
                  discount > 0 && (
                    <p className="text-xs text-green-600 font-medium">
                      Giảm {discount}%
                    </p>
                  )
                )}
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Hết hạn khuyến mãi</Label>
                <Input
                  type="datetime-local"
                  value={formData.discount_expires_at}
                  onChange={(e) => update("discount_expires_at", e.target.value)}
                  className="h-11 w-full sm:w-64"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Featured */}
      {showFeatured && (
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Khóa học nổi bật</p>
              <p className="text-sm text-muted-foreground">
                Hiển thị trên trang chủ để tăng tiếp cận
              </p>
            </div>
            <Switch
              checked={formData.is_featured}
              onCheckedChange={(v) => update("is_featured", v)}
            />
          </div>
        </CardContent>
      </Card>
      )}
    </div>
  );
}
