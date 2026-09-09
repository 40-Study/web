import { LoadingScreen } from "@/components/ui/loading-screen";

/**
 * Loading boundary riêng cho route group (admin) (M-15) — giữ nguyên sidebar/
 * header quản trị trong lúc chờ dữ liệu page con.
 */
export default function AdminRouteLoading() {
  return <LoadingScreen variant="default" text="Đang tải..." />;
}
