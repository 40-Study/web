"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import { ImageOff } from "lucide-react";
import { isOptimizableImageUrl } from "@/lib/image-url";
import { cn } from "@/lib/utils";

interface SafeImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  /** Chế độ lấp đầy khung cha (cha phải `relative`), tương đương `fill` của next/image. */
  fill?: boolean;
  sizes?: string;
  width?: number;
  height?: number;
  /** Thay cho biểu tượng mặc định khi không có ảnh / ảnh lỗi. */
  fallback?: ReactNode;
}

/**
 * Ảnh không bao giờ làm sập trang: URL host chưa cấu hình cho `next/image` thì vẽ `<img>` thường
 * (không tối ưu hoá), còn ảnh thiếu hoặc tải lỗi (onError) thì vẽ khung thay thế.
 */
export function SafeImage({ src, alt, className, fill, sizes, width, height, fallback }: SafeImageProps) {
  // Nhớ src đã lỗi (không phải cờ boolean) để đổi sang ảnh mới thì tự thử lại.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (!src || failedSrc === src) {
    return (
      <div
        role="img"
        aria-label={alt || "Chưa có ảnh"}
        data-testid="safe-image-placeholder"
        className={cn(
          "flex items-center justify-center bg-gray-50 text-gray-300",
          fill ? "absolute inset-0" : "h-full w-full",
        )}
      >
        {fallback ?? <ImageOff className="h-6 w-6" aria-hidden="true" />}
      </div>
    );
  }

  const onError = () => setFailedSrc(src);

  if (!isOptimizableImageUrl(src)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- host không nằm trong remotePatterns: next/image sẽ ném lỗi
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onError={onError}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        className={cn(fill && "absolute inset-0 h-full w-full", className)}
      />
    );
  }

  return fill ? (
    <Image src={src} alt={alt} fill sizes={sizes} className={className} onError={onError} />
  ) : (
    <Image src={src} alt={alt} width={width ?? 80} height={height ?? 48} sizes={sizes} className={className} onError={onError} />
  );
}
