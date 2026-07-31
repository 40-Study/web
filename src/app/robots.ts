import type { MetadataRoute } from "next";
import { SITE_URL, DISALLOWED_PATH_PREFIXES } from "@/lib/seo";

/**
 * Lưu ý về `/certificates/verify`:
 * disallow ghi là "/certificates/verify/" — CÓ dấu / cuối. Robots.txt khớp
 * theo tiền tố, nên rule đó chặn các trang kết quả theo mã
 * (/certificates/verify/CERT-123, chứa dữ liệu cá nhân) nhưng KHÔNG chặn
 * trang form "/certificates/verify". Bỏ dấu / cuối là vô tình chặn cả form.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [...DISALLOWED_PATH_PREFIXES],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
