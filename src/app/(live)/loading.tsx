import { LoadingScreen } from "@/components/ui/loading-screen";

/**
 * Loading boundary cho route group (live). Phòng học nền tối nên dùng biến thể
 * phù hợp để tránh nháy trắng trước khi LiveKit kết nối.
 */
export default function LiveRouteLoading() {
  return <LoadingScreen variant="default" text="Đang kết nối phòng học..." />;
}
