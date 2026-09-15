import { LoadingScreen } from "@/components/ui/loading-screen";

/** Loading boundary cho route group (auth). */
export default function AuthRouteLoading() {
  return <LoadingScreen variant="default" text="Đang tải..." />;
}
