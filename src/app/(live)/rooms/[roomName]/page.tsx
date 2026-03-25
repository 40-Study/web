import RoomClient from './RoomClient';

export default async function RoomPage({
  params,
  searchParams,
}: {
  params: Promise<{ roomName: string }>;
  searchParams: Promise<{
    token?: string;
    serverUrl?: string;
    roomName?: string;
  }>;
}) {
  const { roomName } = await params;
  const sp = await searchParams;

  return (
    <RoomClient
      sessionId={roomName}
      token={sp.token ?? ''}
      serverUrl={sp.serverUrl ?? ''}
      livekitRoomName={sp.roomName ?? ''}
    />
  );
}
