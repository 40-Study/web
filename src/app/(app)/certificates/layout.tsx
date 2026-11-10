import type { Metadata } from "next";
import { sectionTitle } from "@/lib/page-metadata";

// Tiêu đề tab (QA-A-07: trước đây chỉ là "ForteX"). `page.tsx` là client component nên metadata đặt ở layout passthrough;
// `sectionTitle` giữ hậu tố " | ForteX" cho route con nếu có.
export const metadata: Metadata = { title: sectionTitle("Chứng chỉ của tôi") };

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
