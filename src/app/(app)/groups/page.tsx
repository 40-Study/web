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
} from "lucide-react";
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

function GroupCard({ group, showJoin = false }: { group: Group; showJoin?: boolean }) {
  const joinGroup = useJoinGroup();

  return (
    <Card className="group overflow-hidden hover:shadow-md transition-all">
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <Link
                href={`/groups/${group.slug}`}
                className="font-semibold hover:text-primary transition-colors line-clamp-1"
              >
                {group.name}
              </Link>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                {group.privacy === "PUBLIC" ? (
                  <Globe className="h-3 w-3" />
                ) : (
                  <Lock className="h-3 w-3" />
                )}
                <span>
                  {group.privacy === "PUBLIC" ? "Công khai" : "Riêng tư"}
                </span>
                <span>|</span>
                <span>{group.member_count} thành viên</span>
              </div>
            </div>
          </div>
          {group.my_role && (
            <Badge variant="outline" className="text-xs shrink-0">
              {group.my_role === "OWNER"
                ? "Trưởng nhóm"
                : group.my_role === "ADMIN"
                  ? "Quản trị"
                  : "Thành viên"}
            </Badge>
          )}
        </div>

        {group.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{group.description}</p>
        )}

        {showJoin && !group.my_role && (
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
                <SelectItem value="PUBLIC">Công khai - ai cũng tham gia được</SelectItem>
                <SelectItem value="PRIVATE">Riêng tư - cần được duyệt</SelectItem>
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
  const { data: allGroups, isLoading: allLoading } = useGroups({ keyword: keyword || undefined });
  const { data: myGroups, isLoading: myLoading } = useMyJoinedGroups();

  return (
    <div className="container max-w-5xl mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
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
          {myLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
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

          {allLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
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
