/**
 * Slug không dấu từ tên, cùng quy tắc `utils.GenerateSlug` của backend (bỏ dấu tiếng Việt, đ -> d, chữ thường,
 * ký tự lạ bỏ, khoảng trắng -> "-"). Chỉ dùng làm DỰ PHÒNG khi API thiếu `slug`: khoá học mang `category.slug`
 * không dấu ("lap-trinh-web"), nên slug dự phòng có dấu ("lập-trình-web") làm chip lọc danh mục ra 0 kết quả
 * âm thầm (A-01, review R1 MINOR 2).
 */
export function slugifyName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/^-+|-+$/g, "");
}