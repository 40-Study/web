"use client";

/**
 * Trang Trợ giúp công khai (F2, QA vòng 2). Trước đây nằm ở (app)/help và bị middleware bắt đăng
 * nhập, nên khách không đọc được FAQ và link "Trợ giúp" từ trang công khai đá về /login.
 *
 * Nội dung là FAQ TĨNH (faq-data.ts), chỉ nêu những tính năng đang có thật. Đã bỏ: ô "Chat trực
 * tuyến" và "Tài liệu hướng dẫn" (href="#", không có kênh/tài liệu nào), các câu về chuỗi ngày
 * học/XP/giải đấu (không kiểm chứng được) và mọi cam kết hoàn tiền theo số ngày cố định.
 */

import { useState } from "react";
import Link from "next/link";
import { HelpCircle, Mail, ChevronDown, ChevronUp, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { siteConfig } from "@/lib/constants";
import { SUPPORT_EMAIL, filterFaqCategories, type FAQ } from "./faq-data";

function FAQItem({ faq }: { faq: FAQ }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <span className="font-medium text-gray-900 text-sm pr-4">{faq.question}</span>
        {open ? (
          <ChevronUp className="h-4 w-4 text-gray-400 shrink-0" aria-hidden="true" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" aria-hidden="true" />
        )}
      </button>
      {open && (
        <p className="px-5 pb-4 text-sm text-gray-600 leading-relaxed">{faq.answer}</p>
      )}
    </div>
  );
}

export default function HelpPage() {
  const [search, setSearch] = useState("");
  const filteredCategories = filterFaqCategories(search);

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="bg-white border-b border-gray-100">
        <div className="container max-w-4xl mx-auto px-4 py-8 text-center">
          <div className="inline-flex p-3 bg-primary-50 rounded-2xl mb-4">
            <HelpCircle className="h-8 w-8 text-primary-600" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Trợ giúp & Hỗ trợ</h1>
          <p className="text-gray-500 mt-2">
            Tìm câu trả lời bên dưới hoặc liên hệ đội hỗ trợ của {siteConfig.name}
          </p>

          <div className="relative max-w-md mx-auto mt-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" aria-hidden="true" />
            <Input
              aria-label="Tìm kiếm câu hỏi"
              placeholder="Tìm kiếm câu hỏi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-11 rounded-2xl border-gray-200 bg-gray-50 h-12"
            />
          </div>
        </div>
      </div>

      <div className="container max-w-4xl mx-auto px-4 py-8 space-y-10">
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Liên hệ hỗ trợ</h2>
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="flex items-center gap-4 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all"
          >
            <div className="p-3 rounded-xl bg-blue-50">
              <Mail className="h-5 w-5 text-blue-500" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-gray-900">Gửi email cho đội hỗ trợ</p>
              <p className="text-sm text-gray-500 break-all">{SUPPORT_EMAIL}</p>
            </div>
          </a>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Câu hỏi thường gặp</h2>

          {filteredCategories.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center shadow-sm">
              <Search className="h-8 w-8 text-gray-300 mx-auto mb-3" aria-hidden="true" />
              <p className="text-gray-500">Không tìm thấy kết quả cho &ldquo;{search}&rdquo;</p>
              <p className="text-sm text-gray-400 mt-1">
                Bạn có thể gửi câu hỏi tới {SUPPORT_EMAIL}.
              </p>
              <Button variant="outline" size="sm" className="mt-3 rounded-xl" onClick={() => setSearch("")}>
                Xóa tìm kiếm
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredCategories.map((cat) => (
                <div key={cat.title}>
                  <h3 className="font-semibold text-gray-800 mb-3">{cat.title}</h3>
                  <div className="space-y-2">
                    {cat.faqs.map((faq) => (
                      <FAQItem key={faq.question} faq={faq} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <p className="text-sm text-gray-500 text-center">
          Xem thêm <Link href="/terms" className="underline">Điều khoản dịch vụ</Link> và{" "}
          <Link href="/privacy" className="underline">Chính sách bảo mật</Link>.
        </p>
      </div>
    </div>
  );
}
