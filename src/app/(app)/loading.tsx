import { LoadingScreen } from "@/components/ui/loading-screen";

/**
 * Loading boundary cho route group (app) — giữ nguyên sidebar/header trong lúc
 * chờ dữ liệu của page con.
 */
export default function AppRouteLoading() {
  return <LoadingScreen variant="default" text="Đang tải..." />;
}
