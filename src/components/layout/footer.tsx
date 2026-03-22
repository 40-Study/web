import Link from "next/link";
import { Globe, Mail, Phone } from "lucide-react";
import { siteConfig } from "@/lib/constants";

const aboutLinks = [
  { label: "Giới thiệu", href: "/about" },
  { label: "Đội ngũ", href: "/team" },
  { label: "Tin tức", href: "/news" },
  { label: "Tuyển dụng", href: "/careers" },
];

const learningLinks = [
  { label: "Lộ trình học", href: "/roadmap" },
  { label: "Khóa học AI", href: "/courses/ai" },
  { label: "Khóa học STEAM", href: "/courses/steam" },
  { label: "Chứng chỉ", href: "/certificates" },
];

export function Footer() {
  return (
    <footer className="bg-white border-t">
      <div className="container mx-auto px-8 py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">40</span>
              </div>
              <span className="text-xl font-bold text-gray-900">{siteConfig.name}</span>
            </Link>
            <p className="text-sm text-gray-600 leading-relaxed">
              Nền tảng đào tạo STEAM & AI thế hệ mới, cam kết mang lại kiến thức thực tế và chuẩn quốc tế cho học viên Việt Nam.
            </p>
            <div className="flex gap-3">
              <a href="#" className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                <Globe className="w-4 h-4 text-gray-600" />
              </a>
              <a href="mailto:contact@40study.com" className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                <Mail className="w-4 h-4 text-gray-600" />
              </a>
              <a href="tel:+84123456789" className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                <Phone className="w-4 h-4 text-gray-600" />
              </a>
            </div>
          </div>

          {/* About Us */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Về chúng tôi</h3>
            <ul className="space-y-3">
              {aboutLinks.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Learning */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Học tập</h3>
            <ul className="space-y-3">
              {learningLinks.map((item) => (
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
            <form className="flex gap-2">
              <input
                type="email"
                placeholder="Email của bạn"
                className="flex-1 h-10 px-4 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button
                type="submit"
                className="h-10 px-4 bg-primary-500 text-white text-sm font-medium rounded-lg hover:bg-primary-600 transition-colors"
              >
                Gửi
              </button>
            </form>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-10 pt-6 border-t flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
          <p>© 2024 {siteConfig.name}. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/terms" className="hover:text-gray-900 transition-colors">Điều khoản dịch vụ</Link>
            <Link href="/privacy" className="hover:text-gray-900 transition-colors">Chính sách bảo mật</Link>
            <Link href="/sitemap" className="hover:text-gray-900 transition-colors">Sơ đồ trang</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
