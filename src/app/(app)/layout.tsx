import { StudentLayout } from "@/components/layout/student-layout";
import { RoleGuard } from "@/components/guards/role-guard";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard roles={["STUDENT", "TEACHER", "PARENT", "SYSTEM_ADMIN", "ORG_OWNER"]}>
      <StudentLayout>
        {children}
      </StudentLayout>
    </RoleGuard>
  );
}
