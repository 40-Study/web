"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import {
  Home,
  BookOpen,
  MessageSquare,
  Search,
  Bell,
  Menu,
  LogOut,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      {/* Header (Fixed Top) */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-50 flex items-center justify-between px-4 lg:px-8">
        <div className="flex items-center gap-6 lg:gap-12">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              40
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">40Study</span>
          </Link>

          {/* Search Bar */}
          <div className="hidden md:flex items-center bg-slate-100 rounded-full px-4 py-2 w-64 lg:w-96">
            <Search className="w-4 h-4 text-slate-400 mr-2" />
            <input
              type="text"
              placeholder="Tìm kiếm khóa học..."
              className="bg-transparent border-none outline-none text-sm w-full text-slate-700 placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Right Nav */}
        <div className="flex items-center gap-3 lg:gap-4">
          <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full hidden md:block">
            <Bell className="w-5 h-5" />
          </button>

          <div className="hidden sm:flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <Link href="/home">
                  <Button variant="ghost" className="text-slate-600 hover:text-slate-900 font-medium">
                    {user?.name || "Tài khoản"}
                  </Button>
                </Link>
                <Avatar fallback={user?.name || "TK"} size="sm" />
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-1" />
                  Đăng xuất
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" className="text-slate-600 hover:text-slate-900 font-medium">
                    Đăng nhập
                  </Button>
                </Link>
                <Link href="/register">
                  <Button className="bg-primary-600 hover:bg-primary-700 text-white font-medium shadow-sm">
                    Đăng ký
                  </Button>
                </Link>
              </>
            )}
          </div>

          <button className="p-2 text-slate-500 sm:hidden">
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </header>

      <div className="flex flex-1 pt-16">
        {/* Left Floating Sidebar */}
        <aside className="fixed left-0 top-16 bottom-0 w-20 bg-white border-r border-slate-200 z-40 hidden lg:flex flex-col items-center py-8 gap-8">
          <nav className="flex flex-col items-center gap-6 w-full">
            <Link href="/" className="group flex flex-col items-center gap-1 w-full">
              <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center">
                <Home className="w-5 h-5" />
              </div>
              <span className="text-xs scale-90 font-bold text-primary-600 origin-top">TRANG CHỦ</span>
            </Link>

            <Link href="/courses" className="group flex flex-col items-center gap-1 w-full opacity-60 hover:opacity-100 transition-opacity">
              <div className="w-10 h-10 rounded-xl hover:bg-slate-100 text-slate-700 flex items-center justify-center transition-colors">
                <BookOpen className="w-5 h-5" />
              </div>
              <span className="text-xs scale-90 font-bold text-slate-600 origin-top">KHÓA HỌC</span>
            </Link>

            <Link href="/discussions" className="group flex flex-col items-center gap-1 w-full opacity-60 hover:opacity-100 transition-opacity">
              <div className="w-10 h-10 rounded-xl hover:bg-slate-100 text-slate-700 flex items-center justify-center transition-colors">
                <MessageSquare className="w-5 h-5" />
              </div>
              <span className="text-xs scale-90 font-bold text-slate-600 origin-top">THẢO LUẬN</span>
            </Link>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 w-full lg:pl-20 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
