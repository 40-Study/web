"use client";

import Link from "next/link";
import { Mail } from "lucide-react";
import { siteConfig } from "@/lib/constants";

// Chỉ liệt kê route CÓ THẬT và công khai (không bị RoleGuard chặn) — footer hiển thị
// cả với khách chưa đăng nhập trên trang landing (H-06). Các mục "Giới thiệu/Đội ngũ/
// Tin tức/Tuyển dụng/Lộ trình học" trước đây trỏ tới trang không tồn tại nên đã bỏ.
const exploreLinks = [
  { label: "Khóa học", href: "/courses" },
  { label: "Cuộc thi", href: "/contests" },
  { label: "Thảo luận", href: "/discussions" },
  // Trỏ tới trang tra cứu công khai: footer hiện cả với khách chưa đăng nhập,
  // còn /certificates nằm trong group (app) nên bị RoleGuard chặn.
  { label: "Tra cứu chứng chỉ", href: "/certificates/verify" },
];

export function Footer() {
  // Khối "Đăng ký nhận tin" đã gỡ (F5, QA vòng 2): backend chưa có API nhận tin, form cũ chỉ đổi
  // state cục bộ rồi báo "Cảm ơn bạn đã đăng ký" — thành công giả, email không đi đâu cả. Chỉ đưa
  // khối này trở lại khi có endpoint thật.
  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
      <div className="container mx-auto px-8 py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center">
                <span className="text-white font-bold text-sm">FX</span>
              </div>
              <span className="text-xl font-bold text-gray-900">{siteConfig.name}</span>
            </Link>
            <p className="text-sm text-gray-600 leading-relaxed">
              Nền tảng đào tạo STEAM & AI thế hệ mới, cam kết mang lại kiến thức thực tế và chuẩn quốc tế cho học viên Việt Nam.
            </p>
            <div className="flex gap-3">
              {/* Số điện thoại đã gỡ vì số cũ là số giả. Chỉ thêm lại khi có số thật. */}
              <a
                href={`mailto:${siteConfig.supportEmail}`}
                aria-label={`Gửi email cho ${siteConfig.name}`}
                className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <Mail className="w-4 h-4 text-gray-600" aria-hidden="true" />
              </a>
            </div>
          </div>

          {/* Khám phá */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Khám phá</h3>
            <ul className="space-y-3">
              {exploreLinks.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Hỗ trợ — thay khối newsletter giả bằng lối vào trang trợ giúp thật */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Hỗ trợ</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/help" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  Trung tâm trợ giúp
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-10 pt-6 border-t flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
          <p>© 2024 {siteConfig.name}. Đã đăng ký bản quyền.</p>
          <div className="flex gap-6">
            <Link href="/terms" className="hover:text-gray-900 transition-colors">Điều khoản dịch vụ</Link>
            <Link href="/privacy" className="hover:text-gray-900 transition-colors">Chính sách bảo mật</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
