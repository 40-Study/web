"use client";

import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthIconHeader } from "@/components/auth/auth-icon-header";
import { Button } from "@/components/ui/button";
import { CheckIcon } from "@/components/icons";
import { AUTH_ROUTES } from "@/lib/routes";
import { STORAGE_KEYS } from "@/lib/constants";
import { useOneShotPage } from "@/hooks/use-one-shot-page";

export default function RegisterSuccessPage() {
  // N-11 (QA4 261123): chỉ hiện ngay sau bước trước của luồng; mở thẳng URL thì về /login.
  const allowed = useOneShotPage(STORAGE_KEYS.REGISTER_SUCCESS_FLAG, AUTH_ROUTES.LOGIN);
  if (!allowed) return null;

  return (
    <AuthCard>
      <div className="flex flex-col items-center py-4">
        <AuthIconHeader
          icon={<CheckIcon size={40} className="text-green-600 dark:text-green-400" />}
          iconBgClassName="bg-green-100 dark:bg-green-950 h-20 w-20"
          title="Bạn đã tạo tài khoản thành công!"
          description="Tài khoản của bạn đã được tạo. Bạn có thể đăng nhập ngay bây giờ."
          className="mb-8"
        />

        <Button asChild className="h-12 w-full">
          <Link href={AUTH_ROUTES.LOGIN}>Tiếp tục đăng nhập</Link>
        </Button>
      </div>
    </AuthCard>
  );
}
