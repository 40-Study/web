"use client";

import { MessageCircle } from "lucide-react";

export function MentorChatWidget() {
  return (
    <div className="bg-gradient-to-br from-primary-600 to-secondary-600 rounded-2xl p-5 text-white shadow-sm relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <MessageCircle className="w-4 h-4 text-white/80" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-white/80">
            Cần hỗ trợ?
          </span>
        </div>

        <p className="text-sm font-semibold mb-1">Hỏi đáp trực tiếp với mentor</p>
        <p className="text-xs text-white/70 mb-4">
          về lộ trình học và các vấn đề kỹ thuật
        </p>

        <button className="w-full py-2.5 bg-white text-primary-700 text-sm font-semibold rounded-xl hover:bg-white/90 transition-colors">
          Bắt đầu chat
        </button>
      </div>
    </div>
  );
}
