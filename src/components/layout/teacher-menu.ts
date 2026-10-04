import type { LucideIcon } from "lucide-react";
import {
  Calendar,
  BookOpen,
  Users,
  ClipboardList,
  BarChart3,
  Wallet,
  Trophy,
  MessageSquare,
} from "lucide-react";

export interface TeacherMenuItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

/**
 * Menu khu giảng viên — NGUỒN DUY NHẤT cho `TeacherSidebar` (route `/teacher/**`) và `Sidebar` (khung dùng chung
 * `(app)/**` khi vai đang dùng là TEACHER). Trước đây khung dùng chung dựng menu học viên cho giảng viên nên đứng ở
 * /messages, /notifications, /settings là mất đường quay về khu giảng viên (QA B-11).
 * "Tin nhắn" trỏ route `(app)/messages`: giảng viên trả lời học viên ở đó, trước đây chỉ vào được bằng gõ URL.
 */
export const TEACHER_MENU_ITEMS: TeacherMenuItem[] = [
  { label: "Lịch giảng dạy", href: "/teacher/schedule", icon: Calendar },
  { label: "Quản lý khóa học", href: "/teacher/courses", icon: BookOpen },
  { label: "Quản lý học sinh", href: "/teacher/students", icon: Users },
  { label: "Quản lý bài tập", href: "/teacher/assignments", icon: ClipboardList },
  { label: "Cuộc thi", href: "/teacher/contests", icon: Trophy },
  { label: "Tin nhắn", href: "/messages", icon: MessageSquare },
  { label: "Thống kê", href: "/teacher/analytics", icon: BarChart3 },
  { label: "Ví", href: "/teacher/wallet", icon: Wallet },
];