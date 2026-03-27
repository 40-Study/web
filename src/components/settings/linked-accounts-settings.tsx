"use client";

import { useState } from "react";
import { Check, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LinkedAccount {
  id: string;
  name: string;
  color: string;
  initial: string;
  connected: boolean;
}

const initialAccounts: LinkedAccount[] = [
  { id: "google", name: "Google", color: "bg-[#4285F4]", initial: "G", connected: false },
  { id: "facebook", name: "Facebook", color: "bg-[#1877F2]", initial: "f", connected: false },
  { id: "github", name: "GitHub", color: "bg-gray-800", initial: "GH", connected: false },
];

export function LinkedAccountsSettings() {
  const [accounts, setAccounts] = useState<LinkedAccount[]>(initialAccounts);

  const handleToggle = (id: string) => {
    setAccounts((prev) =>
      prev.map((acc) => (acc.id === id ? { ...acc, connected: !acc.connected } : acc))
    );
    // TODO: API call to connect/disconnect OAuth provider
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Liên kết tài khoản</h2>
        <p className="text-sm text-gray-500 mt-1">Kết nối tài khoản mạng xã hội để đăng nhập nhanh hơn</p>
      </div>

      <div className="space-y-3">
        {accounts.map((account) => (
          <div
            key={account.id}
            className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div
                  className={`w-11 h-11 rounded-xl ${account.color} flex items-center justify-center`}
                >
                  <span className="text-white font-bold text-sm">{account.initial}</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{account.name}</p>
                  <p className="text-sm text-gray-500">
                    {account.connected ? (
                      <span className="flex items-center gap-1 text-green-600">
                        <Check className="h-3.5 w-3.5" />
                        Đã kết nối
                      </span>
                    ) : (
                      "Chưa kết nối"
                    )}
                  </p>
                </div>
              </div>
              <Button
                variant={account.connected ? "outline" : "default"}
                size="sm"
                className="rounded-xl min-w-[100px]"
                onClick={() => handleToggle(account.id)}
              >
                {account.connected ? (
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
        ))}
      </div>
    </div>
  );
}
