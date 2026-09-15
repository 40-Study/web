import { LoadingScreen } from "@/components/ui/loading-screen";

/** Loading boundary cho route group (teacher). */
export default function TeacherRouteLoading() {
  return <LoadingScreen variant="default" text="Đang tải..." />;
}
