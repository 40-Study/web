"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStartLiveSession } from "@/hooks/queries/use-live-sessions";
import { getErrorMessage } from "@/lib/error-messages";
import type { LiveSessionStatus } from "@/services/live-session.service";

export function LiveSessionLaunch({ id, status }: { id: string; status: LiveSessionStatus }) {
  const start = useStartLiveSession();
  const router = useRouter();
  const active = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function launch() {
    if (active.current) return;
    active.current = true;
    setBusy(true);
    setError("");
    try {
      await start.mutateAsync(id);
      router.push(`/rooms/${id}`);
    } catch (e) {
      active.current = false;
      setBusy(false);
      setError(getErrorMessage(e));
    }
  }
  if (status !== "scheduled" && status !== "live") return null;
  return (
    <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
      <p className="text-xs text-muted-foreground">Phòng học trực tiếp</p>
      {status === "live" ? (
        <Link
          href={`/rooms/${id}`}
          prefetch={false}
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary-600"
        >
          <Video className="h-4 w-4" />
          Vào phòng học
        </Link>
      ) : (
        <Button
          type="button"
          disabled={busy}
          onClick={(event) => {
            if (event.detail <= 1) void launch();
          }}
          className="w-full"
        >
          {busy ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Video className="mr-2 h-4 w-4" />
          )}
          {busy ? "Đang mở phòng…" : "Bắt đầu và vào phòng"}
        </Button>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
