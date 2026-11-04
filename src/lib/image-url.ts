/**
 * Ảnh nào `next/image` được phép tối ưu hoá. Phải khớp `images.remotePatterns` trong next.config.mjs
 * (https mọi host; http chỉ `localhost` KHÔNG cổng). Host khác (vd. MinIO nội bộ http://172.18.0.4:9000)
 * làm `next/image` NÉM lỗi "hostname is not configured" và sập cả trang — nên phải kiểm trước khi dùng.
 */
export function isOptimizableImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  // Đường dẫn gốc cùng origin ("/x.png"); "//host/x.png" là URL tuyệt đối theo giao thức => không tính.
  if (url.startsWith("/") && !url.startsWith("//")) return true;
  if (url.startsWith("blob:") || url.startsWith("data:")) return true;
  try {
    const { protocol, hostname, port } = new URL(url);
    if (protocol === "https:") return true;
    return protocol === "http:" && hostname === "localhost" && port === "";
  } catch {
    return false;
  }
}
