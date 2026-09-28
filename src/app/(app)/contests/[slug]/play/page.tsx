"use client";

/**
 * Làm bài thi (contract §4, §7). Đọc chi tiết theo slug để có id + trạng thái của mình, rồi gọi
 * `start` (idempotent: tải lại trang nhận lại đúng attempt đang làm). Đồng hồ đếm tới
 * `deadline_at` theo giờ server; về 0 thì TỰ NỘP một lần (backend còn nhận thêm 30 giây ân hạn).
 */
import { useEffect, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { useContestDetail, useStartContest } from "@/hooks/queries/use-contests";
import { contestPath, resolveContestCta } from "@/lib/contest/contest-cta";
import { contestErrorCode, contestErrorMessage } from "@/lib/contest/contest-errors";
import { normalizeRole } from "@/lib/routes";
import { useAuthStore } from "@/stores/auth.store";
import type { ContestDetail } from "@/types/contest";
import { ContestErrorState, ContestLoading } from "../../_components/contest-states";
import { ContestPlayer } from "../../_components/contest-player";

export default function ContestPlayPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? "";
  const detailQuery = useContestDetail(slug);

  if (detailQuery.isLoading) return <ContestLoading />;
  if (detailQuery.error || !detailQuery.data) {
    return (
      <div className="px-4 py-10">
        <ContestErrorState error={detailQuery.error} onRetry={() => detailQuery.refetch()} />
      </div>
    );
  }
  return <PlayGate detail={detailQuery.data} />;
}

/** Quyết định có được vào làm bài không TRƯỚC khi gọi start (không tạo attempt ngoài ý muốn). */
function PlayGate({ detail }: { detail: ContestDetail }) {
  const { activeRole } = useAuthStore();
  const mine = detail.viewer.my_participation;
  const back = contestPath(detail.slug);

  if (mine?.attempt_status === "SUBMITTED") {
    return <PlayNotice title="Bạn đã nộp bài" message="Mỗi thí sinh chỉ nộp một lần." href={contestPath(detail.slug, "result")} label="Xem kết quả" />;
  }
  if (mine?.attempt_status === "EXPIRED") {
    return <PlayNotice title="Đã hết giờ làm bài" message="Bạn đã hết giờ, bài không được tính." href={back} label="Về trang cuộc thi" />;
  }
  if (!mine) {
    // Chưa đăng ký, hoặc vai trò không được thi (giảng viên, admin, phụ huynh) — câu giải thích
    // lấy cùng nguồn với trang chi tiết.
    const cta = resolveContestCta(detail, normalizeRole(activeRole));
    const message = cta.kind === "info" || cta.kind === "expired" ? cta.message : "Bạn cần đăng ký cuộc thi trước khi làm bài.";
    return <PlayNotice title="Chưa thể làm bài" message={message} href={back} label="Về trang cuộc thi" />;
  }
  if (mine.attempt_status === "NOT_STARTED" && detail.phase !== "ACTIVE") {
    const message = detail.phase === "UPCOMING" ? "Cuộc thi chưa mở. Hãy quay lại khi đến giờ thi." : "Cuộc thi đã kết thúc.";
    return <PlayNotice title="Chưa thể làm bài" message={message} href={back} label="Về trang cuộc thi" />;
  }
  return <PlayStarter detail={detail} />;
}

function PlayStarter({ detail }: { detail: ContestDetail }) {
  const start = useStartContest();
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    start.mutate(detail.id);
  }, [detail.id, start]);

  if (start.error) {
    const code = contestErrorCode(start.error);
    const toResult = code === "CONTEST_ALREADY_SUBMITTED";
    return (
      <PlayNotice
        title="Không thể bắt đầu làm bài"
        message={contestErrorMessage(start.error)}
        href={toResult ? contestPath(detail.slug, "result") : contestPath(detail.slug)}
        label={toResult ? "Xem kết quả" : "Về trang cuộc thi"}
      />
    );
  }
  if (!start.data) return <ContestLoading label="Đang chuẩn bị đề thi…" />;
  return <ContestPlayer detail={detail} session={start.data} />;
}

function PlayNotice({ title, message, href, label }: { title: string; message: string; href: string; label: string }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 px-4 py-12 text-center" role="status">
      <p className="text-lg font-semibold text-gray-900">{title}</p>
      <p className="text-sm text-gray-600">{message}</p>
      <Link href={href} className={buttonVariants({ variant: "outline" })}>
        <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden="true" />
        {label}
      </Link>
    </div>
  );
}
