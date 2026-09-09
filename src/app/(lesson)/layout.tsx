import { RoleGuard } from "@/components/guards/role-guard";

/**
 * Minimal layout for course player — no sidebar, no StudentLayout.
 * The player manages its own header via PlayerHeader.
 *
 * Toaster đã có sẵn global trong Providers (src/components/providers/index.tsx),
 * gắn thêm ở đây tạo 2 <Toaster> lồng nhau — mỗi toast hiện 2 lần.
 */
export default function LessonLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard roles={["STUDENT"]}>
      <div className="min-h-screen bg-background">{children}</div>
    </RoleGuard>
  );
}
