"use client";

import { Check, Link2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLinkedAccounts, useDisconnectProvider } from "@/hooks/queries/use-auth";

// Backend URL for OAuth redirect - must go directly to backend, not through Next.js proxy
const BACKEND_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

interface ProviderMeta {
  id: string;
  name: string;
  color: string;
  initial: string;
}

const PROVIDERS: ProviderMeta[] = [
  { id: "google", name: "Google", color: "bg-[#4285F4]", initial: "G" },
  { id: "facebook", name: "Facebook", color: "bg-[#1877F2]", initial: "f" },
  { id: "github", name: "GitHub", color: "bg-gray-800", initial: "GH" },
];

export function LinkedAccountsSettings() {
  const { data: linked = [], isLoading } = useLinkedAccounts();
  const { mutate: disconnect, isPending } = useDisconnectProvider();

  const connectedSet = new Set(linked.map((a) => a.provider));

  const handleConnect = (providerId: string) => {
    window.location.href = `${BACKEND_BASE}/auth/oauth/${providerId}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Liên kết tài khoản</h2>
        <p className="text-sm text-gray-500 mt-1">Kết nối tài khoản mạng xã hội để đăng nhập nhanh hơn</p>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-gray-500 py-4">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Đang tải...</span>
        </div>
      ) : (
        <div className="space-y-3">
          {PROVIDERS.map((provider) => {
            const isConnected = connectedSet.has(provider.id);
            const linkedAccount = linked.find((a) => a.provider === provider.id);

            return (
              <div
                key={provider.id}
                className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-11 h-11 rounded-xl ${provider.color} flex items-center justify-center`}
                    >
                      <span className="text-white font-bold text-sm">{provider.initial}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{provider.name}</p>
                      <p className="text-sm text-gray-500">
                        {isConnected ? (
                          <span className="flex items-center gap-1 text-green-600">
                            <Check className="h-3.5 w-3.5" />
                            {linkedAccount?.email ? linkedAccount.email : "Đã kết nối"}
                          </span>
                        ) : (
                          "Chưa kết nối"
                        )}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant={isConnected ? "outline" : "default"}
                    size="sm"
                    className="rounded-xl min-w-[100px]"
                    disabled={isPending}
                    onClick={() =>
                      isConnected ? disconnect(provider.id) : handleConnect(provider.id)
                    }
                  >
                    {isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isConnected ? (
                      "Ngắt kết nối"
                    ) : (
                      <span className="flex items-center gap-1.5">
                        <Link2 className="h-4 w-4" />
                        Kết nối
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
