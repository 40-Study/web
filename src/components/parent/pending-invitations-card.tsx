"use client";

import { useState } from "react";
import Image from "next/image";
import { CheckCircle, XCircle, Loader2, Users, Clock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePendingInvitations, useRespondInvitation, invitationKeys } from "@/hooks/queries/use-invitation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { ParentInvitation } from "@/services/invitation.service";

const relationshipLabels: Record<string, string> = {
  parent: "Phụ huynh",
  guardian: "Người giám hộ",
  grandparent: "Ông/Bà",
};

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Hôm nay";
  if (diffDays === 1) return "Hôm qua";
  if (diffDays < 7) return `${diffDays} ngày trước`;
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function getExpiryInfo(expiresAt: string): { text: string; urgent: boolean } {
  const expiry = new Date(expiresAt);
  const now = new Date();
  const hoursLeft = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (hoursLeft <= 0) return { text: "Đã hết hạn", urgent: true };
  if (hoursLeft < 24) return { text: `Còn ${Math.ceil(hoursLeft)} giờ`, urgent: true };
  const daysLeft = Math.ceil(hoursLeft / 24);
  return { text: `Còn ${daysLeft} ngày`, urgent: false };
}

function InvitationItem({
  invitation,
  onRespond,
  isResponding,
}: {
  invitation: ParentInvitation;
  onRespond: (id: string, action: "accept" | "reject") => void;
  isResponding: boolean;
}) {
  const [confirmReject, setConfirmReject] = useState(false);
  const expiryInfo = invitation.expires_at ? getExpiryInfo(invitation.expires_at) : null;

  return (
    <div className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-primary-200 hover:shadow-sm transition-all">
      <div className="flex items-start gap-4">
        {/* Student avatar */}
        <div className="relative">
          {invitation.student?.avatar_url ? (
            <Image
              src={invitation.student.avatar_url}
              alt={invitation.student.full_name || ""}
              width={56}
              height={56}
              className="rounded-full object-cover"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
              <span className="text-xl font-medium text-white">
                {(invitation.student?.full_name || invitation.student?.user_name || "?")
                  .charAt(0)
                  .toUpperCase()}
              </span>
            </div>
          )}
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow">
            <Users className="w-3.5 h-3.5 text-slate-600" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-slate-900">
            {invitation.student?.full_name || invitation.student?.user_name || "Học viên"}
          </p>
          <p className="text-sm text-slate-500">
            mời bạn làm{" "}
            <span className="font-medium text-slate-900">
              {relationshipLabels[invitation.relationship] || invitation.relationship}
            </span>
          </p>

          {/* Meta */}
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs text-slate-400">
              {formatTimeAgo(invitation.created_at)}
            </span>
            {expiryInfo && (
              <span
                className={cn(
                  "flex items-center gap-1 text-xs",
                  expiryInfo.urgent ? "text-amber-600" : "text-slate-400"
                )}
              >
                {expiryInfo.urgent && <AlertTriangle className="w-3 h-3" />}
                <Clock className="w-3 h-3" />
                {expiryInfo.text}
              </span>
            )}
          </div>

          {/* Message */}
          {invitation.message && (
            <div className="mt-3 p-3 bg-slate-50 rounded-xl">
              <p className="text-sm text-slate-600 italic">&ldquo;{invitation.message}&rdquo;</p>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 flex items-center gap-3">
        {!confirmReject ? (
          <>
            <Button
              onClick={() => onRespond(invitation.id, "accept")}
              disabled={isResponding}
              className="flex-1 h-11 rounded-full"
            >
              {isResponding ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Chấp nhận
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => setConfirmReject(true)}
              disabled={isResponding}
              className="flex-1 h-11 rounded-full text-slate-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Từ chối
            </Button>
          </>
        ) : (
          <div className="w-full p-3 bg-red-50 rounded-xl">
            <p className="text-sm text-red-700 mb-3">
              Bạn có chắc muốn từ chối lời mời này? Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmReject(false)}
                className="flex-1 h-9 rounded-full"
              >
                Hủy
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  onRespond(invitation.id, "reject");
                  setConfirmReject(false);
                }}
                disabled={isResponding}
                className="flex-1 h-9 rounded-full bg-red-600 hover:bg-red-700"
              >
                {isResponding ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Xác nhận từ chối"
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface PendingInvitationsCardProps {
  className?: string;
}

export function PendingInvitationsCard({ className }: PendingInvitationsCardProps) {
  const { data: invitations = [], isLoading, refetch } = usePendingInvitations();
  const respondMutation = useRespondInvitation();
  const queryClient = useQueryClient();

  const handleRespond = async (invitationId: string, action: "accept" | "reject") => {
    try {
      await respondMutation.mutateAsync({ invitationId, action });
      queryClient.invalidateQueries({ queryKey: invitationKeys.pending() });
      toast.success(
        action === "accept" ? "Đã chấp nhận lời mời" : "Đã từ chối lời mời"
      );
    } catch {
      toast.error("Có lỗi xảy ra");
    }
  };

  if (isLoading) {
    return (
      <div className={cn("p-6 rounded-2xl bg-white border border-slate-200", className)}>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      </div>
    );
  }

  if (invitations.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-medium text-slate-900">Lời mời đang chờ</h3>
        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
          {invitations.length}
        </span>
      </div>

      {/* List */}
      <div className="space-y-3">
        {invitations.map((invitation) => (
          <InvitationItem
            key={invitation.id}
            invitation={invitation}
            onRespond={handleRespond}
            isResponding={respondMutation.isPending}
          />
        ))}
      </div>
    </div>
  );
}
