"use client";

import { MessageSquare } from "lucide-react";

export default function DiscussionsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 text-center">
      <div className="mx-auto w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mb-6">
        <MessageSquare className="w-8 h-8 text-primary-500" />
      </div>
      <h1 className="text-2xl font-bold text-slate-900 mb-3">Diễn đàn thảo luận</h1>
      <p className="text-slate-500 max-w-md mx-auto">
        Tính năng đang được phát triển. Bạn sẽ sớm có thể trao đổi và chia sẻ kiến thức cùng cộng đồng.
      </p>
    </div>
  );
}
