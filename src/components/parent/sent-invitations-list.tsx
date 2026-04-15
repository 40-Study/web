"use client";

import { useState } from "react";
import {
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Mail,
  MoreHorizontal,
  Trash2,
  RotateCcw,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSentInvitations, useRevokeInvitation, invitationKeys } from "@/hooks/queries/use-invitation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { ParentInvitation } from "@/services/invitation.service";

const statusConfig: Record<
  string,
  { label: string; color: string; icon: React.ReactNode; bgColor: string }
> = {
  pending: {
    label: "Đang chờ",
    color: "text-amber-600",
    icon: <Clock className="w-4 h-4" />,
    bgColor: "bg-amber-50",
  },
  invited: {
    label: "Đã gửi",
    color: "text-blue-600",
    icon: <Mail className="w-4 h-4" />,
    bgColor: "bg-blue-50",
  },
  accepted: {
    label: "Đã chấp nhận",
    color: "text-green-600",
    icon: <CheckCircle className="w-4 h-4" />,
    bgColor: "bg-green-50",
  },
  rejected: {
    label: "Đã từ chối",
    color: "text-red-600",
    icon: <XCircle className="w-4 h-4" />,
    bgColor: "bg-red-50",
  },
  expired: {
    label: "Đã hết hạn",
    color: "text-slate-500",
    icon: <AlertTriangle className="w-4 h-4" />,
    bgColor: "bg-slate-100",
  },
  revoked: {
    label: "Đã thu hồi",
    color: "text-slate-500",
    icon: <Trash2 className="w-4 h-4" />,
    bgColor: "bg-slate-100",
  },
};

const relationshipLabels: Record<string, string> = {
  parent: "Phụ huynh",
  guardian: "Người giám hộ",
  grandparent: "Ông/Bà",
};

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString));
}

function isExpiringSoon(expiresAt: string): boolean {
  const expiry = new Date(expiresAt);
  const now = new Date();
  const hoursLeft = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60);
  return hoursLeft > 0 && hoursLeft < 24;
}

function InvitationCard({
  invitation,
  onRevoke,
  isRevoking,
}: {
  invitation: ParentInvitation;
  onRevoke: (id: string) => void;
  isRevoking: boolean;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const status = statusConfig[invitation.status] || statusConfig.pending;
  const canRevoke = ["pending", "invited"].includes(invitation.status);
  const expiringSoon =
    canRevoke && invitation.expires_at && isExpiringSoon(invitation.expires_at);

  return (
    <div className="group relative p-4 rounded-xl bg-white border border-slate-200 hover:border-primary-200 hover:shadow-sm transition-all">
      <div className="flex items-start gap-4">
        {/* Avatar placeholder */}
        <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
          <span className="text-lg font-medium text-primary-700">
            {invitation.invitee_email.charAt(0).toUpperCase()}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-medium text-slate-900 truncate">{invitation.invitee_email}</p>
              <p className="text-sm text-slate-500">
                {relationshipLabels[invitation.relationship] || invitation.relationship}
              </p>
            </div>

            {/* Status badge */}
            <div
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium shrink-0",
                status.bgColor,
                status.color
              )}
            >
              {status.icon}
              {status.label}
            </div>
          </div>

          {/* Meta info */}
          <div className="mt-2 flex items-center gap-3 text-xs text-slate-400">
            <span>Gửi lúc {formatDate(invitation.created_at)}</span>
            {invitation.expires_at && canRevoke && (
              <span className={expiringSoon ? "text-amber-500 font-medium" : ""}>
                {expiringSoon ? "Sắp hết hạn" : `Hết hạn ${formatDate(invitation.expires_at)}`}
              </span>
            )}
          </div>

          {/* Message if exists */}
          {invitation.message && (
            <p className="mt-2 text-sm text-slate-600 line-clamp-2 italic">
              &ldquo;{invitation.message}&rdquo;
            </p>
          )}
        </div>

        {/* Actions */}
        {canRevoke && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
            >
              <MoreHorizontal className="w-5 h-5 text-slate-400" />
            </button>

            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-20">
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onRevoke(invitation.id);
                    }}
                    disabled={isRevoking}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    {isRevoking ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    Thu hồi lời mời
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface SentInvitationsListProps {
  onInviteClick: () => void;
}

export function SentInvitationsList({ onInviteClick }: SentInvitationsListProps) {
  const { data: invitations = [], isLoading, refetch } = useSentInvitations();
  const revokeMutation = useRevokeInvitation();
  const queryClient = useQueryClient();

  const handleRevoke = async (invitationId: string) => {
    try {
      await revokeMutation.mutateAsync(invitationId);
      queryClient.invalidateQueries({ queryKey: invitationKeys.sent() });
      toast.success("Đã thu hồi lời mời");
    } catch {
      toast.error("Không thể thu hồi lời mời");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (invitations.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <div className="w-16 h-16 mx-auto mb-4 bg-primary-100 rounded-full flex items-center justify-center">
          <Mail className="w-8 h-8 text-primary-600" />
        </div>
        <h3 className="text-lg font-medium text-slate-900 mb-1">Chưa có lời mời nào</h3>
        <p className="text-sm text-slate-500 mb-6">
          Mời phụ huynh để họ có thể theo dõi tiến độ học tập của bạn
        </p>
        <Button onClick={onInviteClick} className="h-11 px-6">
          <Mail className="w-4 h-4 mr-2" />
          Mời phụ huynh
        </Button>
      </div>
    );
  }

  // Group by status
  const pending = invitations.filter((i) => ["pending", "invited"].includes(i.status));
  const accepted = invitations.filter((i) => i.status === "accepted");
  const others = invitations.filter((i) =>
    ["rejected", "expired", "revoked"].includes(i.status)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-medium text-slate-900">Lời mời đã gửi</h3>
          <span className="px-2 py-0.5 bg-primary-100 rounded-full text-sm text-primary-700">
            {invitations.length}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="h-9"
        >
          <RotateCcw className="w-4 h-4 mr-1" />
          Làm mới
        </Button>
      </div>

      {/* Pending invitations */}
      {pending.length > 0 && (
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
            Đang chờ phản hồi ({pending.length})
          </p>
          <div className="space-y-3">
            {pending.map((invitation) => (
              <InvitationCard
                key={invitation.id}
                invitation={invitation}
                onRevoke={handleRevoke}
                isRevoking={revokeMutation.isPending}
              />
            ))}
          </div>
        </div>
      )}

      {/* Accepted */}
      {accepted.length > 0 && (
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
            Đã liên kết ({accepted.length})
          </p>
          <div className="space-y-3">
            {accepted.map((invitation) => (
              <InvitationCard
                key={invitation.id}
                invitation={invitation}
                onRevoke={handleRevoke}
                isRevoking={revokeMutation.isPending}
              />
            ))}
          </div>
        </div>
      )}

      {/* Others */}
      {others.length > 0 && (
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
            Lịch sử ({others.length})
          </p>
          <div className="space-y-3">
            {others.map((invitation) => (
              <InvitationCard
                key={invitation.id}
                invitation={invitation}
                onRevoke={handleRevoke}
                isRevoking={revokeMutation.isPending}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
