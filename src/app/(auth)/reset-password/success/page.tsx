import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthIconHeader } from "@/components/auth/auth-icon-header";
import { Button } from "@/components/ui/button";
import { ShieldCheckIcon } from "@/components/icons";
import { AUTH_ROUTES } from "@/lib/routes";

export default function ResetPasswordSuccessPage() {
  return (
    <AuthCard>
      <div className="flex flex-col items-center py-4">
        <AuthIconHeader
          icon={<ShieldCheckIcon size={40} className="text-green-500" />}
          iconBgClassName="bg-green-100 h-20 w-20"
          title="Đổi mật khẩu thành công!"
          description="Mật khẩu của bạn đã được thay đổi. Hãy đăng nhập với mật khẩu mới."
          className="mb-8"
        />

        <Button asChild className="h-12 w-full">
          <Link href={AUTH_ROUTES.LOGIN}>Quay lại đăng nhập</Link>
        </Button>
      </div>
    </AuthCard>
  );
}
