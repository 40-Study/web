import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// G-09 (QA3 261104): tab từng hiện "ForteX" trơn.
export const metadata: Metadata = { title: "Không tìm thấy trang" };

export default function NotFound() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4">
            <div className="text-center">
                <h1 className="mb-2 text-6xl font-bold text-primary-600">404</h1>
                <h2 className="mb-2 text-2xl font-semibold">Không tìm thấy trang</h2>
                <p className="mb-6 text-muted-foreground">
                    Trang bạn đang tìm kiếm không tồn tại.
                </p>
            </div>
            <Button asChild>
                <Link href="/">Về trang chủ</Link>
            </Button>
        </div>
    );
}
