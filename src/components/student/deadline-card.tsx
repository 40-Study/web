"use client";

import { Calendar, Clock, FileText } from "lucide-react";
import type { DeadlineTask } from "@/lib/mock-data/student-dashboard";

interface DeadlineCardProps {
  task: DeadlineTask;
}

export function DeadlineCard({ task }: DeadlineCardProps) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm h-full flex flex-col">
      {/* Badge */}
      <div className="flex items-center justify-between mb-4">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-600 text-xs font-semibold rounded-full">
          SẮP ĐẾN HẠN
        </span>
        <FileText className="w-5 h-5 text-gray-400" />
      </div>

      {/* Content */}
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">{task.title}</h3>

        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            {task.dueDate}
          </span>
          <span className="flex items-center gap-1.5 text-orange-500">
            <Clock className="w-4 h-4" />
            Còn {task.daysLeft} ngày
          </span>
        </div>
      </div>

      {/* Action */}
      <button className="w-full h-12 mt-4 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-xl transition-colors">
        Nộp bài
      </button>
    </div>
  );
}
