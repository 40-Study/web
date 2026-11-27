"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Users,
  Plus,
  Lock,
  Globe,
  Loader2,
  Search,
  UserPlus,
  EyeOff,
} from "lucide-react";
import { QueryState } from "@/components/common/query-state";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  useGroups,
  useMyJoinedGroups,
  useCreateGroup,
  useJoinGroup,
} from "@/hooks/queries/use-groups";
import type { Group } from "@/services/group.service";
import { PRIVACY_DESCRIPTIONS, PRIVACY_LABELS, roleLabel } from "@/components/groups/group-labels";
import { StaleDataNotice } from "@/components/common/stale-data-notice";

function GroupCard({ group, showJoin = false }: { group: Group; showJoin?: boolean }) {
  const joinGroup = useJoinGroup();

  return (
    <Card className="group overflow-hidden hover:shadow-md transition-all">
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div className="min-w-0">
              {/* Hai dòng thay vì một: ở 390px huy hiệu vai trò chiếm chỗ, tên nhóm bị cắt "Đồ án tốt nghiệp..." (QA4 S18). */}
              <Link
                href={`/groups/${group.slug}`}
                className="font-semibold hover:text-primary transition-colors line-clamp-2 break-words"
              >
                {group.name}
              </Link>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                {group.privacy === "PUBLIC" ? (
                  <Globe className="h-3 w-3" />
                ) : group.privacy === "SECRET" ? (
                  <EyeOff className="h-3 w-3" />
                ) : (
                  <Lock className="h-3 w-3" />
                )}
                <span>{PRIVACY_LABELS[group.privacy] ?? group.privacy}</span>
                <span>|</span>
                <span>{group.member_count} thành viên</span>
              </div>
            </div>
          </div>
          {group.my_role && (
            <Badge variant="outline" className="text-xs shrink-0">
              {roleLabel(group.my_role)}
            </Badge>
          )}
        </div>

        {group.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{group.description}</p>
        )}

        {/* Đã có yêu cầu chờ duyệt (backend kèm my_join_request cho người đã đăng nhập, QA hồi quy A-24): hiện
            trạng thái thay vì nút "Xin tham gia" để không gửi trùng (backend trả 400 GROUP_JOIN_REQUEST_EXISTS). */}
        {showJoin && !group.my_role && group.my_join_request && (
          <Button size="sm" variant="outline" className="w-full" disabled>
            Đã gửi yêu cầu
          </Button>
        )}
        {showJoin && !group.my_role && !group.my_join_request && (
          <Button
            size="sm"
            variant="outline"
            className="w-full"
            onClick={() => joinGroup.mutate({ id: group.id })}
            disabled={joinGroup.isPending}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            {group.privacy === "PUBLIC" ? "Tham gia" : "Xin tham gia"}
          </Button>
        )}
      </div>
    </Card>
  );
}

function CreateGroupDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [privacy, setPrivacy] = useState("PUBLIC");
  const createGroup = useCreateGroup();

  const handleCreate = () => {
    if (!name.trim()) return;
    createGroup.mutate(
      { name: name.trim(), description: description.trim() || undefined, privacy },
      { onSuccess: () => { setOpen(false); setName(""); setDescription(""); } }
    );
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4 mr-2" />
        Tạo nhóm
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
        <DialogHeader>
          <DialogTitle>Tạo nhóm mới</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Tên nhóm *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: Nhóm học React" />
          </div>
          <div className="space-y-2">
            <Label>Mô tả</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Mô tả ngắn về nhóm..." />
          </div>
          <div className="space-y-2">
            <Label>Quyền riêng tư</Label>
            <Select value={privacy} onValueChange={setPrivacy}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="PUBLIC">{PRIVACY_DESCRIPTIONS.PUBLIC}</SelectItem>
                <SelectItem value="PRIVATE">{PRIVACY_DESCRIPTIONS.PRIVATE}</SelectItem>
                <SelectItem value="SECRET">{PRIVACY_DESCRIPTIONS.SECRET}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button className="w-full" onClick={handleCreate} disabled={createGroup.isPending || !name.trim()}>
            {createGroup.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Tạo nhóm
          </Button>
        </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function GroupsPage() {
  const [tab, setTab] = useState("my-groups");
  const [keyword, setKeyword] = useState("");
  const {
    data: allGroups,
    isLoading: allLoading,
    isError: allError,
    error: allFetchError,
    refetch: refetchAll,
  } = useGroups({ keyword: keyword || undefined });
  const {
    data: myGroups,
    isLoading: myLoading,
    isError: myError,
    error: myFetchError,
    refetch: refetchMine,
  } = useMyJoinedGroups();

  return (
    <div className="page-container py-6 space-y-6">
      {/* Dưới sm: tiêu đề trên, nút "Tạo nhóm" dưới, để phụ đề không bị ép xuống dòng cạnh nút (QA4 S18). */}
      <div data-testid="groups-header" className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-7 w-7 text-primary" />
            Nhóm
          </h1>
          <p className="text-muted-foreground mt-1">Tham gia nhóm học tập và trao đổi</p>
        </div>
        <CreateGroupDialog />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="my-groups">Nhóm của tôi</TabsTrigger>
          <TabsTrigger value="explore">Khám phá</TabsTrigger>
        </TabsList>

        <TabsContent value="my-groups" className="mt-4">
          {/* Q10 #148 H1: refetch nền lỗi mà còn danh sách cache thì giữ danh sách + báo "Thử lại". */}
          {myError && myGroups && <StaleDataNotice resourceLabel="danh sách nhóm" onRetry={() => refetchMine()} />}
          {myLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : myError && !myGroups ? (
            // Q9-STU-01: lỗi API không được đọc thành "Bạn chưa tham gia nhóm nào".
            <QueryState isError error={myFetchError} onRetry={() => refetchMine()}>
              {null}
            </QueryState>
          ) : (myGroups?.groups ?? []).length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Bạn chưa tham gia nhóm nào</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(myGroups?.groups ?? []).map((group) => (
                <GroupCard key={group.id} group={group} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="explore" className="mt-4 space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm nhóm..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="pl-9"
            />
          </div>

          {allError && allGroups && <StaleDataNotice resourceLabel="danh sách nhóm" onRetry={() => refetchAll()} />}
          {allLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : allError && !allGroups ? (
            <QueryState isError error={allFetchError} onRetry={() => refetchAll()}>
              {null}
            </QueryState>
          ) : (allGroups?.groups ?? []).length === 0 ? (
            <p className="text-center py-12 text-muted-foreground">Không tìm thấy nhóm nào</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(allGroups?.groups ?? []).map((group) => (
                <GroupCard key={group.id} group={group} showJoin />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
