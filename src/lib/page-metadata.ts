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

/** Template tiêu đề tab của root layout (`app/layout.tsx`). */
export const SITE_TITLE_TEMPLATE = `%s | ${SITE_NAME}`;

/**
 * Tiêu đề cho layout CÓ ROUTE CON (QA-A-07/A-08, 10/11/2026).
 *
 * Vì sao: Next 14 chỉ truyền xuống segment con `title.template` của layout gần nhất
 * (`resolve-metadata.js`: `titleTemplates.title = resolvedMetadata.title?.template || null`).
 * Layout đặt `title` là CHUỖI thì template thành null, nên mọi trang con (chi tiết khoá học,
 * cuộc thi, kết quả tra cứu chứng chỉ...) mất hậu tố " | ForteX". Dạng object giữ template.
 */
export function sectionTitle(title: string): { default: string; template: string } {
  return { default: title, template: SITE_TITLE_TEMPLATE };
}

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
  /** Layout có route con: giữ template cho trang con (xem `sectionTitle`). */
  hasChildRoutes?: boolean;
}

export function buildPageMetadata({
  title,
  description,
  path,
  type = "website",
  images,
  hasChildRoutes = false,
}: PageMetadataInput): Metadata {
  const ogImages = images ?? SITE_OG_IMAGES;
  return {
    title: hasChildRoutes ? sectionTitle(title) : title,
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

const NAMED_ENTITIES: Readonly<Record<string, string>> = {
  nbsp: " ",
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
};

/**
 * Giải mã entity HTML thường gặp trong MỘT lượt (không giải mã lại kết quả: "&amp;lt;" -> "&lt;", không phải "<").
 * Next tự escape giá trị khi in ra `<meta>`; để nguyên "&amp;" thì meta thành "&amp;amp;" (escape hai lần).
 * Entity lạ hoặc số ngoài dải Unicode được giữ nguyên.
 */
function decodeHtmlEntities(text: string): string {
  return text.replace(/&(?:#(\d+)|#[xX]([0-9a-fA-F]+)|([a-zA-Z]+));/g, (whole, dec, hex, name) => {
    if (name) return NAMED_ENTITIES[name] ?? whole;
    const codePoint = dec ? Number.parseInt(dec, 10) : Number.parseInt(hex, 16);
    return codePoint > 0 && codePoint <= 0x10ffff ? String.fromCodePoint(codePoint) : whole;
  });
}

/** HTML -> đoạn mô tả thuần chữ (≤ `max` ký tự, cắt ở ranh giới từ khi có thể) cho meta description. */
export function plainTextExcerpt(html: string, max = 160): string {
  // Bỏ thẻ TRƯỚC khi giải mã: "&lt;b&gt;" là chữ "<b>" của bài viết, không phải thẻ để xoá.
  const text = decodeHtmlEntities(html.replace(/<[^>]*>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  const base = lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut;
  return `${base.trimEnd()}…`;
}
