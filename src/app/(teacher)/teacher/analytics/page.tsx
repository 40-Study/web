"use client";

import { useState } from "react";
import {
  Download,
  Users,
  TrendingUp,
  MessageSquare,
  Zap,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProgressBar } from "@/components/ui/progress-bar";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TeacherAnalyticsPage() {
  const [sessionId, setSessionId] = useState("");
  const [inputValue, setInputValue] = useState("");

  const { data: sessionAnalytics, isLoading: isSessionLoading } =
    useLivestreamAnalytics(sessionId);

  const { data: participantData, isLoading: isParticipantsLoading } =
    useParticipantAnalytics(sessionId);

  const isLoading = isSessionLoading || isParticipantsLoading;

  // Build join-timeline chart data from API response
  const timelineData =
    sessionAnalytics?.join_timeline.map((point) => ({
      time: new Date(point.timestamp).toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      participants: point.count,
    })) ?? [];

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
            Nhập Session ID để xem phân tích chi tiết cho một buổi livestream.
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
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">
            Nhập Session ID ở trên để tải thống kê buổi học.
          </p>
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
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Tổng người tham gia</span>
                  <Users className="w-5 h-5 text-muted-foreground" />
                </div>
                <span className="text-2xl font-bold">
                  {sessionAnalytics.total_participants}
                </span>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Đỉnh người tham gia</span>
                  <TrendingUp className="w-5 h-5 text-muted-foreground" />
                </div>
                <span className="text-2xl font-bold">
                  {sessionAnalytics.peak_participants}
                </span>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">TG xem TB</span>
                  <Zap className="w-5 h-5 text-muted-foreground" />
                </div>
                <span className="text-2xl font-bold">
                  {formatSeconds(sessionAnalytics.avg_watch_duration)}
                </span>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Tin nhắn</span>
                  <MessageSquare className="w-5 h-5 text-muted-foreground" />
                </div>
                <span className="text-2xl font-bold">
                  {sessionAnalytics.total_messages}
                </span>
              </CardContent>
            </Card>
          </div>

          {/* Engagement rate */}
          <Card>
            <CardContent className="p-4">
              <p className="text-sm font-medium mb-2">
                Tỷ lệ tương tác:{" "}
                <span className="font-bold">
                  {(sessionAnalytics.engagement_rate * 100).toFixed(1)}%
                </span>
              </p>
              <ProgressBar
                value={sessionAnalytics.engagement_rate * 100}
                size="sm"
              />
            </CardContent>
          </Card>

          {/* Join timeline chart */}
          {timelineData.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Biểu đồ người tham gia theo thời gian</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={timelineData}
                      margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="participants"
                        name="Người tham gia"
                        stroke="#3B82F6"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Participant table */}
      {sessionId && !isLoading && participantData && participantData.participants.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Chi tiết người tham gia ({participantData.total})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr className="border-b text-left">
                  <th className="p-4 text-xs font-medium text-muted-foreground">HỌC SINH</th>
                  <th className="p-4 text-xs font-medium text-muted-foreground">GIỜ VÀO</th>
                  <th className="p-4 text-xs font-medium text-muted-foreground">THỜI GIAN XEM</th>
                  <th className="p-4 text-xs font-medium text-muted-foreground">TIN NHẮN</th>
                  <th className="p-4 text-xs font-medium text-muted-foreground">BÀI NỘP</th>
                </tr>
              </thead>
              <tbody>
                {participantData.participants.map((p) => (
                  <tr
                    key={p.user_id}
                    className="border-b last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <td className="p-4">
                      <div>
                        <p className={cn("font-medium", !p.full_name && "text-muted-foreground")}>
                          {p.full_name || p.user_name}
                        </p>
                        {p.full_name && (
                          <p className="text-xs text-muted-foreground">@{p.user_name}</p>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {new Date(p.join_time).toLocaleTimeString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="p-4">{formatSeconds(p.duration_seconds)}</td>
                    <td className="p-4">{p.messages_sent}</td>
                    <td className="p-4">{p.submissions_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* No data for given session */}
      {sessionId && !isLoading && !sessionAnalytics && (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">
            Không tìm thấy dữ liệu cho session <strong>{sessionId}</strong>.
          </p>
        </Card>
      )}
    </div>
  );
}
