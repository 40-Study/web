/**
 * Định dạng hiển thị cho "Cuộc thi": nhãn phase, điểm, thời lượng, giải thưởng, đồng hồ.
 *
 * Đồng hồ: mọi mốc (mở, đóng, hạn nộp) so với GIỜ SERVER chứ không phải giờ máy người dùng —
 * máy lệch vài phút sẽ thấy "đang diễn ra" trong khi server vẫn "sắp diễn ra" (bấm Bắt đầu bị
 * 409). Web lấy `server_time` trong response, tính độ lệch một lần, rồi cộng vào `Date.now()`.
 */
import { toContestNumber, type ContestDecimal, type ContestPhase, type ContestPrize } from "@/types/contest";

export const CONTEST_PHASE_LABELS: Record<ContestPhase, string> = {
  DRAFT: "Bản nháp",
  PENDING_REVIEW: "Chờ duyệt",
  REJECTED: "Bị từ chối",
  CANCELLED: "Đã huỷ",
  UPCOMING: "Sắp diễn ra",
  ACTIVE: "Đang diễn ra",
  ENDED: "Đã kết thúc",
  FINALIZED: "Đã có kết quả",
};

export const CONTEST_PHASE_BADGE: Record<ContestPhase, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  PENDING_REVIEW: "bg-amber-100 text-amber-800",
  REJECTED: "bg-red-100 text-red-700",
  CANCELLED: "bg-red-100 text-red-700",
  UPCOMING: "bg-blue-100 text-blue-700",
  ACTIVE: "bg-emerald-100 text-emerald-700",
  ENDED: "bg-orange-100 text-orange-700",
  FINALIZED: "bg-violet-100 text-violet-700",
};

/** Điểm kiểu "7,5" (bỏ số 0 thừa). Null → "—". */
export function formatContestScore(value: ContestDecimal | null | undefined): string {
  const n = toContestNumber(value);
  if (n === null) return "—";
  return n.toLocaleString("vi-VN", { maximumFractionDigits: 2 });
}

export function formatContestPercent(value: ContestDecimal | null | undefined): string {
  const n = toContestNumber(value);
  if (n === null) return "—";
  return `${n.toLocaleString("vi-VN", { maximumFractionDigits: 1 })}%`;
}

/** 125 → "2 phút 5 giây". */
export function formatContestDuration(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined || seconds < 0) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s} giây`;
  return s === 0 ? `${m} phút` : `${m} phút ${s} giây`;
}

/** Giờ Việt Nam cố định (người xem ở múi giờ khác vẫn thấy đúng giờ thi công bố). */
export function formatContestDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** "Hạng 1–3: Chứng nhận + Voucher Giảm 50k". */
export function formatContestPrize(prize: ContestPrize): string {
  const range = prize.rank_from === prize.rank_to ? `Hạng ${prize.rank_from}` : `Hạng ${prize.rank_from}–${prize.rank_to}`;
  const rewards: string[] = [];
  if (prize.grant_certificate) rewards.push("Chứng nhận");
  if (prize.voucher) rewards.push(`Voucher ${prize.voucher.name}`);
  return `${range}: ${rewards.join(" + ") || "—"}`;
}

/** Độ lệch (ms) giữa đồng hồ server và máy: `serverNow ≈ Date.now() + offset`. */
export function serverClockOffset(serverTime: string, clientNowMs: number): number {
  const server = Date.parse(serverTime);
  return Number.isNaN(server) ? 0 : server - clientNowMs;
}

/** Số ms còn lại tới `targetIso` theo giờ server (không âm). */
export function msUntil(targetIso: string, offsetMs: number, clientNowMs: number): number {
  const target = Date.parse(targetIso);
  if (Number.isNaN(target)) return 0;
  return Math.max(0, target - (clientNowMs + offsetMs));
}

/**
 * Ân hạn nộp bài (backend `model.ContestSubmitGraceSeconds`). ĐÍNH CHÍNH 2 của contract: đáp án
 * và bảng xếp hạng công khai mở từ `end_time + 30s`, KHÔNG phải `end_time` — trong 30 giây đó
 * người bắt đầu sát giờ vẫn còn nộp được.
 */
export const CONTEST_SUBMIT_GRACE_SECONDS = 30;

/** Mốc công bố bảng xếp hạng/đáp án: `end_time + ân hạn` (ISO). */
export function contestRevealAt(endTime: string): string {
  const end = Date.parse(endTime);
  return Number.isNaN(end) ? endTime : new Date(end + CONTEST_SUBMIT_GRACE_SECONDS * 1000).toISOString();
}

/** Giờ có giây, giờ Việt Nam: "00:10:30 29/09/2026" — mốc công bố chỉ cách giờ đóng 30 giây. */
export function formatContestTimeWithSeconds(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const time = d.toLocaleTimeString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  const date = d.toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", day: "2-digit", month: "2-digit", year: "numeric" });
  return `${time} ${date}`;
}

export type LeaderboardVisibility = { visible: true } | { visible: false; message: string };

/**
 * Bảng xếp hạng có hiện chưa. `revealRemainingMs` = thời gian còn lại tới `contestRevealAt`
 * theo giờ server (null khi chưa tính được). Câu chữ phải khớp trạng thái: trong 30 giây ân hạn
 * cuộc thi ĐÃ kết thúc, nên không được nói "sau khi cuộc thi kết thúc".
 */
export function resolveLeaderboardVisibility(
  phase: ContestPhase,
  revealAt: string,
  revealRemainingMs: number | null
): LeaderboardVisibility {
  if (phase === "FINALIZED") return { visible: true };
  if (phase !== "ENDED") {
    return { visible: false, message: `Bảng xếp hạng được công bố lúc ${formatContestTimeWithSeconds(revealAt)}, sau khi hết giờ nộp bài.` };
  }
  if (revealRemainingMs === null || revealRemainingMs > 0) {
    const wait = revealRemainingMs === null ? "" : ` sau ${formatCountdown(revealRemainingMs)}`;
    return { visible: false, message: `Cuộc thi đã kết thúc, đang chờ hết thời gian nộp bài. Bảng xếp hạng công bố${wait} (lúc ${formatContestTimeWithSeconds(revealAt)}).` };
  }
  return { visible: true };
}

/** 93784000 → "1 ngày 02:03:04"; dưới 1 ngày → "02:03:04". */
export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(total / 86_400);
  const pad = (n: number) => n.toString().padStart(2, "0");
  const hms = `${pad(Math.floor((total % 86_400) / 3600))}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`;
  return days > 0 ? `${days} ngày ${hms}` : hms;
}
