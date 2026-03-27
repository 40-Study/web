"use client";

import { useState } from "react";
import {
  HelpCircle,
  MessageCircle,
  Mail,
  BookOpen,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// ─── FAQ Data ────────────────────────────────────────────────────────────────

interface FAQ {
  question: string;
  answer: string;
}

const faqCategories: { title: string; icon: string; faqs: FAQ[] }[] = [
  {
    title: "Tài khoản & Đăng nhập",
    icon: "🔐",
    faqs: [
      {
        question: "Làm sao để đổi mật khẩu?",
        answer:
          "Vào Cài đặt > Tài khoản > Mật khẩu > nhấn \"Đổi mật khẩu\". Nhập mật khẩu hiện tại và mật khẩu mới.",
      },
      {
        question: "Tôi quên mật khẩu, phải làm sao?",
        answer:
          "Ở màn hình đăng nhập, nhấn \"Quên mật khẩu\". Nhập email đã đăng ký, hệ thống sẽ gửi mã OTP để bạn đặt lại mật khẩu.",
      },
      {
        question: "Làm sao để liên kết tài khoản Google/Facebook?",
        answer:
          "Vào Cài đặt > Liên kết tài khoản > nhấn \"Kết nối\" bên cạnh dịch vụ bạn muốn liên kết.",
      },
    ],
  },
  {
    title: "Khóa học & Học tập",
    icon: "📚",
    faqs: [
      {
        question: "Làm sao để đăng ký khóa học?",
        answer:
          "Tìm khóa học trong danh sách hoặc tìm kiếm, vào trang chi tiết và nhấn \"Đăng ký\" hoặc \"Bắt đầu học\".",
      },
      {
        question: "Tiến độ học tập được lưu như thế nào?",
        answer:
          "Hệ thống tự động lưu tiến độ mỗi khi bạn hoàn thành bài học, bài tập hoặc bài kiểm tra.",
      },
      {
        question: "Tôi có thể học offline không?",
        answer: "Hiện tại ForteX yêu cầu kết nối internet để học. Tính năng học offline đang được phát triển.",
      },
    ],
  },
  {
    title: "Thành tích & Xếp hạng",
    icon: "🏆",
    faqs: [
      {
        question: "Chuỗi ngày học (streak) hoạt động thế nào?",
        answer:
          "Mỗi ngày bạn hoàn thành ít nhất 1 bài học, chuỗi ngày sẽ tăng lên. Nếu bỏ lỡ 1 ngày, chuỗi sẽ bị reset về 0.",
      },
      {
        question: "XP được tính như thế nào?",
        answer:
          "Bạn nhận XP khi hoàn thành bài học, bài tập, đạt thành tích, và duy trì chuỗi ngày học. Số XP phụ thuộc vào độ khó.",
      },
      {
        question: "Bảng xếp hạng cập nhật khi nào?",
        answer: "Bảng xếp hạng được cập nhật theo thời gian thực. Giải đấu được reset mỗi tuần.",
      },
    ],
  },
];

// ─── Contact Options ─────────────────────────────────────────────────────────

const contactOptions = [
  {
    icon: MessageCircle,
    title: "Chat trực tuyến",
    description: "Trò chuyện với đội hỗ trợ ngay",
    action: "Bắt đầu chat",
    color: "bg-green-50",
    iconColor: "text-green-500",
    href: "#",
  },
  {
    icon: Mail,
    title: "Gửi email",
    description: "support@fortex.edu.vn",
    action: "Gửi email",
    color: "bg-blue-50",
    iconColor: "text-blue-500",
    href: "mailto:support@fortex.edu.vn",
  },
  {
    icon: BookOpen,
    title: "Tài liệu hướng dẫn",
    description: "Xem hướng dẫn sử dụng chi tiết",
    action: "Xem tài liệu",
    color: "bg-purple-50",
    iconColor: "text-purple-500",
    href: "#",
  },
];

// ─── FAQ Accordion Item ──────────────────────────────────────────────────────

function FAQItem({ faq }: { faq: FAQ }) {
  const [open, setOpen] = useState(false);

  return (
    <button
      onClick={() => setOpen((v) => !v)}
      className="w-full text-left bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-all"
    >
      <div className="flex items-center justify-between px-5 py-4">
        <p className="font-medium text-gray-900 text-sm pr-4">{faq.question}</p>
        {open ? (
          <ChevronUp className="h-4 w-4 text-gray-400 shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
        )}
      </div>
      <div
        className={cn(
          "px-5 overflow-hidden transition-all duration-200",
          open ? "pb-4 max-h-40" : "max-h-0"
        )}
      >
        <p className="text-sm text-gray-600 leading-relaxed">{faq.answer}</p>
      </div>
    </button>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function HelpPage() {
  const [search, setSearch] = useState("");

  // Filter FAQs by search
  const filteredCategories = faqCategories
    .map((cat) => ({
      ...cat,
      faqs: cat.faqs.filter(
        (f) =>
          !search ||
          f.question.toLowerCase().includes(search.toLowerCase()) ||
          f.answer.toLowerCase().includes(search.toLowerCase())
      ),
    }))
    .filter((cat) => cat.faqs.length > 0);

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="container max-w-4xl mx-auto px-4 py-8 text-center">
          <div className="inline-flex p-3 bg-primary-50 rounded-2xl mb-4">
            <HelpCircle className="h-8 w-8 text-primary-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Trợ giúp & Hỗ trợ</h1>
          <p className="text-gray-500 mt-2">Bạn cần giúp gì? Tìm câu trả lời bên dưới hoặc liên hệ đội hỗ trợ</p>

          {/* Search */}
          <div className="relative max-w-md mx-auto mt-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Tìm kiếm câu hỏi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-11 rounded-2xl border-gray-200 bg-gray-50 h-12"
            />
          </div>
        </div>
      </div>

      <div className="container max-w-4xl mx-auto px-4 py-8 space-y-10">
        {/* Contact Options */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Liên hệ hỗ trợ</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {contactOptions.map((opt) => {
              const Icon = opt.icon;
              return (
                <a
                  key={opt.title}
                  href={opt.href}
                  className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all group"
                >
                  <div className={cn("p-3 rounded-xl w-fit mb-3", opt.color)}>
                    <Icon className={cn("h-5 w-5", opt.iconColor)} />
                  </div>
                  <p className="font-medium text-gray-900">{opt.title}</p>
                  <p className="text-sm text-gray-500 mt-1">{opt.description}</p>
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 mt-3 group-hover:gap-2 transition-all">
                    {opt.action}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </span>
                </a>
              );
            })}
          </div>
        </div>

        {/* FAQ */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Câu hỏi thường gặp</h2>

          {filteredCategories.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center shadow-sm">
              <Search className="h-8 w-8 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Không tìm thấy kết quả cho &ldquo;{search}&rdquo;</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 rounded-xl"
                onClick={() => setSearch("")}
              >
                Xóa tìm kiếm
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredCategories.map((cat) => (
                <div key={cat.title}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">{cat.icon}</span>
                    <h3 className="font-semibold text-gray-800">{cat.title}</h3>
                  </div>
                  <div className="space-y-2">
                    {cat.faqs.map((faq) => (
                      <FAQItem key={faq.question} faq={faq} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
