"use client";

import { useState } from "react";
import { useAdminSettings } from "@/hooks/queries/use-admin-settings";
import { useUpdatePlatformFeeSetting } from "@/hooks/queries/use-admin-reports";
import { Can } from "@/components/guards";
import { PERMISSIONS } from "@/lib/permissions";
import { QueryState } from "@/components/common/query-state";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatVnDateTime } from "@/lib/vn-datetime";
import type { AdminSettings } from "@/services/admin-report.service";

/**
 * Thêm một cấu hình mới vào trang này (backend lưu bảng đơn-dòng platform_settings, KHÔNG phải key/value):
 *   1. thêm CỘT vào model.PlatformSetting (backend/internal/model/platform_setting.go);
 *   2. thêm trường vào dto.AdminSettingsDTO và điền ở PlatformSettingService.GetSettings;
 *   3. thêm trường vào AdminSettings (services/admin-report.service.ts) và một thẻ/hàng form ở đây.
 */

const FEE_ERROR_REQUIRED = "Nhập % phí nền tảng";
const FEE_ERROR_RANGE = "% phí nền tảng phải là số từ 0 đến 100 (tối đa 2 chữ số thập phân)";
// Cột là decimal(5,2): chỉ nhận tối đa 2 chữ số thập phân, tránh Postgres làm tròn lặng lẽ.
const FEE_PATTERN = /^\d{1,3}(\.\d{1,2})?$/;

/** Trả về số hợp lệ hoặc thông báo lỗi tiếng Việt. */
function parseFeePercent(raw: string): { value: number } | { error: string } {
  const text = raw.trim();
  if (text === "") return { error: FEE_ERROR_REQUIRED };
  const value = Number(text);
  if (!FEE_PATTERN.test(text) || value > 100) return { error: FEE_ERROR_RANGE };
  return { value };
}

const formatPercent = (value: number) => `${value.toLocaleString("vi-VN")}%`;

function UpdatedBy({ settings }: { settings: AdminSettings }) {
  if (!settings.updated_at) {
    return (
      <p className="text-xs text-gray-500">
        Chưa từng được chỉnh sửa — đang dùng mặc định 0% cho tới khi bạn đặt.
      </p>
    );
  }
  const when = formatVnDateTime(settings.updated_at);
  const who = settings.updated_by?.name?.trim();
  return (
    <p className="text-xs text-gray-500">
      {who ? `Cập nhật lần cuối bởi ${who} lúc ${when}` : `Cập nhật lần cuối lúc ${when}`}
    </p>
  );
}

function PlatformFeeCard({ settings }: { settings: AdminSettings }) {
  const updateMutation = useUpdatePlatformFeeSetting();
  const [draft, setDraft] = useState(String(settings.platform_fee_percent));
  const [error, setError] = useState<string | undefined>();
  // Giá trị đã kiểm hợp lệ đang chờ admin xác nhận; null = hộp thoại đóng.
  const [pendingValue, setPendingValue] = useState<number | null>(null);

  const onSave = () => {
    const parsed = parseFeePercent(draft);
    if ("error" in parsed) {
      setError(parsed.error);
      return;
    }
    // Q6 #132 L5: lưu đúng mức đang áp dụng thì không mở hộp "đổi từ 12,5% thành 12,5%" rồi PUT vô nghĩa.
    if (parsed.value === settings.platform_fee_percent) {
      setError("Mức phí này đang được áp dụng, không có gì để lưu.");
      return;
    }
    setError(undefined);
    // QA6: phí nền tảng là cấu hình tiền bạc, ảnh hưởng mọi đơn sau đó nên không lưu ngay khi bấm "Lưu".
    setPendingValue(parsed.value);
  };

  const onConfirm = () => {
    if (pendingValue === null) return;
    updateMutation.mutate(pendingValue, { onSettled: () => setPendingValue(null) });
  };

  return (
    <section className="rounded-xl border bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
      <h2 className="mb-1 text-base font-semibold">Phí nền tảng</h2>
      <p className="mb-4 text-xs text-gray-500">
        % áp dụng cho đơn thanh toán SAU thời điểm lưu — không ảnh hưởng đơn đã hoàn tất trước đó (mỗi
        đơn chốt % ngay lúc thanh toán).
      </p>

      <div className="flex items-start gap-2">
        <div className="w-40">
          <Input
            label="Phí nền tảng (%)"
            type="number"
            min={0}
            max={100}
            step="0.01"
            value={draft}
            error={error}
            onChange={(e) => {
              setDraft(e.target.value);
              setError(undefined);
            }}
          />
        </div>
        <Button className="mt-7" size="sm" isLoading={updateMutation.isPending} onClick={onSave}>
          Lưu
        </Button>
      </div>

      <div className="mt-3">
        <UpdatedBy settings={settings} />
      </div>

      <ConfirmDialog
        open={pendingValue !== null}
        onOpenChange={(open) => !open && !updateMutation.isPending && setPendingValue(null)}
        title="Đổi phí nền tảng?"
        description={
          <>
            Phí nền tảng sẽ đổi từ <strong>{formatPercent(settings.platform_fee_percent)}</strong> thành{" "}
            <strong>{pendingValue === null ? "" : formatPercent(pendingValue)}</strong>. Mức mới áp dụng cho mọi đơn thanh toán sau
            thời điểm lưu; đơn đã hoàn tất trước đó giữ nguyên.
          </>
        }
        confirmLabel="Xác nhận đổi phí"
        pending={updateMutation.isPending}
        onConfirm={onConfirm}
      />
    </section>
  );
}

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Cấu hình hệ thống</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Các tham số vận hành toàn nền tảng. Chỉ quản trị viên có quyền cấu hình hệ thống mới xem và sửa được.
        </p>
      </div>

      <Can
        permission={PERMISSIONS.MANAGE_PLATFORM_FEE}
        fallback={<p className="text-sm text-gray-500">Bạn không có quyền xem cấu hình hệ thống.</p>}
      >
        <SettingsContent />
      </Can>
    </div>
  );
}

function SettingsContent() {
  const { data, isLoading, isError, error, refetch } = useAdminSettings();
  return (
    <QueryState isLoading={isLoading} isError={isError} error={error} onRetry={() => refetch()}>
      {data && (
        // key theo updated_at: sau khi lưu xong và tải lại, form lấy giá trị máy chủ chốt.
        <PlatformFeeCard key={data.updated_at ?? "default"} settings={data} />
      )}
    </QueryState>
  );
}
