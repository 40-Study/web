import {
  BarChart3,
  Banknote,
  Bell,
  BookCheck,
  Building2,
  Flag,
  FolderTree,
  LayoutDashboard,
  Receipt,
  ScrollText,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Tags,
  Ticket,
  Trophy,
  UserCheck,
  Users,
  type LucideIcon,
} from "lucide-react";

import { PERMISSIONS, type Permission } from "@/lib/permissions";

export interface AdminMenuItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Phụ đề dưới tiêu đề header khi đang ở trang này (ADM-L3: trước đây mọi trang dùng chung một câu). */
  description: string;
  /** Mục chỉ hiện khi admin có quyền này — API phía sau trả 403 với admin kém quyền (QA 261009 L6). */
  permission?: Permission;
  /** Từ khoá phụ cho bảng lệnh Ctrl+K, viết không dấu; không hiện ra UI. */
  keywords?: readonly string[];
}

/** SSOT menu khu /admin: sidebar, thanh chip mobile, phụ đề header và bảng lệnh Ctrl+K đều đọc từ đây. */
export const adminMenu: readonly AdminMenuItem[] = [
  { label: "Tổng quan", href: "/admin", icon: LayoutDashboard, description: "Số liệu và hoạt động chính của nền tảng", keywords: ["dashboard", "trang chu", "thong ke"] },
  { label: "Người dùng", href: "/admin/users", icon: Users, description: "Tìm kiếm, xem và khoá tài khoản người dùng", keywords: ["user", "hoc vien", "mo khoa"] },
  { label: "Quản lý vai trò", href: "/admin/roles", icon: ShieldCheck, description: "Gán và gỡ vai trò cho người dùng", keywords: ["role"] },
  { label: "Quản lý tổ chức", href: "/admin/organizations", icon: Building2, description: "Quản lý các tổ chức và chủ tổ chức", keywords: ["organization", "org", "doanh nghiep"] },
  { label: "Phân quyền", href: "/admin/permissions", icon: Settings, description: "Quyền của từng vai trò hệ thống", keywords: ["permission"] },
  { label: "Danh mục khoá học", href: "/admin/categories", icon: FolderTree, description: "Cây danh mục dùng để phân loại khoá học", keywords: ["category"] },
  // QA-C-19: backend có CRUD /tags nhưng trước đây không có màn quản lý. Gói xu chưa có mục: backend chỉ có
  // GET /coins/packages trả gói ĐANG BẬT (không có is_active), nên màn admin không thấy được gói đã tắt để bật lại.
  { label: "Tag khoá học", href: "/admin/tags", icon: Tags, description: "Tạo, đổi tên và xoá tag khoá học", keywords: ["nhan", "the"] },
  { label: "Báo cáo vi phạm", href: "/admin/moderation", icon: Flag, description: "Xử lý báo cáo vi phạm từ người dùng", keywords: ["kiem duyet", "to cao", "moderation", "report"] },
  { label: "Đơn hàng", href: "/admin/orders", icon: Receipt, description: "Theo dõi, đối soát và hoàn tiền đơn hàng", keywords: ["order", "refund", "thanh toan"] },
  { label: "Rút tiền giảng viên", href: "/admin/withdrawals", icon: Banknote, description: "Duyệt yêu cầu rút tiền của giảng viên", keywords: ["withdraw", "payout", "vi"] },
  // "Ví của tôi" (PR #24) đã được thay bằng báo cáo doanh thu nền tảng THẬT (PR #29) —
  // xem admin/reports/page.tsx. Đổi lại tên mục nav cho khớp nội dung trang thật.
  { label: "Báo cáo hệ thống", href: "/admin/reports", icon: BarChart3, description: "Doanh thu và hoạt động của toàn nền tảng", keywords: ["revenue", "thong ke"] },
  // Nhật ký, thông báo hệ thống, cấu hình hệ thống: API đều cần SYSTEM_SETTINGS_MANAGE nên ẩn mục với admin thiếu quyền.
  { label: "Nhật ký hoạt động", href: "/admin/audit-logs", icon: ScrollText, description: "Tra cứu ai đã làm gì trên hệ thống", permission: PERMISSIONS.SYSTEM_SETTINGS_MANAGE, keywords: ["audit", "log", "lich su"] },
  { label: "Thông báo hệ thống", href: "/admin/notifications", icon: Bell, description: "Gửi thông báo đến người dùng theo đối tượng", permission: PERMISSIONS.SYSTEM_SETTINGS_MANAGE, keywords: ["notification"] },
  { label: "Cấu hình hệ thống", href: "/admin/settings", icon: SlidersHorizontal, description: "Thiết lập chung của hệ thống", permission: PERMISSIONS.SYSTEM_SETTINGS_MANAGE, keywords: ["settings", "cai dat"] },
  { label: "Duyệt khoá học", href: "/admin/courses", icon: BookCheck, description: "Duyệt hoặc từ chối khoá học chờ xuất bản", keywords: ["course", "phe duyet"] },
  { label: "Duyệt giáo viên", href: "/admin/teacher-applications", icon: UserCheck, description: "Xét duyệt đơn đăng ký làm giảng viên", keywords: ["teacher", "giang vien"] },
  // Cuộc thi (contract contest-feature §7): duyệt, gắn voucher, huỷ và CHỐT kết quả — chỉ admin chốt.
  { label: "Cuộc thi", href: "/admin/contests", icon: Trophy, description: "Duyệt cuộc thi, gắn voucher và chốt kết quả", keywords: ["contest"] },
  // Voucher (L1): tạo/sửa mã giảm giá, gồm công tắc voucher "dành riêng" (holders_only).
  { label: "Voucher", href: "/admin/vouchers", icon: Ticket, description: "Tạo và sửa mã giảm giá", keywords: ["coupon", "khuyen mai"] },
];

/** Mục admin hiện tại được thấy: mục không gắn quyền luôn hiện, mục gắn quyền chỉ hiện khi có quyền đó. */
export function getVisibleAdminMenu(permissions: readonly string[]): AdminMenuItem[] {
  return adminMenu.filter((item) => !item.permission || permissions.includes(item.permission));
}
