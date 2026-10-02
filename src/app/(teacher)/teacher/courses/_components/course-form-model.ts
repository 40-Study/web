/**
 * Mô hình form thông tin khoá học — dùng CHUNG cho trang tạo khoá và trang sửa khoá
 * (QA vòng 2, D1: trang /edit trước đây chỉ redirect, giáo viên không sửa được mô tả/giá/ảnh).
 */

import type { ApiCourse, UpdateCourseDTO } from "@/services/course.service";

export const LEVELS = [
  { value: "all", label: "Tất cả trình độ" },
  { value: "beginner", label: "Người mới bắt đầu" },
  { value: "intermediate", label: "Trung cấp" },
  { value: "advanced", label: "Nâng cao" },
];

export interface CourseFormData {
  title: string;
  format: string;
  category_id: string;
  level: string;
  short_description: string;
  // Hình ảnh & mô tả
  thumbnail_file: File | null;
  thumbnail_preview: string;
  thumbnail_url: string;
  preview_video_file: File | null;
  preview_video_url: string;
  video_upload_id: string;
  description: string;
  objectives: string[];
  requirements: string[];
  target_audience: string[];
  // Giá
  is_free: boolean;
  price: string;
  discount_price: string;
  discount_expires_at: string;
  is_featured: boolean;
  // Khác
  language: string;
  tag_ids: string[];
}

export const initialCourseFormData: CourseFormData = {
  title: "",
  format: "hybrid",
  category_id: "",
  level: "all",
  short_description: "",
  thumbnail_file: null,
  thumbnail_preview: "",
  thumbnail_url: "",
  preview_video_file: null,
  preview_video_url: "",
  video_upload_id: "",
  description: "",
  objectives: [""],
  requirements: [""],
  target_audience: [""],
  is_free: false,
  price: "",
  discount_price: "",
  discount_expires_at: "",
  is_featured: false,
  language: "vi",
  tag_ids: [],
};

export type UpdateCourseFormField = <K extends keyof CourseFormData>(
  key: K,
  value: CourseFormData[K]
) => void;

// Backend chỉ nhận beginner|intermediate|advanced|all_levels (UpdateCourseDTO validate oneof);
// form dùng "all" cho nhãn "Tất cả trình độ".
const API_ALL_LEVELS = "all_levels";

/** Câu báo lỗi giá khuyến mãi — khớp quy tắc backend: 0 < discount_price < price (DISCOUNT_PRICE_INVALID). */
export const DISCOUNT_PRICE_ERROR = "Giá khuyến mãi phải lớn hơn 0 và thấp hơn giá bán.";

/**
 * Kiểm giá khuyến mãi của form theo đúng quy tắc backend (0 < giá khuyến mãi < giá bán).
 * Trả câu lỗi, hoặc null khi hợp lệ. Ô khuyến mãi để trống (hoặc khoá miễn phí) là hợp lệ: không có
 * khuyến mãi. Số 0 KHÔNG phải cách xoá khuyến mãi — để trống ô. Dùng chung trang tạo, trang sửa và
 * ô nhập ở bước "Cài đặt giá" để cả ba cùng một luật.
 */
export function validateDiscountPrice(form: Pick<CourseFormData, "is_free" | "price" | "discount_price">): string | null {
  const text = form.discount_price.trim();
  if (form.is_free || text === "") return null;
  const discount = Number(text);
  const price = Number(form.price);
  if (!Number.isFinite(discount) || discount <= 0) return DISCOUNT_PRICE_ERROR;
  if (!Number.isFinite(price) || discount >= price) return DISCOUNT_PRICE_ERROR;
  return null;
}

/** Giá trị số từ API có thể là chuỗi decimal ("1200000.00") — "" khi không có/không hợp lệ. */
function numberText(value: number | string | undefined | null): string {
  if (value === undefined || value === null || value === "") return "";
  const n = Number(value);
  return Number.isFinite(n) ? String(n) : "";
}

