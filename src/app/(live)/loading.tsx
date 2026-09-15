import { LoadingScreen } from "@/components/ui/loading-screen";

/**
 * Loading boundary cho route group (live).
 *
 * Phòng học dùng nền `bg-gray-950`; `LoadingScreen` mặc định lại là nền sáng
 * (`from-background …`). `(live)/rooms/[roomName]/page.tsx` là async server
 * component — nó chờ `POST /livestream/:id/join` rồi mới render nền tối, nên
 * đây đúng là chỗ chắc chắn nháy sáng. Truyền nền tối + chữ sáng cho khớp.
 */
export default function LiveRouteLoading() {
  return (
    <LoadingScreen
      className="bg-gray-950 text-gray-200"
      text="Đang kết nối phòng học..."
    />
  );
}
