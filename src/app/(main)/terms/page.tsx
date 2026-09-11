import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Điều khoản dịch vụ",
  description: "Điều khoản sử dụng nền tảng ForteX.",
};

/**
 * Trang Điều khoản dịch vụ (H-06) — bản tối thiểu để footer và luồng thanh toán
 * (cart/checkout) có đích thật thay vì href="#" hoặc route không tồn tại.
 * Nội dung chi tiết cần được bộ phận pháp lý rà soát trước khi phát hành chính thức.
 */
export default function TermsPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Điều khoản dịch vụ</h1>
      <p className="mt-2 text-sm text-muted-foreground">Cập nhật lần cuối: 2026</p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">1. Chấp nhận điều khoản</h2>
          <p className="mt-2">
            Khi đăng ký và sử dụng ForteX, bạn đồng ý tuân thủ các điều khoản dịch vụ được nêu
            dưới đây. Nếu không đồng ý, vui lòng ngừng sử dụng nền tảng.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">2. Tài khoản người dùng</h2>
          <p className="mt-2">
            Bạn chịu trách nhiệm bảo mật thông tin đăng nhập và mọi hoạt động diễn ra dưới tài
            khoản của mình. Vui lòng thông báo ngay cho chúng tôi nếu phát hiện truy cập trái phép.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">3. Thanh toán và hoàn tiền</h2>
          <p className="mt-2">
            Các giao dịch mua khóa học được xử lý qua cổng thanh toán đối tác. Chính sách hoàn
            tiền áp dụng theo quy định riêng của từng khóa học, được hiển thị trước khi thanh toán.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">4. Nội dung học tập</h2>
          <p className="mt-2">
            Toàn bộ nội dung khóa học, video và tài liệu thuộc bản quyền của ForteX và giảng viên
            liên quan. Nghiêm cấm sao chép, phân phối lại dưới mọi hình thức khi chưa được cho phép.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">5. Liên hệ</h2>
          <p className="mt-2">
            Mọi thắc mắc về điều khoản dịch vụ vui lòng liên hệ{" "}
            <a href="mailto:contact@40study.com" className="text-primary-600 hover:underline">
              contact@40study.com
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
