import { LoadingScreen } from "@/components/ui/loading-screen";

/**
 * Loading boundary riêng cho route group (main) (M-15) — giữ nguyên
 * Header/Sidebar/Footer của AppShellLayout trong lúc chờ dữ liệu page con.
 */
export default function MainRouteLoading() {
  return <LoadingScreen variant="default" text="Đang tải..." />;
}
