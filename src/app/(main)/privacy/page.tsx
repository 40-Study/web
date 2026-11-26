import type { Metadata } from "next";
import { LEGAL_PAGES_LAST_UPDATED, siteConfig } from "@/lib/constants";
import { buildPageMetadata } from "@/lib/page-metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Chính sách bảo mật",
  description: "Chính sách bảo mật dữ liệu người dùng của ForteX.",
  path: "/privacy",
});

/**
 * Trang Chính sách bảo mật (H-06) — bản tối thiểu để footer và luồng thanh toán
 * (cart/checkout) có đích thật thay vì href="#" hoặc route không tồn tại.
 * Nội dung chi tiết cần được bộ phận pháp lý rà soát trước khi phát hành chính thức.
 */
export default function PrivacyPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Chính sách bảo mật</h1>
      <p className="mt-2 text-sm text-muted-foreground">Cập nhật lần cuối: {LEGAL_PAGES_LAST_UPDATED}</p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">1. Dữ liệu chúng tôi thu thập</h2>
          <p className="mt-2">
            ForteX thu thập thông tin bạn cung cấp khi đăng ký (họ tên, email, số điện thoại) và dữ
            liệu học tập (tiến độ, điểm số, thời gian học) để cá nhân hoá trải nghiệm học tập.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">2. Mục đích sử dụng</h2>
          <p className="mt-2">
            Dữ liệu được dùng để vận hành nền tảng, xử lý thanh toán, gửi thông báo học tập, và cải
            thiện chất lượng khoá học. Chúng tôi không bán dữ liệu cá nhân cho bên thứ ba.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">3. Bảo mật thông tin</h2>
          <p className="mt-2">
            Mật khẩu được mã hoá, kết nối được bảo vệ qua HTTPS. Chúng tôi áp dụng các biện pháp kỹ
            thuật hợp lý để ngăn chặn truy cập, sửa đổi hoặc tiết lộ dữ liệu trái phép.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">4. Quyền của người dùng</h2>
          <p className="mt-2">
            Bạn có quyền truy cập, chỉnh sửa hoặc yêu cầu xoá dữ liệu cá nhân của mình bất kỳ lúc
            nào thông qua trang Cài đặt tài khoản hoặc bằng cách liên hệ trực tiếp với chúng tôi.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">5. Dữ liệu của học viên khi liên kết với phụ huynh</h2>
          <p className="mt-2">
            Khi học viên liên kết với một tài khoản phụ huynh, phụ huynh đó xem được tiến độ khoá học, lịch học, điểm
            số, điểm danh, bài tập và thống kê học tập (XP, chuỗi ngày học, thời gian học) của học viên. Chúng tôi
            không chia sẻ dữ liệu này với tài khoản phụ huynh nào khác ngoài tài khoản đã liên kết. Giáo viên và quản
            trị viên của tổ chức phụ trách các lớp mà học viên tham gia cũng xem được điểm số của học viên trong các
            lớp đó. Học viên hoặc phụ huynh có thể huỷ liên kết bất cứ lúc nào trong Cài đặt, mục Gia đình; từ lúc đó
            phụ huynh không còn xem được dữ liệu của học viên.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">6. Liên hệ</h2>
          <p className="mt-2">
            Mọi thắc mắc về chính sách bảo mật vui lòng liên hệ{" "}
            <a href={`mailto:${siteConfig.supportEmail}`} className="text-primary-600 underline underline-offset-2 hover:text-primary-700">
              {siteConfig.supportEmail}
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
