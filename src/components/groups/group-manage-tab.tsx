"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { Group } from "@/services/group.service";
import { BannedMemberList } from "./banned-member-list";
import { GroupSettingsForm } from "./group-settings-form";
import { getManageSections, type ManageSection } from "./group-permissions";
import { JoinRequestList } from "./join-request-list";
import { MemberList } from "./member-list";

const SECTION_LABELS: Record<ManageSection, string> = {
  requests: "Yêu cầu tham gia",
  members: "Thành viên",
  banned: "Bị cấm",
  settings: "Cài đặt",
};

interface GroupManageTabProps {
  group: Group;
  viewerId?: string;
  /** Số yêu cầu đang chờ, hiện kèm nhãn mục "Yêu cầu tham gia". */
  pendingRequestCount?: number;
}

/** Tab Quản lý: mỗi mục chỉ hiện khi vai trò của người xem được dùng (xem `getManageSections`). */
export function GroupManageTab({ group, viewerId, pendingRequestCount = 0 }: GroupManageTabProps) {
  const sections = getManageSections(group);
  const [section, setSection] = useState<ManageSection>(sections[0] ?? "requests");
  if (sections.length === 0) return null;
  // Vai trò đổi giữa chừng (bị hạ quyền) có thể làm mục đang chọn biến mất: rơi về mục đầu tiên.
  const active = sections.includes(section) ? section : sections[0];

  return (
    <Tabs value={active} onValueChange={(v) => setSection(v as ManageSection)}>
      <TabsList className="h-auto max-w-full flex-wrap justify-start">
        {sections.map((s) => (
          <TabsTrigger key={s} value={s}>
            {SECTION_LABELS[s]}
            {s === "requests" && pendingRequestCount > 0 && ` (${pendingRequestCount})`}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="requests" className="mt-4">
        <JoinRequestList group={group} />
      </TabsContent>
      <TabsContent value="members" className="mt-4">
        <MemberList group={group} viewerId={viewerId} manage />
      </TabsContent>
      <TabsContent value="banned" className="mt-4">
        <BannedMemberList group={group} />
      </TabsContent>
      <TabsContent value="settings" className="mt-4">
        <GroupSettingsForm group={group} />
      </TabsContent>
    </Tabs>
  );
}