/** "2026-10-01T10:00:00+07:00" -> "2026-10-01T10:00" theo giờ máy (đúng định dạng input datetime-local). */
function toDateTimeLocal(iso: string | undefined | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Danh sách rỗng vẫn cần 1 ô trống để người dùng nhập. */
function editableList(list: string[] | undefined): string[] {
  return list && list.length > 0 ? [...list] : [""];
}

/** Điền sẵn form sửa từ khoá hiện có. */
export function courseToFormData(course: ApiCourse): CourseFormData {
  return {
    ...initialCourseFormData,
    title: course.title ?? "",
    category_id: course.category_id ?? course.category?.id ?? "",
    level: !course.level || course.level === API_ALL_LEVELS ? "all" : course.level,
    short_description: course.short_description ?? "",
    thumbnail_preview: course.thumbnail_url ?? "",
    thumbnail_url: course.thumbnail_url ?? "",
    preview_video_url: course.preview_video_url ?? "",
    description: course.description ?? "",
    objectives: editableList(course.objectives),
    requirements: editableList(course.requirements),
    target_audience: editableList(course.target_audience),
    is_free: !!course.is_free,
    price: course.is_free ? "" : numberText(course.price),
    discount_price: numberText(course.discount_price),
    discount_expires_at: toDateTimeLocal(course.discount_expires_at),
    language: course.language || "vi",
  };
}

export type CourseUpdateResult = { payload: UpdateCourseDTO; error?: undefined } | { payload?: undefined; error: string };

/**
 * Dựng body PUT /courses/:id từ form sửa.
 *
 * Chuỗi rỗng được GỬI (không `|| undefined`): người dùng xoá trắng mô tả thì phải lưu rỗng —
 * cùng lớp lỗi với D5 (tiểu sử). Backend coi field vắng mặt là "giữ nguyên".
 *
 * Giá khuyến mãi có 3 trạng thái ở backend: vắng mặt = giữ nguyên, `null` = XOÁ (kèm hạn khuyến
 * mãi), số = đặt giá mới. Ô trống khi khoá ĐANG có khuyến mãi (hoặc chuyển sang miễn phí) => gửi
 * `null`; ô trống khi vốn không có khuyến mãi => không gửi gì. Không dùng 0 để "xoá": nó biến giá
 * phải trả thành 0đ.
 */
export function buildCourseUpdatePayload(form: CourseFormData, original: ApiCourse): CourseUpdateResult {
  const title = form.title.trim();
  if (title.length < 2) return { error: "Tên khoá học tối thiểu 2 ký tự." };

  const price = form.is_free ? 0 : Number(form.price);
  if (!form.is_free && (!form.price.trim() || !Number.isFinite(price) || price <= 0)) {
    return { error: "Vui lòng nhập giá bán lớn hơn 0 hoặc chọn Miễn phí." };
  }

  const hadDiscount = numberText(original.discount_price) !== "";
  const discountText = form.is_free ? "" : form.discount_price.trim();
  const clearDiscount = hadDiscount && discountText === "";
  const discountError = validateDiscountPrice(form);
  if (discountError) return { error: discountError };
  const discountPrice = discountText !== "" ? Number(discountText) : undefined;

  const payload: UpdateCourseDTO = {
    title,
    short_description: form.short_description,
    description: form.description,
    thumbnail_url: form.thumbnail_url,
    preview_video_url: form.preview_video_url,
    level: form.level === "all" ? API_ALL_LEVELS : form.level,
    language: form.language,
    is_free: form.is_free,
    price,
    objectives: form.objectives.map((s) => s.trim()).filter(Boolean),
    requirements: form.requirements.map((s) => s.trim()).filter(Boolean),
    target_audience: form.target_audience.map((s) => s.trim()).filter(Boolean),
  };
  if (form.category_id) payload.category_id = form.category_id;
  if (clearDiscount) payload.discount_price = null;
  else if (discountPrice !== undefined) payload.discount_price = discountPrice;
  // Đang xoá khuyến mãi thì bỏ luôn hạn (backend xoá cả hai); hạn không gắn với giá nào vô nghĩa.
  if (form.discount_expires_at && !clearDiscount) payload.discount_expires_at = new Date(form.discount_expires_at).toISOString();
  return { payload };
}
