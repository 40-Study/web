import { StudentLayout } from "@/components/layout/student-layout";

export default function StudentRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <StudentLayout>{children}</StudentLayout>;
}
