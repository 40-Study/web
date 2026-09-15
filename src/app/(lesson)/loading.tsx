import { LoadingScreen } from "@/components/ui/loading-screen";

/** Loading boundary cho route group (lesson). */
export default function LessonRouteLoading() {
  return <LoadingScreen variant="default" text="Đang tải bài học..." />;
}
