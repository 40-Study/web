"use client";

import { useEffect, useState } from "react";

const MOBILE_BREAKPOINT_PX = 768;

/**
 * true khi viewport hẹp hơn 768px — dùng cho các panel phòng học trực tuyến
 * (RoomClient, VideoTab, các panel trong src/lib/meet/**) vốn dựng layout bằng
 * inline `style={{}}` nên không thể dùng breakpoint Tailwind (H-07).
 *
 * SSR-safe: mặc định false trên server, cập nhật đúng giá trị ngay sau mount.
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT_PX - 1}px)`);
    const update = () => setIsMobile(mql.matches);

    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  return isMobile;
}
