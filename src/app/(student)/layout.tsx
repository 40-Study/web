import { StudentLayout } from "@/components/layout/student-layout";
import { RoleGuard } from "@/components/guards/role-guard";

export default function StudentRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard roles={["STUDENT"]}>
      <StudentLayout>{children}</StudentLayout>
    </RoleGuard>
  );
}
