import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthIconHeader } from "@/components/auth/auth-icon-header";
import { Button } from "@/components/ui/button";
import { CheckIcon } from "@/components/icons";
import { AUTH_ROUTES } from "@/lib/routes";

export default function RegisterSuccessPage() {
  return (
    <AuthCard>
      <div className="flex flex-col items-center py-4">
        <AuthIconHeader
          icon={<CheckIcon size={40} className="text-green-500" />}
          iconBgClassName="bg-green-100 h-20 w-20"
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
