import { LoadingScreen } from "@/components/ui/loading-screen";

/**
 * Loading boundary cho route group (live).
 *
 * Phòng học dùng nền `bg-gray-950`; `LoadingScreen` mặc định lại là nền sáng
 * (`from-background …`). `(live)/rooms/[roomName]/page.tsx` là async server
 * component — nó chờ `POST /livestream/:id/join` rồi mới render nền tối, nên
 * đây đúng là chỗ chắc chắn nháy sáng.
 *
 * Phase 0 vòng 3 (M-3): bản trước truyền `className="bg-gray-950 text-gray-200"`
 * từ ngoài và **không có tác dụng** — `cn` là `twMerge`, `bg-gradient-to-br`
 * (nhóm `bg-image`) với `bg-gray-950` (nhóm `bg-color`) khác nhóm nên cùng sống
 * sót, mà `background-image` luôn vẽ đè `background-color`; còn `text-gray-200`
 * thua `text-muted-foreground` gắn sẵn trên `<p>` con. Nền tối giờ do prop
 * `tone="dark"` của `LoadingScreen` lo (kèm `bg-none` để xoá hẳn gradient).
 */
export default function LiveRouteLoading() {
  return (
    <LoadingScreen tone="dark" text="Đang kết nối phòng học..." />
  );
}
