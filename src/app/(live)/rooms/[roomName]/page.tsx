import Link from 'next/link';
import RoomClient from './RoomClient';
import { serverApi, HttpError } from '@/lib/server-api';

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

interface JoinAttempt {
  result: JoinLivestreamResult | null;
  /**
   * Mã lỗi 403 uy quyền (issue #58 review vòng 2, §7.4) — `NOT_SESSION_MEMBER`,
   * `KICKED`, `NOT_SESSION_HOST`, v.v. Chỉ có giá trị khi backend trả 403; các
   * lỗi khác (401 chưa đăng nhập, phiên chưa live) không có mã này.
   */
  forbiddenCode?: string;
}

async function joinLivestream(sessionId: string): Promise<JoinAttempt> {
  try {
    const me = await serverApi.get<CurrentUser>('/auth/me');
    // Không gửi user_id trong body — backend lấy danh tính từ access token
    // (issue #58 review vòng 2, §7.1). Gửi user_id ở đây cho phép mạo danh
    // người khác khi tham gia phiên live.
    const result = await serverApi.post<JoinLivestreamResult>(`/livestream/${sessionId}/join`, {
      name: me.full_name || me.username,
    });
    return { result };
  } catch (err) {
    if (err instanceof HttpError && err.status === 403) {
      return { result: null, forbiddenCode: err.body?.message };
    }
    return { result: null };
  }
}

export default async function RoomPage({
  params,
}: {
  params: Promise<{ roomName: string }>;
}) {
  const { roomName } = await params;
  const { result: join, forbiddenCode } = await joinLivestream(roomName);

  if (!join?.token || !join?.server_url) {
    const isNotMember = forbiddenCode === 'NOT_SESSION_MEMBER';

    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950 px-4 text-center text-white">
        <div>
          <p className="text-lg font-medium">
            {isNotMember
              ? 'Bạn không thuộc lớp này.'
              : 'Không thể tham gia buổi học trực tiếp này.'}
          </p>
          <p className="mt-2 text-sm text-gray-400">
            {isNotMember
              ? 'Buổi live này chỉ dành cho học sinh của lớp được gán. Liên hệ giáo viên nếu bạn nghĩ đây là nhầm lẫn.'
              : 'Buổi học có thể chưa bắt đầu, đã kết thúc, hoặc bạn chưa đăng nhập.'}
          </p>
          <Link
            href="/my-courses"
            className="mt-6 inline-block rounded-lg bg-primary-600 px-6 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            Quay lại danh sách lớp học
          </Link>
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
