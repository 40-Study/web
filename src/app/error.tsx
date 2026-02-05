"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4">
            <div className="text-center">
                <h2 className="mb-2 text-2xl font-bold text-destructive">
                    Đã xảy ra lỗi!
                </h2>
                <p className="mb-4 text-muted-foreground">
                    Có lỗi xảy ra khi tải trang này.
                </p>
            </div>
            <Button onClick={reset}>Thử lại</Button>
        </div>
    );
}
