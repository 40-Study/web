"use client";

/** Các khối của trang kết quả: giải thưởng đã nhận và chờ công bố đáp án. */
import Link from "next/link";
import { Award, Clock, Ticket } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { contestPath } from "@/lib/contest/contest-cta";
import { formatContestTimeWithSeconds, formatCountdown } from "@/lib/contest/contest-format";
import type { ContestAwardBrief } from "@/types/contest";
import { useServerCountdown } from "./use-server-countdown";

/**
 * Giải đã nhận. Số chứng nhận (`CONTEST-YYYYMMDD-xxxxxxxx`, không có dấu cách để xuống dòng) nằm
 * NGOÀI nút: nút có `whitespace-nowrap`, gộp số vào nhãn làm nút tràn khỏi thẻ ở 390px (review m2).
 */
export function ContestAwardPanel({ slug, award }: { slug: string; award: ContestAwardBrief }) {
  return (
    <div className="min-w-0 space-y-2 rounded-xl bg-violet-50 p-3 text-sm text-violet-900">
      <p className="font-semibold">Chúc mừng, bạn đã nhận giải!</p>
      {award.certificate_number && (
        <div className="flex flex-wrap items-center gap-2">
          <Link href={contestPath(slug, "certificate")} className={buttonVariants({ variant: "outline", size: "sm" })}>
            <Award className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Xem chứng nhận
          </Link>
          <span className="min-w-0 break-all text-xs text-violet-800" data-testid="certificate-number">
            Số {award.certificate_number}
          </span>
        </div>
      )}
      {award.voucher && (
        <p className="flex items-start gap-1.5 break-words">
          <Ticket className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="min-w-0">
            Voucher {award.voucher.name} (mã <span className="break-all">{award.voucher.code}</span>) đã được thêm vào{" "}
            <Link href="/my-vouchers" className="font-medium underline">
              voucher của tôi
            </Link>
            .
          </span>
        </p>
      )}
    </div>
  );
}

interface ContestAnswersPendingProps {
  answersAvailableAt: string;
  serverTime: string;
  /** `dataUpdatedAt` của truy vấn chứa `serverTime` — xem useServerCountdown. */
  receivedAt?: number;
  /** Gọi một lần khi đồng hồ về 0 để tải lại kết quả (có đáp án). */
  onAvailable: () => void;
}

/**
 * Chờ công bố đáp án (ĐÍNH CHÍNH 2: đếm tới `answers_available_at`, không tới `end_time`). Về 0
 * thì tự tải lại; nếu server vẫn chưa trả đáp án (đồng hồ lệch) thì báo đang tải thay vì đứng ở 0.
 */
export function ContestAnswersPending({ answersAvailableAt, serverTime, receivedAt, onAvailable }: ContestAnswersPendingProps) {
  const remaining = useServerCountdown(answersAvailableAt, serverTime, onAvailable, receivedAt);
  if (remaining === 0) {
    return (
      <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600" role="status">
        <span>Đã tới giờ công bố, đang tải đáp án…</span>
        <Button variant="outline" size="sm" onClick={onAvailable}>
          Tải lại
        </Button>
      </div>
    );
  }
  return (
    <div className="space-y-1 text-sm text-gray-600" role="status">
      <p>Đáp án và giải thích được công bố lúc {formatContestTimeWithSeconds(answersAvailableAt)}.</p>
      {remaining !== null && (
        <p className="flex items-center gap-1.5 font-mono font-semibold text-gray-900" role="timer">
          <Clock className="h-4 w-4" aria-hidden="true" />
          Còn {formatCountdown(remaining)}
        </p>
      )}
    </div>
  );
}
