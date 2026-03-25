"use client";

import { useDevices, useLogoutAll } from "@/hooks/queries/use-auth";
import { Button } from "@/components/ui/button";

export default function DevicesPage() {
  const { data, isLoading } = useDevices();
  const logoutAll = useLogoutAll();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">Thiết bị đăng nhập</h1>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-gray-200" />
          ))}
        </div>
      </div>
    );
  }

  const devices = data?.devices || [];

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Thiết bị đăng nhập</h1>
        {devices.length > 1 && (
          <Button
            variant="outline"
            onClick={() => logoutAll.mutate()}
            disabled={logoutAll.isPending}
          >
            Đăng xuất tất cả
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {devices.map((device) => (
          <div
            key={device.device_id}
            className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">{device.device_name}</span>
                {device.is_current && (
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                    Thiết bị này
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-gray-500">
                {device.ip_address || "Không rõ"} • Hoạt động {device.logged_in_at}
              </p>
            </div>
          </div>
        ))}

        {devices.length === 0 && (
          <div className="rounded-xl bg-white p-8 text-center shadow-sm">
            <p className="text-gray-500">Không có thiết bị nào</p>
          </div>
        )}
      </div>
    </div>
  );
}
