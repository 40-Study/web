import { GraduationCap, LayoutDashboard, Users, type LucideIcon } from "lucide-react";

export interface OrgMenuItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** true: chỉ sáng khi đứng đúng href; false: sáng cả ở trang con. */
  exact: boolean;
  description: string;
  /** Từ khoá phụ cho bảng lệnh Ctrl+K, viết không dấu; không hiện ra UI. */
  keywords?: readonly string[];
}

/** SSOT menu khu /org: sidebar, thanh chip mobile, tiêu đề header và bảng lệnh Ctrl+K đều đọc từ đây. */
export const orgMenu: readonly OrgMenuItem[] = [
  { label: "Tổng quan", href: "/org", icon: LayoutDashboard, exact: true, description: "Số liệu chung của tổ chức", keywords: ["dashboard", "trang chu"] },
  { label: "Thành viên", href: "/org/members", icon: Users, exact: false, description: "Thêm, gỡ và đổi vai thành viên", keywords: ["member", "giang vien", "hoc vien", "moi"] },
  { label: "Lớp học", href: "/org/classes", icon: GraduationCap, exact: false, description: "Các lớp học của tổ chức", keywords: ["class", "lop"] },
];
