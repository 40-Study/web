import Link from 'next/link';
import RoomClient from './RoomClient';
import { joinLivestream } from './join-livestream';
import { forbiddenFlagsFromCode } from '@/lib/meet/forbidden-code';

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

export default async function RoomPage({
  params,
}: {
  params: Promise<{ roomName: string }>;
}) {
  const { roomName } = await params;
  const { result: join, forbiddenCode } = await joinLivestream(roomName);

  if (!join?.token || !join?.server_url) {
    // I2 (review vòng 2 web PR #18): trước đây chỉ phân nhánh NOT_SESSION_MEMBER
    // — học sinh bị đuổi (KICKED) rồi F5 thấy nhầm thông báo chung chung.
    const { isNotMember, isKicked } = forbiddenFlagsFromCode(forbiddenCode);

    const heading = isNotMember
      ? 'Bạn không thuộc lớp này.'
      : isKicked
        ? 'Bạn đã bị mời ra khỏi buổi học này.'
        : 'Không thể tham gia buổi học trực tiếp này.';
    const detail = isNotMember
      ? 'Buổi live này chỉ dành cho học sinh của lớp được gán. Liên hệ giáo viên nếu bạn nghĩ đây là nhầm lẫn.'
      : isKicked
        ? 'Giáo viên đã yêu cầu bạn rời khỏi buổi học. Liên hệ giáo viên nếu bạn nghĩ đây là nhầm lẫn.'
        : 'Buổi học có thể chưa bắt đầu, đã kết thúc, hoặc bạn chưa đăng nhập.';

    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950 px-4 text-center text-white">
        <div>
          <p className="text-lg font-medium">{heading}</p>
          <p className="mt-2 text-sm text-gray-400">{detail}</p>
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
