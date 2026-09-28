"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { msUntil, serverClockOffset } from "@/lib/contest/contest-format";

/**
 * Đếm ngược tới `targetIso` theo GIỜ SERVER (xem contest-format.ts). `serverTime` là mốc server
 * trả kèm response; độ lệch được chốt một lần khi `serverTime` đổi (mỗi lần tải lại dữ liệu).
 * `onReachZero` gọi đúng một lần khi về 0 (vd tải lại chi tiết để phase chuyển, hoặc tự nộp bài).
 */
export function useServerCountdown(
  targetIso: string | null | undefined,
  serverTime: string | null | undefined,
  onReachZero?: () => void,
  /**
   * Lúc web NHẬN `serverTime` (React Query `dataUpdatedAt`). Bắt buộc khi dữ liệu có thể lấy từ
   * cache: so `serverTime` cũ với `Date.now()` hiện tại làm đồng hồ chậm đúng bằng tuổi cache.
   */
  receivedAtMs?: number
): number | null {
  // Tính đồng bộ (không qua effect) để lần render đầu đã dùng đúng độ lệch — nếu bắt đầu từ 0,
  // máy chạy nhanh hơn server sẽ thấy "0" một khoảnh khắc và gọi onReachZero sớm.
  const offset = useMemo(
    () => (serverTime ? serverClockOffset(serverTime, receivedAtMs || Date.now()) : 0),
    [serverTime, receivedAtMs]
  );
  const [now, setNow] = useState(() => Date.now());
  const firedRef = useRef(false);
  const callbackRef = useRef(onReachZero);
  callbackRef.current = onReachZero;

  useEffect(() => {
    firedRef.current = false;
  }, [targetIso]);

  useEffect(() => {
    if (!targetIso) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [targetIso]);

  const remaining = targetIso ? msUntil(targetIso, offset, now) : null;

  useEffect(() => {
    if (remaining === 0 && !firedRef.current) {
      firedRef.current = true;
      callbackRef.current?.();
    }
  }, [remaining]);

  return remaining;
}
