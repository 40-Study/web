import type { MetadataRoute } from "next";

/**
 * Web App Manifest — cho phép "Thêm vào màn hình chính" trên mobile.
 *
 * Phạm vi CỐ TÌNH giới hạn ở metadata: KHÔNG có service worker, không offline.
 * Đó là hạng mục riêng, lớn hơn nhiều (cache strategy, invalidation, cập nhật
 * phiên bản) và không nằm trong phase SEO này.
 *
 * public/ hiện chỉ có logo.png (44KB). Chưa có icon 192/512 chuyên dụng nên
 * dùng tạm logo cho cả hai cỡ — trình duyệt sẽ tự co giãn. Nên thay bằng icon
 * đúng kích thước khi có asset thiết kế.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ForteX — Learn Leap Lead",
    short_name: "ForteX",
    description:
      "Nền tảng học tập và quản lý hiện đại: khóa học, lớp học trực tuyến, bài tập và chứng chỉ.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    lang: "vi",
    icons: [
      { src: "/logo.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/logo.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
