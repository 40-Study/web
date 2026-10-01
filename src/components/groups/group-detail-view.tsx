"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QueryState } from "@/components/common/query-state";
import { ConversationChat } from "@/components/chat/conversation-chat";
import { ApiError } from "@/lib/errors";
import { useGroup, useGroupJoinRequests } from "@/hooks/queries/use-groups";
import { useAuthStore } from "@/stores/auth.store";
import { GroupHeader } from "./group-header";
import { GroupManageTab } from "./group-manage-tab";
import { GroupMembersTab } from "./group-members-tab";
import { GroupNotFound } from "./group-not-found";
import { GroupOverviewTab } from "./group-overview-tab";
import { canReviewRequests, canSeeChat, canSeeMembers, getManageSections } from "./group-permissions";

type TabId = "overview" | "members" | "chat" | "manage";

export function GroupDetailSkeleton() {
  return (
    <div className="container mx-auto max-w-5xl space-y-4 px-4 py-6" role="status" aria-label="Đang tải nhóm">
      <Skeleton className="h-56 w-full rounded-2xl" />
      <Skeleton className="h-10 w-80 max-w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}

/** Trang chi tiết nhóm. 404 (kể cả nhóm SECRET với người ngoài) -> "Không tìm thấy nhóm". */
export function GroupDetailView({ slug }: { slug: string }) {
  const router = useRouter();
  const { user } = useAuthStore();
  const userId = user?.id;
  const { data: group, isLoading, isError, error, refetch } = useGroup(slug);
  const [tab, setTab] = useState<TabId>("overview");

  // Chỉ người duyệt được xem yêu cầu; nhóm PUBLIC không có yêu cầu nên khỏi gọi.
  const canSeeRequests = !!group && canReviewRequests(group.my_role) && group.privacy !== "PUBLIC";
  const { data: requests } = useGroupJoinRequests(group?.id ?? "", canSeeRequests);
  const pendingRequestCount = (requests?.requests ?? []).filter((r) => r.status === "PENDING").length;

  if (isLoading) return <GroupDetailSkeleton />;

  if (isError && error instanceof ApiError && error.status === 404) return <GroupNotFound />;

  if (isError || !group) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-10">
        <QueryState isError error={error} onRetry={() => refetch()}>
          {null}
        </QueryState>
      </div>
    );
  }

  const showMembers = canSeeMembers(group);
  const showChat = canSeeChat(group);
  const showManage = getManageSections(group).length > 0;
  const available: TabId[] = ["overview"];
  if (showMembers) available.push("members");
  if (showChat) available.push("chat");
  if (showManage) available.push("manage");
  // Tab đang chọn có thể biến mất (vừa rời nhóm, bị hạ quyền): quay về Tổng quan.
  const active: TabId = available.includes(tab) ? tab : "overview";

  return (
    <div className="container mx-auto max-w-5xl space-y-4 px-4 py-6">
      <GroupHeader group={group} onLeft={() => router.push("/groups")} />

      <Tabs value={active} onValueChange={(v) => setTab(v as TabId)}>
        <TabsList className="h-auto max-w-full flex-wrap justify-start">
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          {showMembers && <TabsTrigger value="members">Thành viên</TabsTrigger>}
          {showChat && <TabsTrigger value="chat">Trò chuyện</TabsTrigger>}
          {showManage && (
            <TabsTrigger value="manage">
              Quản lý{pendingRequestCount > 0 && ` (${pendingRequestCount})`}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <GroupOverviewTab group={group} />
        </TabsContent>
        <TabsContent value="members" className="mt-4">
          <GroupMembersTab group={group} viewerId={userId} />
        </TabsContent>
        <TabsContent value="chat" className="mt-4">
          {group.conversation?.id && (
            <Card className="flex h-[65vh] min-h-[360px] flex-col overflow-hidden">
              <ConversationChat conversationId={group.conversation.id} currentUserId={userId ?? ""} />
            </Card>
          )}
        </TabsContent>
        <TabsContent value="manage" className="mt-4">
          <GroupManageTab group={group} viewerId={userId} pendingRequestCount={pendingRequestCount} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
