import type { Metadata } from "next";
import { getChildDisplayNameServer } from "@/lib/server-fetchers/parent-child";

/** Tiêu đề chung khi không đọc được tên con. */
const CHILD_PAGE_FALLBACK_TITLE = "Con của tôi";

/**
 * N-08 (QA4 261123): `page.tsx` là client component nên trang chi tiết con không có `<title>` riêng (chỉ
 * "ForteX"). Layout passthrough này đặt tiêu đề "<tên con> | ForteX" (template ở app/layout.tsx).
 */
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const name = await getChildDisplayNameServer(params.id);
  return { title: name ?? CHILD_PAGE_FALLBACK_TITLE };
}

export default function ChildDetailLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
