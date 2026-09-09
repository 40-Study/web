import { RoleGuard } from "@/components/guards/role-guard";

/**
 * (dashboard) route group — hiện chỉ có /parent/children/[id]. Trước đây
 * KHÔNG có layout nên không có RoleGuard nào bảo vệ (H2 trong plans/reports/
 * code-reviewer-260909-1340-web-logic-integration.md).
 *
 * Toaster đã có sẵn global trong Providers (src/components/providers/index.tsx)
 * — không gắn thêm ở đây (mục 14, tránh 2 <Toaster> lồng nhau).
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard roles={["PARENT"]}>
      <div className="min-h-screen bg-background">{children}</div>
    </RoleGuard>
  );
}
