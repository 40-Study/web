import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/landing-page";

/**
 * Trang chủ khách. Tách phần client sang `LandingPage` để trang này xuất được metadata:
 * trước đây tab chỉ ghi "ForteX" trơn (QA-A-07). `absolute` vì đây là trang gốc, không nối " | ForteX".
 */
export const metadata: Metadata = {
  title: { absolute: "ForteX — Nền tảng học trực tuyến" },
};

export default function HomePage() {
  return <LandingPage />;
}
