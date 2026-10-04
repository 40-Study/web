"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { useAuthStore } from "@/stores/auth.store";

interface PlayerHeaderProps {
  courseTitle?: string;
  courseSlug: string;
  exerciseCount?: number;
}

/** Light minimal header for course player */
export function PlayerHeader({ courseTitle, courseSlug, exerciseCount = 0 }: PlayerHeaderProps) {
  // A8 (QA vòng 2, N8): avatar trước đây ghi cứng "TK" cho mọi người học.
  const user = useAuthStore((s) => s.user);

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 shrink-0 z-20">
      {/* Left: Back arrow */}
      <div className="flex items-center">
        <Link
          href="/home"
          className="flex items-center text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </Link>
      </div>

      {/* Right: My courses link + Exercises + avatar */}
      <div className="flex items-center gap-4 sm:gap-5">
        <Link
          href="/my-courses"
          className="text-sm text-gray-700 hover:text-gray-900 transition-colors whitespace-nowrap"
        >
          Khóa học của tôi
        </Link>

        <Link
          href={`/courses/${courseSlug}/exercises`}
          className="relative text-sm text-gray-700 hover:text-gray-900 transition-colors"
        >
          Bài tập
          {exerciseCount > 0 && (
            <span className="absolute -top-2 -right-4 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-medium">
              {exerciseCount}
            </span>
          )}
        </Link>

        <Link
          href={user?.id ? `/profile/${user.id}` : "/login"}
          aria-label="Trang cá nhân"
          className="p-0.5 rounded-full hover:ring-2 hover:ring-gray-200 transition-all"
        >
          <Avatar src={user?.avatar} fallback={user?.name || "U"} size="sm" />
        </Link>
      </div>
    </header>
  );
}
