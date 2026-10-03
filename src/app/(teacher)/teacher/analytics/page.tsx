"use client";

import { useState } from "react";
import {
  Download,
  Users,
  TrendingUp,
  MessageSquare,
  Zap,
  BarChart3,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useLivestreamAnalytics,
  useParticipantAnalytics,
} from "@/hooks/queries/use-analytics";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatSeconds(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}m ${s}s`;
}

// Nhãn vai trò theo `model.ParticipantRole` ở backend; vai lạ hiện nguyên giá trị thay vì mất dòng.
const ROLE_LABELS: Record<string, string> = {
  teacher: "Giảng viên",
  assistant: "Trợ giảng",
  student: "Học viên",
  viewer: "Người xem",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TeacherAnalyticsPage() {
  const [sessionId, setSessionId] = useState("");
  const [inputValue, setInputValue] = useState("");

  const {
    data: sessionAnalytics,
    isLoading: isSessionLoading,
    isError: isSessionError,
  } = useLivestreamAnalytics(sessionId);

  const { data: participantData, isLoading: isParticipantsLoading } =
    useParticipantAnalytics(sessionId);

  const isLoading = isSessionLoading || isParticipantsLoading;

  // QA hồi quy B-01: trước đây trang đọc join_timeline / participants[] mà backend không trả nên
  // crash với Session ID hợp lệ. Số liệu dưới đây khớp đúng dto.AnalyticsResponseDTO và
  // dto.ParticipantAnalyticsDTO; biểu đồ theo thời gian và bảng từng người đã bỏ vì không có nguồn dữ liệu.
  const roleRows = Object.entries(participantData?.by_role ?? {}).sort(([a], [b]) =>
    a.localeCompare(b)
  );

  const handleSearch = () => {
    setSessionId(inputValue.trim());
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Thống kê phiên học</h1>
          <p className="text-sm text-muted-foreground">
            Nhập Session ID để xem phân tích chi tiết cho một buổi học trực tiếp.
          </p>
        </div>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Tải báo cáo PDF
        </Button>
      </div>

      {/* Session ID input */}
      <div className="flex gap-3 max-w-md">
        <Input
          placeholder="Nhập Session ID..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <Button onClick={handleSearch} disabled={!inputValue.trim()}>
          Xem thống kê
        </Button>
      </div>

      {/* Empty state */}
      {!sessionId && (
        <Card>
          <EmptyState
            icon={BarChart3}
            title="Chưa có dữ liệu thống kê"
            description="Nhập Session ID ở trên để tải thống kê buổi học."
          />
        </Card>
      )}

      {/* Loading */}
      {sessionId && isLoading && (
        <div className="flex justify-center p-12">
          <Loader2 className="animate-spin h-8 w-8 text-muted-foreground" />
        </div>
      )}

      {/* Session KPI cards */}
      {sessionId && !isLoading && sessionAnalytics && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Tổng lượt xem</span>
                <Users className="w-5 h-5 text-muted-foreground" />
              </div>
              <span className="text-2xl font-bold">{sessionAnalytics.total_viewers ?? 0}</span>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Đỉnh người xem</span>
                <TrendingUp className="w-5 h-5 text-muted-foreground" />
              </div>
              <span className="text-2xl font-bold">{sessionAnalytics.peak_viewers ?? 0}</span>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">TG xem TB</span>
                <Zap className="w-5 h-5 text-muted-foreground" />
              </div>
              <span className="text-2xl font-bold">
                {formatSeconds(sessionAnalytics.avg_watch_time_secs ?? 0)}
              </span>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Tin nhắn</span>
                <MessageSquare className="w-5 h-5 text-muted-foreground" />
              </div>
              <span className="text-2xl font-bold">{sessionAnalytics.total_messages ?? 0}</span>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Participant summary by role */}
      {sessionId && !isLoading && participantData && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Người tham gia</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-6 text-sm">
              <p>
                Đang trong phòng:{" "}
                <span className="font-bold">{participantData.active_count ?? 0}</span>
              </p>
              <p>
                Tổng lượt vào phòng:{" "}
                <span className="font-bold">{participantData.total_joined ?? 0}</span>
              </p>
            </div>
            {roleRows.length > 0 ? (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr className="border-b text-left">
                    <th className="p-3 text-xs font-medium text-muted-foreground">VAI TRÒ</th>
                    <th className="p-3 text-xs font-medium text-muted-foreground">SỐ NGƯỜI</th>
                  </tr>
                </thead>
                <tbody>
                  {roleRows.map(([role, count]) => (
                    <tr key={role} className="border-b last:border-0">
                      <td className="p-3">{ROLE_LABELS[role] ?? role}</td>
                      <td className="p-3">{count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-muted-foreground">Chưa có ai tham gia buổi học này.</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* No data for given session (không tồn tại, không có quyền, hoặc lỗi tải) */}
      {sessionId && !isLoading && !sessionAnalytics && (
        <Card>
          <EmptyState
            icon={BarChart3}
            title={isSessionError ? "Không thể tải thống kê" : "Không tìm thấy dữ liệu"}
            description={
              <>
                Không có dữ liệu cho session <strong>{sessionId}</strong>. Kiểm tra lại Session ID và
                chắc chắn đây là buổi học của bạn.
              </>
            }
          />
        </Card>
      )}
    </div>
  );
}
