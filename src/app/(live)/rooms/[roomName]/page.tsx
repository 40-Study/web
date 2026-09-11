import RoomClient from './RoomClient';
import { serverApi } from '@/lib/server-api';

/**
 * H5 fix (plans/reports/code-reviewer-260909-1340-web-logic-integration.md):
 * LiveKit token trước đây đi qua query string (?token=...) — lưu vào lịch sử
 * trình duyệt / access log / Referer. Không có nơi nào trong web thực sự
 * truyền token qua URL này (đã grep), nên route trước đó luôn nhận
 * token="" và không hoạt động.
 *
 * Fix: lấy token qua POST /livestream/:id/join ở SERVER (cookie httpOnly
 * forward qua serverApi), sessionId = roomName. Token/serverUrl không bao
 * giờ xuất hiện trên URL.
 */

interface JoinLivestreamResult {
  token?: string;
  server_url?: string;
  room_name?: string;
}

interface CurrentUser {
  id: string;
  full_name?: string;
  username: string;
}

async function joinLivestream(sessionId: string): Promise<JoinLivestreamResult | null> {
  try {
    const me = await serverApi.get<CurrentUser>('/auth/me');
    const result = await serverApi.post<JoinLivestreamResult>(`/livestream/${sessionId}/join`, {
      user_id: me.id,
      name: me.full_name || me.username,
    });
    return result;
  } catch {
    return null;
  }
}

export default async function RoomPage({
  params,
}: {
  params: Promise<{ roomName: string }>;
}) {
  const { roomName } = await params;
  const join = await joinLivestream(roomName);

  if (!join?.token || !join?.server_url) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950 px-4 text-center text-white">
        <div>
          <p className="text-lg font-medium">Không thể tham gia buổi học trực tiếp này.</p>
          <p className="mt-2 text-sm text-gray-400">
            Buổi học có thể chưa bắt đầu, đã kết thúc, hoặc bạn chưa đăng nhập.
          </p>
        </div>
      </div>
    );
  }

  return (
    <RoomClient
      sessionId={roomName}
      token={join.token}
      serverUrl={join.server_url}
      livekitRoomName={join.room_name ?? ''}
    />
  );
}
