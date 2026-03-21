import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Khám phá khóa học",
  description:
    "Khám phá hàng trăm khóa học chất lượng cao từ các giảng viên hàng đầu. Học mọi lúc, mọi nơi với 40Study.",
  openGraph: {
    title: "Khám phá khóa học | 40Study",
    description:
      "Khám phá hàng trăm khóa học chất lượng cao từ các giảng viên hàng đầu.",
  },
};

export default function CoursesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
