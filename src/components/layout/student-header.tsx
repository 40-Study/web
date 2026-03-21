"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import {
  Search,
  ShoppingCart,
  Bell,
  Mail,
  BarChart2,
  Calendar,
  BookOpen,
  FileText,
  Settings,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";

const userMenuItems = [
  { label: "Tiến độ khóa học", href: "/progress", icon: BarChart2 },
  { label: "Thời khóa biểu", href: "/schedule", icon: Calendar },
  { label: "Khóa học của tôi", href: "/my-courses", icon: BookOpen },
  { label: "Bài tập", href: "/assignments", icon: FileText, badge: true },
  { label: "Cài đặt tài khoản", href: "/settings", icon: Settings },
];

export function StudentHeader() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="h-16 bg-white border-b flex items-center justify-between px-6">
      {/* Logo */}
      <Link href="/home" className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
          <span className="text-white font-bold text-sm">40</span>
        </div>
        <span className="text-xl font-bold text-gray-900">40Study</span>
      </Link>

      {/* Search Bar */}
      <div className="flex-1 max-w-xl mx-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm khóa học, tài liệu..."
            className="w-full h-10 pl-12 pr-4 rounded-full border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        {/* Cart */}
        <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative">
          <ShoppingCart className="w-5 h-5 text-gray-600" />
        </button>

        {/* Notifications */}
        <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative">
          <Bell className="w-5 h-5 text-gray-600" />
        </button>

        {/* Messages */}
        <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative">
          <Mail className="w-5 h-5 text-gray-600" />
        </button>

        {/* User Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Avatar fallback="TK" size="sm" />
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-lg border py-2 z-50">
              {/* User Info */}
              <div className="px-4 py-3 border-b">
                <p className="font-semibold text-gray-900">Trần Hoàng Khôi</p>
                <p className="text-sm text-gray-500">khoi.tran@email.com</p>
              </div>

              {/* Menu Items */}
              <div className="py-2">
                {userMenuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <Icon className="w-5 h-5 text-gray-500" />
                      <span className="text-sm text-gray-700">{item.label}</span>
                      {item.badge && (
                        <span className="ml-auto w-2 h-2 rounded-full bg-red-500" />
                      )}
                    </Link>
                  );
                })}
              </div>

              {/* Logout */}
              <div className="border-t pt-2">
                <button
                  className="flex items-center gap-3 px-4 py-2.5 w-full hover:bg-gray-50 transition-colors text-red-600"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    // TODO: Handle logout
                  }}
                >
                  <LogOut className="w-5 h-5" />
                  <span className="text-sm">Đăng xuất</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
