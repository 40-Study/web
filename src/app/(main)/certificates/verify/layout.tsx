import type { Metadata } from "next";

/**
 * Metadata cho form tra cứu chứng chỉ (G1) — công khai. Trang kết quả theo mã
 * (`[number]/page.tsx`) đã tự có `generateMetadata`; layout này chỉ áp cho form.
 * `page.tsx` là client component nên metadata phải ở đây.
 */
export const metadata: Metadata = {
  title: "Tra cứu chứng chỉ",
  description:
    "Nhập mã chứng chỉ để kiểm tra tính hợp lệ và xem thông tin người được cấp trên ForteX.",
  alternates: { canonical: "/certificates/verify" },
};

export default function CertificateVerifyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
