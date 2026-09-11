"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Phone } from "lucide-react";
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
  const [subscribed, setSubscribed] = useState(false);

  const handleNewsletterSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // TODO: nối API đăng ký nhận tin khi backend sẵn sàng (M-09) — hiện chỉ xác nhận
    // trên UI để tránh reload toàn trang và mất state SPA.
    setSubscribed(true);
  };

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
              <a
                href="mailto:contact@40study.com"
                aria-label="Gửi email cho ForteX"
                className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <Mail className="w-4 h-4 text-gray-600" aria-hidden="true" />
              </a>
              <a
                href="tel:+84123456789"
                aria-label="Gọi điện cho ForteX"
                className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <Phone className="w-4 h-4 text-gray-600" aria-hidden="true" />
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

          {/* Newsletter */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Đăng ký nhận tin</h3>
            <p className="text-sm text-gray-600 mb-4">
              Nhận thông báo về các khóa học mới nhất và chương trình ưu đãi hấp dẫn.
            </p>
            {subscribed ? (
              <p className="text-sm font-medium text-primary-600">Cảm ơn bạn đã đăng ký nhận tin!</p>
            ) : (
              <form className="flex gap-2" onSubmit={handleNewsletterSubmit}>
                <label htmlFor="footer-newsletter-email" className="sr-only">
                  Email của bạn
                </label>
                <input
                  id="footer-newsletter-email"
                  name="email"
                  type="email"
                  required
                  placeholder="Email của bạn"
                  className="flex-1 h-10 px-4 rounded-xl border border-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button
                  type="submit"
                  className="h-10 px-4 bg-primary-500 text-white text-sm font-medium rounded-xl hover:bg-primary-600 transition-colors"
                >
                  Gửi
                </button>
              </form>
            )}
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
