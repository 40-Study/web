"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BlockedList } from "@/components/friends/blocked-list";
import { FriendList } from "@/components/friends/friend-list";
import { parseFriendsTab, type FriendsTab } from "@/components/friends/friends-tabs";
import { PeopleSearch } from "@/components/friends/people-search";
import { RequestList } from "@/components/friends/request-list";
import { useFriendSummary } from "@/hooks/queries/use-friends";

function FriendsTabs() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlTab = parseFriendsTab(searchParams.get("tab"));
  const [tab, setTab] = useState<FriendsTab>(urlTab);
  const { data: summary } = useFriendSummary();

  // Bấm thông báo khi đang đứng ở /friends chỉ đổi query, không mount lại trang.
  useEffect(() => setTab(urlTab), [urlTab]);

  const incoming = summary?.incoming_requests ?? 0;

  return (
    <Tabs
      value={tab}
      onValueChange={(v) => {
        setTab(v as FriendsTab);
        router.replace(`/friends?tab=${v}`, { scroll: false });
      }}
    >
      <TabsList className="h-auto max-w-full flex-wrap justify-start">
        <TabsTrigger value="friends">Bạn bè{summary ? ` (${summary.friends_count})` : ""}</TabsTrigger>
        <TabsTrigger value="requests">Lời mời{incoming > 0 ? ` (${incoming})` : ""}</TabsTrigger>
        <TabsTrigger value="search">Tìm người</TabsTrigger>
        <TabsTrigger value="blocked">Đã chặn</TabsTrigger>
      </TabsList>

      <TabsContent value="friends" className="mt-4">
        <FriendList />
      </TabsContent>
      <TabsContent value="requests" className="mt-4">
        <RequestList />
      </TabsContent>
      <TabsContent value="search" className="mt-4">
        <PeopleSearch />
      </TabsContent>
      <TabsContent value="blocked" className="mt-4">
        <BlockedList />
      </TabsContent>
    </Tabs>
  );
}

export default function FriendsPage() {
  return (
    <div className="container mx-auto max-w-3xl space-y-6 px-4 py-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Users className="h-7 w-7 text-primary" aria-hidden="true" />
          Bạn bè
        </h1>
        <p className="mt-1 text-muted-foreground">Kết nối với các bạn học và nhắn tin cùng nhau</p>
      </div>
      {/* useSearchParams bắt buộc nằm trong Suspense để `next build` không báo thiếu boundary. */}
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <FriendsTabs />
      </Suspense>
    </div>
  );
}
