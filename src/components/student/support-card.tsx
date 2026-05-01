"use client";

import Link from "next/link";
import { MessageCircle, Sparkles } from "lucide-react";

interface SupportCardProps {
  variant?: "default" | "gradient";
}

export function SupportCard({ variant = "gradient" }: SupportCardProps) {
  if (variant === "gradient") {
    return (
      <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-5 shadow-sm relative overflow-hidden">
        {/* Decorative */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
          </div>

          <p className="text-xs font-semibold text-white/80 uppercase tracking-wide mb-1">
            Cần hỗ trợ?
          </p>
          <p className="text-sm font-semibold text-white mb-4">
            Hỏi đáp trực tiếp với mentor về lộ trình học
          </p>

          <Link
            href="/ai-chat"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white text-primary-600 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            Bắt đầu chat
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
          <MessageCircle className="w-4 h-4 text-primary-600" />
        </div>
        <span className="text-xs font-bold text-gray-900 uppercase tracking-wide">
          Hỗ trợ
        </span>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Có thắc mắc? Chat với AI hoặc mentor ngay.
      </p>

      <Link
        href="/ai-chat"
        className="block w-full text-center px-4 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 transition-colors"
      >
        Bắt đầu chat
      </Link>
    </div>
  );
}
