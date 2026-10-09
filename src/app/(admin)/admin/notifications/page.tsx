"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSystemRoles } from "@/hooks/use-system-roles";
import {
  BROADCAST_MAX_PER_HOUR,
  isBroadcastAudienceComplete,
  useBroadcastPreview,
  useSendBroadcast,
} from "@/hooks/queries/use-admin-broadcast";
import type { BroadcastAudience, BroadcastNotificationType } from "@/services/notification.service";

// Khớp BroadcastRequestDTO ở backend (dto/broadcast_dto.go).
const TITLE_MAX = 255;
const CONTENT_MAX = 2000;

const selectClass =
  "h-10 w-full rounded-lg border border-gray-200 px-3 text-sm dark:border-gray-700 dark:bg-gray-900";

export default function AdminBroadcastNotificationsPage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [audience, setAudience] = useState<BroadcastAudience>("all");
  const [roles, setRoles] = useState<string[]>([]);
  const [type, setType] = useState<BroadcastNotificationType>("system");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const rolesQuery = useSystemRoles();
  const preview = useBroadcastPreview(audience, roles);
  const send = useSendBroadcast();

  const count = preview.data?.recipient_count;
  const audienceReady = isBroadcastAudienceComplete(audience, roles);
  const hasText = title.trim() !== "" && content.trim() !== "";
  // Không cho gửi khi chưa biết (hoặc không có) người nhận: số trong hộp xác nhận phải là số thật.
  const canSubmit = hasText && audienceReady && !!count && !preview.isFetching && !send.isPending;

  const toggleRole = (name: string) =>
    setRoles((prev) => (prev.includes(name) ? prev.filter((r) => r !== name) : [...prev, name]));

  const onConfirm = () => {
    send.mutate(
      {
        title: title.trim(),
        content: content.trim(),
        audience,
        roles: audience === "roles" ? roles : undefined,
        notification_type: type,
      },
      {
        onSuccess: () => {
          setTitle("");
          setContent("");
        },
        onSettled: () => setConfirmOpen(false),
      }
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Thông báo hệ thống</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Gửi thông báo tới toàn bộ người dùng hoặc theo vai trò. Chỉ tài khoản đang hoạt động nhận được.
        </p>
      </div>

      <form
        className="space-y-5 rounded-xl border bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-950"
        onSubmit={(e) => {
          e.preventDefault();
          if (canSubmit) setConfirmOpen(true);
        }}
      >
        <div>
          <Input
            label="Tiêu đề"
            value={title}
            maxLength={TITLE_MAX}
            onChange={(e) => setTitle(e.target.value)}
            helperText={`${title.length}/${TITLE_MAX} ký tự`}
          />
        </div>
        <div>
          <Textarea
            label="Nội dung"
            rows={5}
            value={content}
            maxLength={CONTENT_MAX}
            onChange={(e) => setContent(e.target.value)}
            helperText={`${content.length}/${CONTENT_MAX} ký tự. Chỉ hỗ trợ văn bản thường.`}
          />
        </div>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-gray-900 dark:text-gray-100">Đối tượng nhận</legend>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" name="audience" checked={audience === "all"} onChange={() => setAudience("all")} />
            Tất cả người dùng
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" name="audience" checked={audience === "roles"} onChange={() => setAudience("roles")} />
            Theo vai trò
          </label>
          {audience === "roles" && (
            <div className="ml-6 space-y-1" role="group" aria-label="Vai trò nhận thông báo">
              {rolesQuery.isLoading && <p className="text-sm text-gray-500">Đang tải vai trò...</p>}
              {rolesQuery.isError && (
                <p className="text-sm text-red-600">
                  Không tải được danh sách vai trò.{" "}
                  <button type="button" className="underline" onClick={() => rolesQuery.refetch()}>
                    Thử lại
                  </button>
                </p>
              )}
              {rolesQuery.data?.map((role) => (
                <label key={role.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={roles.includes(role.name)} onChange={() => toggleRole(role.name)} />
                  {role.name}
                </label>
              ))}
            </div>
          )}
        </fieldset>

        <div className="max-w-xs">
          <label htmlFor="broadcast-type" className="mb-2 block text-sm font-medium">
            Loại thông báo
          </label>
          <select
            id="broadcast-type"
            className={selectClass}
            value={type}
            onChange={(e) => setType(e.target.value as BroadcastNotificationType)}
          >
            <option value="system">Hệ thống</option>
            <option value="promotion">Khuyến mãi</option>
          </select>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-300" role="status" aria-live="polite">
          {!audienceReady
            ? "Chọn ít nhất một vai trò để xem số người nhận."
            : preview.isError
              ? "Không đếm được số người nhận. Vui lòng thử lại."
              : count === undefined
                ? "Đang đếm số người nhận..."
                : count === 0
                  ? "Không có người nhận nào phù hợp."
                  : `Sẽ gửi tới ${count} người.`}
        </p>

        <div className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>Thông báo đã gửi không thể thu hồi. Mỗi quản trị viên gửi tối đa {BROADCAST_MAX_PER_HOUR} đợt mỗi giờ.</p>
        </div>

        <Button type="submit" disabled={!canSubmit} isLoading={send.isPending}>
          Gửi thông báo
        </Button>
      </form>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Gửi tới ${count ?? 0} người?`}
        description="Thông báo đã gửi không thể thu hồi. Hãy kiểm tra lại tiêu đề, nội dung và đối tượng nhận."
        confirmLabel="Gửi thông báo"
        pending={send.isPending}
        onConfirm={onConfirm}
      />
    </div>
  );
}
