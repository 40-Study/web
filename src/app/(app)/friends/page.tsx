"use client";

import { useState } from "react";
import {
  UserPlus, Search, Loader2, MessageSquare, Users, X, Check,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth.store";
import { useCreateDirectConversation } from "@/hooks/queries/use-conversations";
import { useRouter } from "next/navigation";

// Demo data - in production these come from API
interface FriendUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  is_online: boolean;
  mutual_friends?: number;
  status: "friend" | "pending_sent" | "pending_received" | "none";
}

// Backend chưa có API bạn bè (không có router nào cho friends/friend-requests), nên hai danh
// sách này CỐ Ý rỗng và trang luôn hiển thị trạng thái trống. Khi có endpoint, thay bằng
// useQuery + <QueryState> thay vì hằng số.
const friends: FriendUser[] = [];
const suggestions: FriendUser[] = [];

function UserCard({
  user,
  onMessage,
  onAdd,
  onAccept,
  onReject,
}: {
  user: FriendUser;
  onMessage?: () => void;
  onAdd?: () => void;
  onAccept?: () => void;
  onReject?: () => void;
}) {
  return (
    <Card className="p-4 hover:shadow-sm transition-all">
      <div className="flex items-center gap-3">
        <div className="relative">
          <Avatar src={user.avatar} fallback={user.name[0]} size="md" status={user.is_online ? "online" : undefined} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{user.name}</p>
          <p className="text-xs text-gray-500 truncate">{user.email}</p>
          {user.mutual_friends && user.mutual_friends > 0 && (
            <p className="text-[11px] text-gray-400 mt-0.5">{user.mutual_friends} bạn chung</p>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {user.status === "friend" && onMessage && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onMessage} title="Nhắn tin">
              <MessageSquare className="h-4 w-4" />
            </Button>
          )}
          {user.status === "none" && onAdd && (
            <Button variant="outline" size="sm" className="text-xs h-8" onClick={onAdd}>
              <UserPlus className="h-3.5 w-3.5 mr-1" />
              Kết bạn
            </Button>
          )}
          {user.status === "pending_sent" && (
            <Badge variant="outline" className="text-[10px] text-gray-500">Đã gửi</Badge>
          )}
          {user.status === "pending_received" && (
            <div className="flex gap-1">
              <Button size="icon" className="h-7 w-7 bg-blue-600" onClick={onAccept} title="Chấp nhận">
                <Check className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onReject} title="Từ chối">
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

export default function FriendsPage() {
  const [tab, setTab] = useState("friends");
  const [search, setSearch] = useState("");
  const router = useRouter();
  const createConv = useCreateDirectConversation();

  const handleMessage = (userId: string) => {
    createConv.mutate(userId, {
      onSuccess: (conv) => {
        router.push(`/messages?id=${conv.id}`);
      },
    });
  };

  return (
    <div className="container max-w-3xl mx-auto py-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="h-7 w-7 text-blue-600" />
          Bạn bè
        </h1>
        <p className="text-sm text-gray-500 mt-1">Tìm kiếm và kết bạn với bạn học</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Tìm kiếm theo tên hoặc email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="friends">
            Bạn bè
            {friends.length > 0 && (
              <Badge className="ml-1.5 bg-blue-600 text-white text-[10px] px-1.5 h-4">{friends.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="requests">Lời mời</TabsTrigger>
          <TabsTrigger value="discover">Gợi ý</TabsTrigger>
        </TabsList>

        <TabsContent value="friends" className="mt-4">
          {friends.length === 0 ? (
            <Card className="p-12 text-center border-dashed">
              <Users className="h-12 w-12 mx-auto mb-3 text-gray-200" />
              <h3 className="font-semibold text-gray-700 mb-1">Chưa có bạn bè</h3>
              <p className="text-sm text-gray-500 mb-3">Tìm kiếm bạn học và kết bạn nhé</p>
              <Button variant="outline" size="sm" onClick={() => setTab("discover")}>
                Khám phá
              </Button>
            </Card>
          ) : (
            <div className="space-y-2">
              {friends
                .filter(u => !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()))
                .map(u => (
                  <UserCard key={u.id} user={u} onMessage={() => handleMessage(u.id)} />
                ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="requests" className="mt-4">
          <Card className="p-12 text-center border-dashed">
            <UserPlus className="h-12 w-12 mx-auto mb-3 text-gray-200" />
            <h3 className="font-semibold text-gray-700 mb-1">Không có lời mời nào</h3>
            <p className="text-sm text-gray-500">Lời mời kết bạn sẽ hiển thị ở đây</p>
          </Card>
        </TabsContent>

        <TabsContent value="discover" className="mt-4">
          {suggestions.length === 0 ? (
            <Card className="p-12 text-center border-dashed">
              <Search className="h-12 w-12 mx-auto mb-3 text-gray-200" />
              <h3 className="font-semibold text-gray-700 mb-1">Tìm bạn bè</h3>
              <p className="text-sm text-gray-500">Nhập tên hoặc email vào ô tìm kiếm để tìm bạn học</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {suggestions.map(u => (
                <UserCard key={u.id} user={u} onAdd={() => {}} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
