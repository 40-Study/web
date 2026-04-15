"use client";

/**
 * Family Connection Card - Simple style matching other sidebar cards
 */

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Users, UserPlus, ChevronRight, Clock, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSentInvitations } from "@/hooks/queries/use-invitation";
import { useChildren } from "@/hooks/queries/use-auth";
import { useAuthStore } from "@/stores/auth.store";
import { normalizeRole } from "@/lib/routes";
import { InviteParentModal } from "./invite-parent-modal";

interface FamilyConnectionCardProps {
  className?: string;
}

export function FamilyConnectionCard({ className }: FamilyConnectionCardProps) {
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const { activeRole } = useAuthStore();
  const normalizedRole = normalizeRole(activeRole);

  // Student view: show sent invitations
  const { data: sentInvitations = [], isLoading: isLoadingSent } = useSentInvitations();

  // Parent view: show children
  const { data: childrenData, isLoading: isLoadingChildren } = useChildren();

  const isParent = normalizedRole === "PARENT";

  // For students: filter accepted invitations (linked parents)
  const linkedParents = sentInvitations.filter((inv) => inv.status === "accepted");
  const pendingInvitations = sentInvitations.filter((inv) =>
    ["pending", "invited"].includes(inv.status)
  );

  // For parents: get children
  const children = childrenData?.children || [];

  const isLoading = isParent ? isLoadingChildren : isLoadingSent;

  if (isLoading) {
    return (
      <div className={cn("bg-white rounded-2xl p-5 shadow-sm", className)}>
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  // Parent View
  if (isParent) {
    return (
      <div className={cn("bg-white rounded-2xl p-5 shadow-sm", className)}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide">
            Con của tôi
          </h3>
          <Link
            href="/settings/family"
            className="text-xs font-semibold text-primary-600 hover:text-primary-700"
          >
            Xem tất cả
          </Link>
        </div>

        {children.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-gray-500 mb-1">Chưa có liên kết nào</p>
            <p className="text-xs text-gray-400">Chờ con mời bạn tham gia</p>
          </div>
        ) : (
          <div className="space-y-3">
            {children.slice(0, 3).map((child) => {
              const displayName = child.full_name || child.username;
              return (
                <Link
                  key={child.id}
                  href={`/parent/children/${child.id}`}
                  className="flex items-center gap-3 group"
                >
                  {child.avatar_url ? (
                    <Image
                      src={child.avatar_url}
                      alt={displayName}
                      width={36}
                      height={36}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary-700">
                        {displayName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate group-hover:text-primary-600">
                      {displayName}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Student View
  return (
    <>
      <div className={cn("bg-white rounded-2xl p-5 shadow-sm", className)}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide">
            Gia đình
          </h3>
          <Link
            href="/settings/family"
            className="text-xs font-semibold text-primary-600 hover:text-primary-700"
          >
            Quản lý
          </Link>
        </div>

        {/* Linked parents */}
        {linkedParents.length > 0 && (
          <div className="space-y-2 mb-3">
            {linkedParents.slice(0, 2).map((inv) => (
              <div key={inv.id} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <p className="text-sm text-gray-700 truncate flex-1">{inv.invitee_email}</p>
                <CheckCircle className="w-3.5 h-3.5 text-green-500" />
              </div>
            ))}
          </div>
        )}

        {/* Pending invitations */}
        {pendingInvitations.length > 0 && (
          <div className="space-y-2 mb-3">
            {pendingInvitations.slice(0, 2).map((inv) => (
              <div key={inv.id} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-400" />
                <p className="text-sm text-gray-600 truncate flex-1">{inv.invitee_email}</p>
                <Clock className="w-3.5 h-3.5 text-amber-500" />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {linkedParents.length === 0 && pendingInvitations.length === 0 && (
          <p className="text-sm text-gray-500 mb-3">
            Mời phụ huynh theo dõi tiến độ học tập
          </p>
        )}

        {/* Invite button */}
        <Button
          onClick={() => setIsInviteModalOpen(true)}
          variant="outline"
          size="sm"
          className="w-full"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Mời phụ huynh
        </Button>
      </div>

      <InviteParentModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
      />
    </>
  );
}
