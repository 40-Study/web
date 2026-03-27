"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BarChart3 } from "lucide-react";

interface SubjectScore {
  name: string;
  score1: number;
  score2: number;
  score3: number;
}

interface AchievementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const mockSubjectScores: SubjectScore[] = [
  { name: "Toán", score1: 8.5, score2: 9.0, score3: 8.8 },
  { name: "Tiếng Việt", score1: 7.8, score2: 8.2, score3: 8.5 },
  { name: "Đạo đức", score1: 9.0, score2: 9.2, score3: 9.5 },
  { name: "TN&XH", score1: 8.2, score2: 8.0, score3: 8.6 },
  { name: "Tiếng Anh", score1: 7.5, score2: 8.0, score3: 8.3 },
];

export function AchievementModal({ open, onOpenChange }: AchievementModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader className="pb-4 border-b border-gray-100">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <BarChart3 className="w-5 h-5 text-primary-600" />
            THÀNH TÍCH HỌC TẬP
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          {/* Score Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 bg-gray-50 rounded-tl-lg">
                    Môn học
                  </th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700 bg-gray-50">
                    Điểm 1
                  </th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700 bg-gray-50">
                    Điểm 2
                  </th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700 bg-gray-50 rounded-tr-lg">
                    Điểm 3
                  </th>
                </tr>
              </thead>
              <tbody>
                {mockSubjectScores.map((subject, index) => (
                  <tr
                    key={subject.name}
                    className={`border-b border-gray-100 ${
                      index === mockSubjectScores.length - 1 ? "border-b" : ""
                    }`}
                  >
                    <td className="py-3 px-4 font-medium text-gray-800">{subject.name}</td>
                    <td className="text-center py-3 px-4">
                      <span
                        className={`inline-flex items-center justify-center w-10 h-8 rounded-lg font-semibold text-sm ${
                          subject.score1 >= 8.5
                            ? "bg-green-100 text-green-700"
                            : subject.score1 >= 7.0
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                        }`}
                      >
                        {subject.score1}
                      </span>
                    </td>
                    <td className="text-center py-3 px-4">
                      <span
                        className={`inline-flex items-center justify-center w-10 h-8 rounded-lg font-semibold text-sm ${
                          subject.score2 >= 8.5
                            ? "bg-green-100 text-green-700"
                            : subject.score2 >= 7.0
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                        }`}
                      >
                        {subject.score2}
                      </span>
                    </td>
                    <td className="text-center py-3 px-4">
                      <span
                        className={`inline-flex items-center justify-center w-10 h-8 rounded-lg font-semibold text-sm ${
                          subject.score3 >= 8.5
                            ? "bg-green-100 text-green-700"
                            : subject.score3 >= 7.0
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                        }`}
                      >
                        {subject.score3}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="mt-4 flex items-center gap-6 text-xs text-gray-500">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-green-100 border border-green-200"></span>
              <span>Giỏi (≥8.5)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-yellow-100 border border-yellow-200"></span>
              <span>Khá (≥7.0)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-red-100 border border-red-200"></span>
              <span>Trung bình (&lt;7.0)</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
