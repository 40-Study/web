"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Trophy,
  Plus,
  Clock,
  Users,
  Trash2,
  Send,
  Loader2,
  Eye,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  useContests,
  useDeleteContest,
  usePublishContest,
} from "@/hooks/queries/use-contests";
import type { Contest } from "@/services/contest.service";

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  UPCOMING: "bg-blue-100 text-blue-700",
  ACTIVE: "bg-green-100 text-green-700",
  ENDED: "bg-orange-100 text-orange-700",
  CANCELLED: "bg-red-100 text-red-700",
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Bản nháp",
  UPCOMING: "Sắp diễn ra",
  ACTIVE: "Đang diễn ra",
  ENDED: "Đã kết thúc",
  CANCELLED: "Đã hủy",
};

export default function TeacherContestsPage() {
  const router = useRouter();
  const { data, isLoading } = useContests({ limit: 100 });
  const deleteContest = useDeleteContest();
  const publishContest = usePublishContest();

  const contests = data?.contests ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quản lý cuộc thi</h1>
          <p className="text-muted-foreground mt-1">Tạo và quản lý các cuộc thi cho học sinh</p>
        </div>
        <Link href="/teacher/contests/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Tạo cuộc thi
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : contests.length === 0 ? (
        <Card className="p-12 text-center">
          <Trophy className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
          <h3 className="font-semibold text-lg">Chưa có cuộc thi nào</h3>
          <p className="text-muted-foreground mt-1">Tạo cuộc thi đầu tiên cho học sinh</p>
          <Link href="/teacher/contests/create">
            <Button className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Tạo cuộc thi
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {contests.map((contest) => (
            <Card key={contest.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold truncate">{contest.title}</h3>
                    <Badge className={cn("text-xs shrink-0", STATUS_COLORS[contest.status])}>
                      {STATUS_LABELS[contest.status]}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {new Date(contest.start_time).toLocaleDateString("vi-VN")}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {contest.participant_count} thí sinh
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {contest.status === "DRAFT" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => publishContest.mutate(contest.id)}
                      disabled={publishContest.isPending}
                    >
                      <Send className="h-3.5 w-3.5 mr-1" />
                      Công bố
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/contests/${contest.slug}`)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Xem
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => deleteContest.mutate(contest.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Xoá
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
