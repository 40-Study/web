import Link from "next/link";
import { cn } from "@/lib/utils";
import { loginHref } from "@/lib/login-redirect";

/**
 * Thay một khối chỉ dành cho người đã đăng nhập (ô bình luận, hộp thư...) bằng lời mời đăng nhập có
 * quay lại đúng trang (G-03/G-07, QA3 261104). `returnTo` là đường dẫn nội bộ; giá trị lạ -> `/login` trơn.
 */
export function LoginRequiredPrompt({
  message,
  returnTo,
  className,
}: {
  message: string;
  returnTo: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-600", className)}>
      <span>{message}</span>
      <Link href={loginHref(returnTo)} className="font-medium text-primary-600 hover:underline">
        Đăng nhập
      </Link>
    </div>
  );
}
