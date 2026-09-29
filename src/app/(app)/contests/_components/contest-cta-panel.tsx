"use client";

import Link from "next/link";
import { AlertCircle, Award, Clock, Info, LogIn, Play, ShoppingCart } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { useJoinContest } from "@/hooks/queries/use-contests";
import { resolveContestCta } from "@/lib/contest/contest-cta";
import { formatCountdown } from "@/lib/contest/contest-format";
import type { ContestDetail } from "@/types/contest";
import { useServerCountdown } from "./use-server-countdown";

interface ContestCtaPanelProps {
  detail: ContestDetail;
  /** `dataUpdatedAt` của truy vấn chi tiết — xem useServerCountdown. */
  receivedAt: number;
  activeRole: string | null;
  /** Gọi khi mốc đếm ngược về 0 để tải lại chi tiết (phase đổi theo giờ server). */
  onPhaseBoundary: () => void;
}

export function ContestCtaPanel({ detail, receivedAt, activeRole, onPhaseBoundary }: ContestCtaPanelProps) {
  const cta = resolveContestCta(detail, activeRole);
  const join = useJoinContest();

  switch (cta.kind) {
    case "login":
      return (
        <Link href={cta.href} className={buttonVariants({ size: "lg", className: "w-full" })}>
          <LogIn className="mr-2 h-4 w-4" aria-hidden="true" />
          {cta.label}
        </Link>
      );
    case "buy-course":
      return (
        <div className="space-y-2">
          <p className="text-sm text-gray-600">{cta.message}</p>
          <Link href={cta.href} className={buttonVariants({ size: "lg", className: "w-full" })}>
            <ShoppingCart className="mr-2 h-4 w-4" aria-hidden="true" />
            {cta.label}
          </Link>
        </div>
      );
    case "join":
      return (
        <Button size="lg" className="w-full" isLoading={join.isPending} loadingText="Đang đăng ký…" onClick={() => join.mutate(detail.id)}>
          {cta.label}
        </Button>
      );
    case "countdown":
      return <RegisteredCountdown label={cta.label} target={cta.targetTime} serverTime={detail.server_time} receivedAt={receivedAt} onZero={onPhaseBoundary} />;
    case "start":
    case "continue":
      return (
        <Link href={cta.href} className={buttonVariants({ size: "lg", className: "w-full" })}>
          <Play className="mr-2 h-4 w-4" aria-hidden="true" />
          {cta.label}
        </Link>
      );
    case "result":
      return (
        <div className="flex flex-col gap-2">
          <Link href={cta.href} className={buttonVariants({ size: "lg", className: "w-full" })}>
            {cta.label}
          </Link>
          {cta.certificateHref && (
            <Link href={cta.certificateHref} className={buttonVariants({ variant: "outline", size: "lg", className: "w-full" })}>
              <Award className="mr-2 h-4 w-4" aria-hidden="true" />
              Xem chứng nhận
            </Link>
          )}
        </div>
      );
    case "expired":
      return (
        <p className="flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700" role="status">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {cta.message}
        </p>
      );
    case "info":
      return (
        <p className="flex items-start gap-2 rounded-xl bg-gray-50 p-3 text-sm text-gray-700" role="status">
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {cta.message}
        </p>
      );
  }
}

function RegisteredCountdown({ label, target, serverTime, receivedAt, onZero }: { label: string; target: string; serverTime: string; receivedAt: number; onZero: () => void }) {
  const remaining = useServerCountdown(target, serverTime, onZero, receivedAt);
  return (
    <div className="rounded-xl bg-blue-50 p-3 text-center" role="timer" aria-live="off">
      <p className="text-sm text-blue-800">{label}</p>
      <p className="mt-1 flex items-center justify-center gap-1.5 font-mono text-xl font-bold text-blue-900">
        <Clock className="h-5 w-5" aria-hidden="true" />
        {remaining === null ? "—" : formatCountdown(remaining)}
      </p>
    </div>
  );
}
