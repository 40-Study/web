import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Khám phá khoá học",
  description:
    "Khám phá hàng trăm khoá học chất lượng cao từ các giảng viên hàng đầu. Học mọi lúc, mọi nơi với ForteX.",
  openGraph: {
    title: "Khám phá khoá học | ForteX",
    description:
      "Khám phá hàng trăm khoá học chất lượng cao từ các giảng viên hàng đầu.",
  },
};

export default function CoursesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
