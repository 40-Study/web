"use client";

import Link from "next/link";
import { ChevronLeft, FileText } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";

interface PlayerHeaderProps {
  courseTitle?: string;
}

/** Minimal header for course player - no search, no sidebar toggle */
export function PlayerHeader({ courseTitle }: PlayerHeaderProps) {
  return (
    <header className="h-14 bg-gray-900 text-white flex items-center justify-between px-4 shrink-0 z-20">
      {/* Left: Back + course title */}
      <div className="flex items-center gap-3">
        <Link
          href="/student/home"
          className="flex items-center gap-1.5 text-gray-300 hover:text-white transition-colors text-sm"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Khóa học của tôi</span>
        </Link>
        {courseTitle && (
          <>
            <span className="text-gray-600">|</span>
            <span className="text-sm text-gray-200 line-clamp-1 max-w-xs">{courseTitle}</span>
          </>
        )}
      </div>

      {/* Right: Assignment badge + avatar */}
      <div className="flex items-center gap-3">
        <Link
          href="/assignments"
          className="flex items-center gap-1.5 text-gray-300 hover:text-white transition-colors text-sm"
        >
          <FileText className="w-4 h-4" />
          <span>Bài tập</span>
          {/* Notification badge */}
          <span className="bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-medium">
            2
          </span>
        </Link>

        <button className="p-1 rounded hover:bg-gray-700 transition-colors">
          <Avatar fallback="TK" size="sm" />
        </button>
      </div>
    </header>
  );
}
