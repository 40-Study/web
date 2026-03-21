"use client";

import { Users, Video, ArrowRight } from "lucide-react";
import type { LiveClass } from "@/lib/mock-data/student-dashboard";

interface LiveClassCardProps {
  liveClass: LiveClass;
}

export function LiveClassCard({ liveClass }: LiveClassCardProps) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm h-full flex flex-col">
      {/* Badge */}
      <div className="flex items-center justify-between mb-4">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-100 text-orange-600 text-xs font-semibold rounded-full">
          <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
          LIVE {liveClass.startTime}
        </span>
        <Video className="w-5 h-5 text-gray-400" />
      </div>

      {/* Content */}
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          {liveClass.title}
        </h3>

        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-xs">
              M
            </span>
            Mentor: {liveClass.mentor}
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            {liveClass.participants} đang tham gia
          </span>
        </div>
      </div>

      {/* Action */}
      <button className="w-full h-12 mt-4 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2">
        <ArrowRight className="w-5 h-5" />
        Vào lớp
      </button>
    </div>
  );
}
