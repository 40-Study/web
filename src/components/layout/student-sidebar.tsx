"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

const studentNavItems = [
  { label: "TRANG CHỦ", href: "/home", icon: Home },
  { label: "KHÓA HỌC", href: "/my-courses", icon: BookOpen },
  { label: "THẢO LUẬN", href: "/discussions", icon: MessageSquare },
];

export function StudentSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[96px] min-h-screen bg-white border-r flex flex-col items-center py-6">
      {/* Navigation */}
      <nav className="flex flex-col gap-2 w-full px-2">
        {studentNavItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 py-3 px-2 rounded-lg transition-colors text-center",
                "hover:bg-gray-100",
                isActive && "bg-primary-50 text-primary-600"
              )}
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center",
                  isActive ? "bg-primary-100" : "bg-gray-100"
                )}
              >
                <Icon
                  className={cn(
                    "w-5 h-5",
                    isActive ? "text-primary-600" : "text-gray-600"
                  )}
                />
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium leading-tight",
                  isActive ? "text-primary-600" : "text-gray-600"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
