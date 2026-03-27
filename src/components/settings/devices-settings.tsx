"use client";

import { Monitor, Smartphone, Tablet, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDevices, useLogoutAll } from "@/hooks/queries/use-auth";

/** Pick device icon based on device_name heuristics */
function DeviceIcon({ name, className }: { name: string; className?: string }) {
  const lower = name.toLowerCase();
  if (lower.includes("mobile") || lower.includes("iphone") || lower.includes("android")) {
    return <Smartphone className={className} />;
  }
  if (lower.includes("tablet") || lower.includes("ipad")) {
    return <Tablet className={className} />;
  }
  return <Monitor className={className} />;
}

export function DevicesSettings() {
  const { data, isLoading } = useDevices();
  const logoutAll = useLogoutAll();
  const devices = data?.devices || [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Thiết bị</h2>
          <p className="text-sm text-gray-500 mt-1">Quản lý các phiên đăng nhập</p>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-2xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Thiết bị</h2>
          <p className="text-sm text-gray-500 mt-1">
            {devices.length > 0
              ? `${devices.length} thiết bị đang đăng nhập`
              : "Không có thiết bị nào"}
          </p>
        </div>
        {devices.length > 1 && (
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
            onClick={() => logoutAll.mutate()}
            disabled={logoutAll.isPending}
          >
            <LogOut className="h-4 w-4 mr-1.5" />
            {logoutAll.isPending ? "Đang xử lý..." : "Đăng xuất tất cả"}
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {devices.map((device) => (
          <div
            key={device.device_id}
            className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-center gap-4"
          >
            <div className="p-2.5 bg-gray-50 rounded-xl shrink-0">
              <DeviceIcon name={device.device_name} className="h-5 w-5 text-gray-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-gray-900 truncate">{device.device_name}</p>
                {device.is_current && (
                  <span className="shrink-0 inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-200">
                    Thiết bị này
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-0.5">
                {device.ip_address || "IP không rõ"} &middot; Hoạt động {device.logged_in_at}
              </p>
            </div>
          </div>
        ))}

        {devices.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center shadow-sm">
            <Monitor className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Không có thiết bị nào đang đăng nhập</p>
          </div>
        )}
      </div>
    </div>
  );
}
