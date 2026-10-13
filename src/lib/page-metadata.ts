/**
 * Metadata theo từng trang công khai (PG-M1, QA2 261013).
 *
 * Vì sao cần helper: trang con chỉ đặt `title` thì og:title vẫn là mặc định toàn site ("ForteX — Learn Leap Lead")
 * nên mọi link chia sẻ trông giống nhau. Ngược lại, `openGraph` ở trang con THAY HẲN `openGraph` của root
 * (Next chỉ merge nông), nên helper phải mang theo siteName/locale/ảnh mặc định, nếu không link mất ảnh.
 */
import type { Metadata } from "next";
import { SITE_URL } from "@/lib/seo";

export const SITE_NAME = "ForteX";
export const SITE_LOCALE = "vi_VN";
export const SITE_OG_IMAGES = [{ url: "/logo.png", width: 512, height: 512, alt: SITE_NAME }];

type OgImage = { url: string; width?: number; height?: number; alt?: string };

export interface PageMetadataInput {
  /** Tiêu đề trang; template "%s | ForteX" ở root tự nối tên site vào <title>. */
  title: string;
  description: string;
  /** Đường dẫn nội bộ bắt đầu bằng "/", không kèm query. Dùng cho canonical và og:url. */
  path: string;
  type?: "website" | "article";
  /** Ảnh riêng của trang; bỏ qua thì dùng logo site. */
  images?: OgImage[];
}

export function buildPageMetadata({
  title,
  description,
  path,
  type = "website",
  images,
}: PageMetadataInput): Metadata {
  const ogImages = images ?? SITE_OG_IMAGES;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type,
      siteName: SITE_NAME,
      locale: SITE_LOCALE,
      title,
      description,
      url: `${SITE_URL}${path}`,
      images: ogImages,
    },
    twitter: {
      card: images ? "summary_large_image" : "summary",
      title,
      description,
      images: ogImages.map((image) => image.url),
    },
  };
}

/** HTML -> đoạn mô tả thuần chữ (≤ `max` ký tự, cắt ở ranh giới từ khi có thể) cho meta description. */
export function plainTextExcerpt(html: string, max = 160): string {
  const text = html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  const base = lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut;
  return `${base.trimEnd()}…`;
}
