"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { useDeleteGroup, useUpdateGroup } from "@/hooks/queries/use-groups";
import type { CreateGroupDTO, Group } from "@/services/group.service";
import { PRIVACY_DESCRIPTIONS } from "./group-labels";
import { canDeleteGroup } from "./group-permissions";

// Giới hạn khớp validate của backend (UpdateGroupRequest).
export const GROUP_NAME_MIN = 2;
export const GROUP_NAME_MAX = 200;
export const GROUP_MAX_MEMBERS_MIN = 2;
export const GROUP_MAX_MEMBERS_MAX = 1000;

export interface GroupSettingsValues {
  name: string;
  description: string;
  privacy: string;
  maxMembers: number;
}

export type GroupSettingsErrors = Partial<Record<"name" | "maxMembers", string>>;

/** Kiểm tra phía client để báo lỗi sớm; backend vẫn là nơi quyết định cuối. */
export function validateGroupSettings(values: GroupSettingsValues, memberCount: number): GroupSettingsErrors {
  const errors: GroupSettingsErrors = {};
  const name = values.name.trim();
  if (name.length < GROUP_NAME_MIN || name.length > GROUP_NAME_MAX) {
    errors.name = `Tên nhóm cần từ ${GROUP_NAME_MIN} đến ${GROUP_NAME_MAX} ký tự`;
  }
  if (
    !Number.isInteger(values.maxMembers) ||
    values.maxMembers < GROUP_MAX_MEMBERS_MIN ||
    values.maxMembers > GROUP_MAX_MEMBERS_MAX
  ) {
    errors.maxMembers = `Sĩ số tối đa cần từ ${GROUP_MAX_MEMBERS_MIN} đến ${GROUP_MAX_MEMBERS_MAX}`;
  } else if (values.maxMembers < memberCount) {
    // Đặt thấp hơn số thành viên hiện có sẽ khiến nhóm "đầy" ngay và không ai vào được nữa.
    errors.maxMembers = `Nhóm đang có ${memberCount} thành viên, sĩ số tối đa không được nhỏ hơn`;
  }
  return errors;
}

/** Chỉ gửi field đã đổi để không ghi đè dữ liệu người khác vừa sửa. */
export function buildGroupUpdate(group: Group, values: GroupSettingsValues): Partial<CreateGroupDTO> {
  const patch: Partial<CreateGroupDTO> = {};
  if (values.name.trim() !== group.name) patch.name = values.name.trim();
  if (values.description.trim() !== (group.description ?? "")) patch.description = values.description.trim();
  if (values.privacy !== group.privacy) patch.privacy = values.privacy;
  if (values.maxMembers !== group.max_members) patch.max_members = values.maxMembers;
  return patch;
}

export function GroupSettingsForm({ group }: { group: Group }) {
  const router = useRouter();
  const update = useUpdateGroup();
  const del = useDeleteGroup();
  const [values, setValues] = useState<GroupSettingsValues>({
    name: group.name,
    description: group.description ?? "",
    privacy: group.privacy,
    maxMembers: group.max_members,
  });
  const [showErrors, setShowErrors] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const errors = validateGroupSettings(values, group.member_count);
  const patch = buildGroupUpdate(group, values);
  const isDirty = Object.keys(patch).length > 0;

  const handleSave = () => {
    setShowErrors(true);
    if (Object.keys(errors).length > 0 || !isDirty) return;
    update.mutate(
      { id: group.id, data: patch },
      {
        // Đổi tên có thể đổi slug: ở lại URL cũ sẽ thành 404, nên chuyển sang slug mới.
        onSuccess: (updated) => {
          if (updated?.slug && updated.slug !== group.slug) router.replace(`/groups/${updated.slug}`);
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      <Card className="space-y-4 p-5">
        <h2 className="font-semibold">Cài đặt nhóm</h2>

        <div className="space-y-2">
          <Label htmlFor="group-name">Tên nhóm</Label>
          <Input
            id="group-name"
            value={values.name}
            onChange={(e) => setValues({ ...values, name: e.target.value })}
            aria-invalid={showErrors && !!errors.name}
          />
          {showErrors && errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="group-description">Mô tả</Label>
          <Textarea
            id="group-description"
            value={values.description}
            onChange={(e) => setValues({ ...values, description: e.target.value })}
            rows={4}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="group-privacy">Quyền riêng tư</Label>
          <select
            id="group-privacy"
            className="h-10 w-full rounded-lg border border-slate-200 bg-background px-3 text-sm dark:border-slate-700"
            value={values.privacy}
            onChange={(e) => setValues({ ...values, privacy: e.target.value })}
          >
            {Object.entries(PRIVACY_DESCRIPTIONS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="group-max-members">Sĩ số tối đa</Label>
          <Input
            id="group-max-members"
            type="number"
            min={GROUP_MAX_MEMBERS_MIN}
            max={GROUP_MAX_MEMBERS_MAX}
            value={Number.isNaN(values.maxMembers) ? "" : values.maxMembers}
            onChange={(e) => setValues({ ...values, maxMembers: e.target.valueAsNumber })}
            aria-invalid={showErrors && !!errors.maxMembers}
          />
          {showErrors && errors.maxMembers && <p className="text-sm text-red-600">{errors.maxMembers}</p>}
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={update.isPending || !isDirty}>
            {update.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
            Lưu thay đổi
          </Button>
        </div>
      </Card>

      {canDeleteGroup(group.my_role) && (
        <Card className="space-y-3 border-red-200 p-5 dark:border-red-900/50">
          <h2 className="font-semibold text-red-700 dark:text-red-400">Vùng nguy hiểm</h2>
          <p className="text-sm text-muted-foreground">
            Xoá nhóm sẽ xoá toàn bộ thành viên và cuộc trò chuyện của nhóm. Thao tác này không hoàn tác được.
          </p>
          <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
            Xoá nhóm
          </Button>
          <ConfirmDialog
            open={deleteOpen}
            onOpenChange={setDeleteOpen}
            title="Xoá nhóm?"
            description="Toàn bộ thành viên và cuộc trò chuyện của nhóm sẽ bị xoá vĩnh viễn."
            confirmLabel="Xoá nhóm"
            destructive
            requireText={group.name}
            pending={del.isPending}
            onConfirm={() => del.mutate(group.id, { onSuccess: () => router.push("/groups") })}
          />
        </Card>
      )}
    </div>
  );
}
