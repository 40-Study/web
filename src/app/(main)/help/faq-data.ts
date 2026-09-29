/**
 * FAQ tĩnh của trang Trợ giúp. Tách khỏi page.tsx vì Next.js chỉ cho page export default (và vài
 * field cấu hình), export thêm sẽ lỗi build. Chỉ nêu tính năng đang có thật; KHÔNG hứa hoàn tiền
 * theo số ngày cố định (chủ dự án đã bỏ cam kết này).
 */

import { siteConfig } from "@/lib/constants";

export const SUPPORT_EMAIL = "support@fortex.edu.vn";

export interface FAQ {
  question: string;
  answer: string;
}

export interface FAQCategory {
  title: string;
  faqs: FAQ[];
}

export const faqCategories: FAQCategory[] = [
  {
    title: "Tài khoản & Đăng nhập",
    faqs: [
      {
        question: "Tôi quên mật khẩu, phải làm sao?",
        answer:
          "Ở màn hình đăng nhập, chọn \"Quên mật khẩu\" và nhập email đã đăng ký. Hệ thống sẽ gửi mã OTP để bạn đặt lại mật khẩu.",
      },
      {
        question: "Làm sao để đổi mật khẩu khi đang đăng nhập?",
        answer:
          "Vào Cài đặt > Tài khoản, chọn \"Đổi mật khẩu\", nhập mật khẩu hiện tại và mật khẩu mới.",
      },
      {
        question: "Tôi có thể đăng nhập bằng Google hoặc Facebook không?",
        answer:
          "Có thể liên kết tài khoản mạng xã hội tại Cài đặt > Liên kết tài khoản để đăng nhập nhanh hơn.",
      },
    ],
  },
  {
    title: "Khóa học & Học tập",
    faqs: [
      {
        question: "Làm sao để mua khóa học?",
        answer:
          "Mở trang chi tiết khóa học, chọn \"Thêm vào giỏ hàng\" hoặc \"Mua ngay\" rồi làm theo các bước thanh toán. Sau khi đơn hàng được xác nhận, khóa học sẽ xuất hiện trong mục \"Khóa học của tôi\".",
      },
      {
        question: "Tôi có thể học thử trước khi mua không?",
        answer:
          "Một số bài học được giảng viên mở \"Xem thử\" trong phần nội dung khóa học. Bạn có thể xem các bài này mà không cần đăng nhập.",
      },
      {
        question: "Làm sao để xem lại các đơn hàng của tôi?",
        answer:
          "Sau khi đăng nhập, mở menu tài khoản ở góc phải và chọn \"Đơn hàng của tôi\" để xem trạng thái từng đơn.",
      },
      {
        question: "Tôi có thể học khi không có mạng không?",
        answer: `Hiện ${siteConfig.name} cần kết nối internet để xem bài học.`,
      },
    ],
  },
  {
    title: "Chứng chỉ",
    faqs: [
      {
        question: "Làm sao để kiểm tra một chứng chỉ có hợp lệ không?",
        answer:
          "Dùng trang \"Tra cứu chứng chỉ\" và nhập mã chứng chỉ. Trang này công khai, không cần đăng nhập.",
      },
    ],
  },
  {
    title: "Đơn hàng & Hỗ trợ",
    faqs: [
      {
        question: "Tôi cần hỗ trợ về đơn hàng hoặc muốn hoàn tiền thì liên hệ ở đâu?",
        answer: `Vui lòng gửi email tới ${SUPPORT_EMAIL} kèm mã đơn hàng. Yêu cầu hoàn tiền được đội hỗ trợ xem xét và xử lý thủ công.`,
      },
    ],
  },
];

/** Lọc FAQ theo từ khoá (không phân biệt hoa thường); bỏ nhóm không còn câu nào. */
export function filterFaqCategories(search: string): FAQCategory[] {
  const q = search.trim().toLowerCase();
  return faqCategories
    .map((cat) => ({
      ...cat,
      faqs: cat.faqs.filter(
        (f) => !q || f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q)
      ),
    }))
    .filter((cat) => cat.faqs.length > 0);
}
