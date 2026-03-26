import { RoleGuard } from "@/components/guards";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Header, TeacherSidebar } from "@/components/layout";
import { DOMAIN_ACCESS_POLICY } from "@/lib/domain-access-policy";

export default function TeacherRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard roles={[...DOMAIN_ACCESS_POLICY.teacher]}>
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="flex flex-1 pt-16">
          <TeacherSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <main className="p-4 md:p-6 pb-20 md:pb-6 w-full max-w-7xl mx-auto flex-1">
              {children}
            </main>
            <BottomNav role="teacher" />
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
