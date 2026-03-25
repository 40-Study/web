import { Toaster } from "sonner";
import { RoleGuard } from "@/components/guards/role-guard";

/**
 * Minimal layout for course player — no sidebar, no StudentLayout.
 * The player manages its own header via PlayerHeader.
 */
export default function LessonLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard roles={["STUDENT"]}>
      <div className="min-h-screen bg-background">
        {children}
        <Toaster position="bottom-center" />
      </div>
    </RoleGuard>
  );
}
