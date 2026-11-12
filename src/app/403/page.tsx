import type { Metadata } from "next";
import { ForbiddenActions } from "@/components/errors/forbidden-actions";

// G-09 (QA3 261104): tab từng hiện "ForteX" trơn.
export const metadata: Metadata = { title: "Không có quyền truy cập" };

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/50 px-4">
      <h1 className="text-6xl font-bold text-gray-300">403</h1>
      <h2 className="mt-4 text-xl font-semibold text-foreground">
        Không có quyền truy cập
      </h2>
      <p className="mt-2 text-muted-foreground">
        Bạn không có quyền truy cập trang này.
      </p>
      <ForbiddenActions />
    </div>
  );
}
