"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/hooks/queries/use-livestream";
import { useEffect } from "react";

interface Props {
  params: Promise<{ id: string }>;
}

export default function ClassroomPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const { data: session, isLoading: sessionLoading } = useSession(id);

  // Redirect to meet room when session is loaded
  useEffect(() => {
    if (session?.room_name) {
      router.replace(`/rooms/${session.room_name}`);
    }
  }, [session, router]);

  if (sessionLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-sky-500 border-t-transparent mx-auto"></div>
          <div className="text-white">Đang tải phiên học...</div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="text-6xl mb-4">📚</div>
          <div className="text-white text-xl mb-2">Không tìm thấy phiên học</div>
          <p className="text-gray-400">Phiên học có thể đã kết thúc hoặc không tồn tại</p>
        </div>
      </div>
    );
  }

  // Show loading while redirecting
  return (
    <div className="flex h-screen items-center justify-center bg-gray-900">
      <div className="text-center">
        <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-sky-500 border-t-transparent mx-auto"></div>
        <div className="text-white">Đang kết nối phòng học...</div>
      </div>
    </div>
  );
}
