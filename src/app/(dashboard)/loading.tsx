import { LoadingScreen } from "@/components/ui/loading-screen";

/** Loading boundary cho route group (dashboard). */
export default function DashboardRouteLoading() {
  return <LoadingScreen variant="default" text="Đang tải..." />;
}
