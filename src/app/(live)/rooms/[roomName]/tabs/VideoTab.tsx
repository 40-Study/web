'use client';

import {
  LiveKitRoom,
  RoomAudioRenderer,
  useTracks,
  LayoutContextProvider,
  useDataChannel,
  useLocalParticipant,
  TrackToggle,
  ParticipantTile,
  useConnectionState,
  useRoomContext,
} from '@livekit/components-react';
import { Track, RoomEvent, ConnectionState, VideoPresets, DataPacket_Kind } from 'livekit-client';
import { useParticipants } from '@livekit/components-react';
import React, { useEffect, useState, useRef } from 'react';
import { useIsMobile } from '@/lib/meet/use-is-mobile';

interface AssignmentPublishedEvent {
  type: 'assignment_published';
  assignment_id: string;
  title: string;
  language: string[];
  difficulty: string;
  timestamp: string;
}

interface VideoTabProps {
  token: string;
  serverUrl: string;
  onAssignmentReceived?: (event: AssignmentPublishedEvent) => void;
  onWhiteboardEvent?: (event: any) => void;
  onWhiteboardBroadcasterReady?: (broadcast: (event: any) => void) => void;
  onParticipantsChange?: (participants: {identity: string; name: string}[]) => void;
  onParticipantLeft?: (participant: {identity: string; name: string}) => void;
  onLeave?: () => void;
  pip?: boolean;
  isHost?: boolean;
  hostId?: string;
  currentUserName?: string;
}

export default function VideoTab({
  token,
  serverUrl,
  onAssignmentReceived,
  onWhiteboardEvent,
  onWhiteboardBroadcasterReady,
  onParticipantsChange,
  onParticipantLeft,
  onLeave,
  pip = false,
  isHost = false,
  hostId,
  currentUserName = 'User',
}: VideoTabProps) {
  const [showParticipants, setShowParticipants] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [pendingShareRequest, setPendingShareRequest] = useState(false);
  const [shareApproved, setShareApproved] = useState(false);
  const [pendingLeaveRequest, setPendingLeaveRequest] = useState(false);
  const [leaveApproved, setLeaveApproved] = useState(false);
  const broadcastRef = useRef<((event: any) => void) | null>(null);

  const handleToggleHand = () => {
    const newState = !handRaised;
    setHandRaised(newState);
    // Broadcast hand raise/lower event
    if (broadcastRef.current) {
      broadcastRef.current({ type: 'hand_raised', name: currentUserName, raised: newState });
    }
  };

  // Request to share screen
  const handleRequestShare = () => {
    if (broadcastRef.current) {
      broadcastRef.current({ type: 'share_request', name: currentUserName });
      setPendingShareRequest(true);
    }
  };

  // Handle share response
  const handleShareResponse = (approved: boolean) => {
    setPendingShareRequest(false);
    if (approved) {
      setShareApproved(true);
    }
  };

  // Request to leave room
  const handleRequestLeave = () => {
    if (isHost) {
      // Host can leave directly
      onLeave?.();
    } else {
      if (broadcastRef.current) {
        broadcastRef.current({ type: 'leave_request', name: currentUserName });
        setPendingLeaveRequest(true);
      }
    }
  };

  // Handle leave response
  const handleLeaveResponse = (approved: boolean) => {
    setPendingLeaveRequest(false);
    if (approved) {
      setLeaveApproved(true);
    }
  };

  // Auto-leave when approved
  useEffect(() => {
    if (leaveApproved) {
      onLeave?.();
    }
  }, [leaveApproved, onLeave]);

  const handleBroadcasterReady = (broadcast: (event: any) => void) => {
    broadcastRef.current = broadcast;
    onWhiteboardBroadcasterReady?.(broadcast);
  };

  return (
    <LiveKitRoom
      serverUrl={serverUrl}
      token={token}
      connect={true}
      style={{ height: '100%', background: '#0a0a0a' }}
      options={{
        // Camera: lower quality to save bandwidth
        videoCaptureDefaults: {
          resolution: VideoPresets.h540.resolution,
        },
        publishDefaults: {
          videoCodec: 'vp8',
          // Screen share: high quality encoding
          screenShareEncoding: {
            maxBitrate: 3_000_000, // 3 Mbps for clear screen share
            maxFramerate: 30,
          },
        },
      }}
    >
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>
      <LayoutContextProvider>
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <VideoContent pip={pip} handRaised={handRaised} />
          {!pip && (
            <BottomBar
              onParticipantsClick={() => setShowParticipants(!showParticipants)}
              showParticipants={showParticipants}
              isHost={isHost}
              hostId={hostId}
              handRaised={handRaised}
              onToggleHand={handleToggleHand}
              onLeave={handleRequestLeave}
              onRequestShare={handleRequestShare}
              pendingShareRequest={pendingShareRequest}
              shareApproved={shareApproved}
              onShareStarted={() => setShareApproved(false)}
              pendingLeaveRequest={pendingLeaveRequest}
              onDirectLeave={onLeave}
              onDirectShare={() => setShareApproved(true)}
            />
          )}
          {showParticipants && !pip && (
            <ParticipantListPanel onClose={() => setShowParticipants(false)} hostId={hostId} />
          )}
        </div>
        <AssignmentReceiver onAssignmentReceived={onAssignmentReceived} />
        <WhiteboardReceiver
          onWhiteboardEvent={onWhiteboardEvent}
          onBroadcasterReady={handleBroadcasterReady}
          currentUserName={currentUserName}
          isHost={isHost}
          onShareResponse={handleShareResponse}
          onLeaveResponse={handleLeaveResponse}
        />
        <ParticipantsReporter onParticipantsChange={onParticipantsChange} />
        <ParticipantLeaveNotifier onParticipantLeft={onParticipantLeft} />
      </LayoutContextProvider>
    </LiveKitRoom>
  );
}

/** Listen to LiveKit data channel for assignment_published events */
function AssignmentReceiver({
  onAssignmentReceived,
}: {
  onAssignmentReceived?: (event: AssignmentPublishedEvent) => void;
}) {
  useDataChannel('collaboration', (msg) => {
    try {
      const text = new TextDecoder().decode(msg.payload);
      const data = JSON.parse(text);
      if (data.type === 'assignment_published') {
        onAssignmentReceived?.(data as AssignmentPublishedEvent);
      }
    } catch {
      // ignore malformed messages
    }
  });

  return null;
}

/** Listen to LiveKit data channel for whiteboard events */
function WhiteboardReceiver({
  onWhiteboardEvent,
  onBroadcasterReady,
  currentUserName,
  isHost,
  onShareResponse,
  onLeaveResponse,
}: {
  onWhiteboardEvent?: (event: any) => void;
  onBroadcasterReady?: (broadcast: (event: any) => void) => void;
  currentUserName?: string;
  isHost?: boolean;
  onShareResponse?: (approved: boolean) => void;
  onLeaveResponse?: (approved: boolean) => void;
}) {
  const room = useRoomContext();
  const connectionState = useConnectionState();
  const onWhiteboardEventRef = useRef(onWhiteboardEvent);
  const onBroadcasterReadyRef = useRef(onBroadcasterReady);
  const onShareResponseRef = useRef(onShareResponse);
  const onLeaveResponseRef = useRef(onLeaveResponse);
  const roomRef = useRef(room);
  const connectionRef = useRef(connectionState);

  // Update refs
  onWhiteboardEventRef.current = onWhiteboardEvent;
  onBroadcasterReadyRef.current = onBroadcasterReady;
  onShareResponseRef.current = onShareResponse;
  onLeaveResponseRef.current = onLeaveResponse;
  roomRef.current = room;
  connectionRef.current = connectionState;

  // Listen for data received events
  useEffect(() => {
    if (!room) return;

    const handleDataReceived = (payload: Uint8Array, participant?: any, kind?: DataPacket_Kind, topic?: string) => {
      if (topic !== 'whiteboard') return;

      try {
        const text = new TextDecoder().decode(payload);
        const data = JSON.parse(text);

        // Handle share_response for students
        if (data.type === 'share_response' && !isHost && data.name === currentUserName) {
          onShareResponseRef.current?.(data.approved);
        }

        // Handle leave_response for students
        if (data.type === 'leave_response' && !isHost && data.name === currentUserName) {
          onLeaveResponseRef.current?.(data.approved);
        }

        // Forward to whiteboard
        onWhiteboardEventRef.current?.(data);
      } catch {}
    };

    room.on(RoomEvent.DataReceived, handleDataReceived);
    return () => {
      room.off(RoomEvent.DataReceived, handleDataReceived);
    };
  }, [room, isHost, currentUserName]);

  // Register broadcast function
  useEffect(() => {
    const broadcast = async (event: any) => {
      const currentRoom = roomRef.current;
      if (connectionRef.current !== ConnectionState.Connected) return;
      if (!currentRoom?.localParticipant) return;

      try {
        const encoder = new TextEncoder();
        const payload = encoder.encode(JSON.stringify(event));

        // Cursor: unreliable (fast), Others: reliable
        const reliable = event.type !== 'cursor';
        await currentRoom.localParticipant.publishData(payload, { reliable, topic: 'whiteboard' });
      } catch {}
    };

    onBroadcasterReadyRef.current?.(broadcast);
  }, []);

  return null;
}

/** Reports participants list to parent */
function ParticipantsReporter({
  onParticipantsChange,
}: {
  onParticipantsChange?: (participants: {identity: string; name: string}[]) => void;
}) {
  const participants = useParticipants();
  const { localParticipant } = useLocalParticipant();
  const onChangeRef = useRef(onParticipantsChange);
  onChangeRef.current = onParticipantsChange;

  useEffect(() => {
    // Start with local participant
    const list: {identity: string; name: string}[] = [];

    if (localParticipant) {
      list.push({
        identity: localParticipant.identity,
        name: localParticipant.name || localParticipant.identity || 'You',
      });
    }

    // Add remote participants (exclude local to avoid duplicates)
    participants.forEach(p => {
      if (!localParticipant || p.identity !== localParticipant.identity) {
        list.push({
          identity: p.identity,
          name: p.name || p.identity,
        });
      }
    });

    onChangeRef.current?.(list);
  }, [participants, localParticipant]);

  return null;
}

/** Notifies when a participant leaves the room */
function ParticipantLeaveNotifier({
  onParticipantLeft,
}: {
  onParticipantLeft?: (participant: {identity: string; name: string}) => void;
}) {
  const participants = useParticipants();
  const prevParticipantsRef = useRef<Map<string, string>>(new Map());
  const onLeftRef = useRef(onParticipantLeft);
  onLeftRef.current = onParticipantLeft;
  const initializedRef = useRef(false);

  useEffect(() => {
    const currentMap = new Map<string, string>();
    participants.forEach(p => {
      currentMap.set(p.identity, p.name || p.identity);
    });

    // Skip first render to avoid false positives
    if (!initializedRef.current) {
      initializedRef.current = true;
      prevParticipantsRef.current = currentMap;
      return;
    }

    // Find participants who left
    prevParticipantsRef.current.forEach((name, identity) => {
      if (!currentMap.has(identity)) {
        onLeftRef.current?.({ identity, name });
      }
    });

    prevParticipantsRef.current = currentMap;
  }, [participants]);

  return null;
}

function VideoContent({ pip, handRaised }: { pip?: boolean; handRaised?: boolean }) {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  );
  const connectionState = useConnectionState();
  const { localParticipant } = useLocalParticipant();
  const remoteParticipants = useParticipants();


  // Show local participant placeholder immediately on connect even before any tracks
  const showLocalFallback = tracks.length === 0 && connectionState === ConnectionState.Connected;

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0a0a',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {tracks.length === 0 && !showLocalFallback && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            color: 'rgba(255,255,255,0.4)',
          }}
        >
          <div
            style={{
              width: pip ? '48px' : '80px',
              height: pip ? '48px' : '80px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: pip ? '1.2rem' : '2rem',
            }}
          >
            🎥
          </div>
          {!pip && <span style={{ fontSize: '0.85rem' }}>Đang kết nối...</span>}
        </div>
      )}
      {showLocalFallback && (
        <LocalParticipantFallback participant={localParticipant} pip={pip} />
      )}
      {tracks.length > 0 && (
        <VideoGrid
          tracks={tracks}
          pip={pip}
          remoteParticipants={remoteParticipants}
          localParticipant={localParticipant}
        />
      )}
      <RoomAudioRenderer />

      {/* Hand raised indicator */}
      {handRaised && (
        <div
          style={{
            position: 'absolute',
            top: pip ? '4px' : '12px',
            left: pip ? '4px' : '12px',
            background: 'rgba(255,200,0,0.9)',
            borderRadius: '8px',
            padding: pip ? '4px 6px' : '6px 10px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        >
          <span style={{ fontSize: pip ? '12px' : '16px' }}>✋</span>
          {!pip && <span style={{ fontSize: '12px', fontWeight: 600, color: '#000' }}>Giơ tay</span>}
        </div>
      )}
    </div>
  );
}

function LocalParticipantFallback({ participant, pip }: { participant: any; pip?: boolean }) {
  const name = participant?.name || participant?.identity || '?';
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a1a1a' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{
          width: pip ? '40px' : '80px',
          height: pip ? '40px' : '80px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #ff6352, #ff8a7a)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: pip ? '1rem' : '1.75rem',
          fontWeight: 700,
          color: '#fff',
        }}>
          {name[0].toUpperCase()}
        </div>
        {!pip && (
          <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>{name}</span>
        )}
      </div>
    </div>
  );
}

/** Arranges multiple video tracks in a responsive grid layout */
function VideoGrid({
  tracks,
  pip,
  remoteParticipants = [],
  localParticipant,
}: {
  tracks: any[];
  pip?: boolean;
  remoteParticipants?: any[];
  localParticipant?: any;
}) {
  // Layout dựng bằng inline style nên không dùng được breakpoint Tailwind —
  // dùng hook riêng để quyết định grid 1 cột / sidebar mỏng trên mobile (H-07).
  const isMobile = useIsMobile();

  // Separate screen share tracks from camera tracks
  const screenShareTracks = tracks.filter(t => t.source === Track.Source.ScreenShare);
  const cameraTracks = tracks.filter(t => t.source !== Track.Source.ScreenShare);

  // Find participants that have tracks
  const participantsWithTracks = new Set(
    cameraTracks.map(t => t.participant?.identity).filter(Boolean)
  );

  // Find remote participants without tracks (need placeholder)
  const participantsWithoutTracks = remoteParticipants.filter(
    p => p.identity && !participantsWithTracks.has(p.identity)
  );

  const hasScreenShare = screenShareTracks.length > 0;
  const totalCount = cameraTracks.length + participantsWithoutTracks.length;

  // PIP mode - just show first track
  if (pip) {
    const trackToShow = screenShareTracks[0] || tracks[0];
    if (!trackToShow) return null;
    return (
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
          <ParticipantTile trackRef={trackToShow} style={{ width: '100%', height: '100%' }} />
        </div>
      </div>
    );
  }

  // Screen share layout - main content with sidebar
  if (hasScreenShare) {
    const showSidebar = cameraTracks.length > 0 || participantsWithoutTracks.length > 0;
    return (
      <div style={{ position: 'absolute', inset: 0, display: 'flex', gap: '2px' }}>
        {/* Main screen share area */}
        <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>
          <ParticipantTile
            trackRef={screenShareTracks[0]}
            style={{ width: '100%', height: '100%' }}
          />
        </div>

        {/* Participants sidebar */}
        {showSidebar && (
          <div
            style={{
              width: isMobile ? '84px' : '180px',
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
              overflowY: 'auto',
              background: '#0a0a0a',
            }}
          >
            {cameraTracks.map((trackRef) => (
              <div
                key={trackRef.publication?.trackSid ?? trackRef.participant?.identity}
                style={{
                  width: '100%',
                  aspectRatio: '16/9',
                  position: 'relative',
                  flexShrink: 0,
                  borderRadius: '6px',
                  overflow: 'hidden',
                }}
              >
                <ParticipantTile trackRef={trackRef} style={{ width: '100%', height: '100%' }} />
              </div>
            ))}
            {participantsWithoutTracks.map((p) => (
              <div
                key={p.identity}
                style={{
                  width: '100%',
                  aspectRatio: '16/9',
                  position: 'relative',
                  flexShrink: 0,
                  borderRadius: '6px',
                  overflow: 'hidden',
                }}
              >
                <ParticipantPlaceholder participant={p} />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Normal grid layout for camera-only
  const getGridStyle = (count: number): React.CSSProperties => {
    if (count <= 1) {
      return { position: 'absolute', inset: 0 };
    }
    // Mobile (H-07): luôn xếp 1 cột cuộn dọc thay vì lưới nhiều cột co nhỏ —
    // nhiều participant trên màn hẹp thì mỗi ô vẫn đủ lớn để nhìn rõ mặt.
    if (isMobile) {
      return {
        position: 'absolute',
        inset: 0,
        display: 'grid',
        gridTemplateColumns: '1fr',
        gridAutoRows: 'minmax(160px, 1fr)',
        gap: '2px',
        overflowY: 'auto',
      };
    }
    if (count === 2) {
      return { position: 'absolute', inset: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px' };
    }
    if (count <= 4) {
      return { position: 'absolute', inset: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: '2px' };
    }
    return { position: 'absolute', inset: 0, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gridTemplateRows: 'repeat(2, 1fr)', gap: '2px' };
  };

  return (
    <div style={getGridStyle(totalCount)}>
      {/* Render tracks with video */}
      {cameraTracks.map((trackRef) => (
        <div key={trackRef.publication?.trackSid ?? trackRef.participant?.identity} style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
          <ParticipantTile trackRef={trackRef} style={{ width: '100%', height: '100%' }} />
        </div>
      ))}
      {/* Render placeholders for participants without tracks */}
      {participantsWithoutTracks.map((p) => (
        <div key={p.identity} style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
          <ParticipantPlaceholder participant={p} />
        </div>
      ))}
    </div>
  );
}

/** Placeholder for participants without camera track */
function ParticipantPlaceholder({ participant }: { participant: any }) {
  const name = participant?.name || participant?.identity || '?';
  const colors = ['#6366f1', '#ec4899', '#14b8a6', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];
  const identity = participant?.identity || '';
  let hash = 0;
  for (let i = 0; i < identity.length; i++) hash = identity.charCodeAt(i) + ((hash << 5) - hash);
  const color = colors[Math.abs(hash) % colors.length];

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#1a1a1a',
        flexDirection: 'column',
        gap: '0.5rem',
      }}
    >
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.5rem',
          fontWeight: 700,
          color: '#fff',
        }}
      >
        {name[0].toUpperCase()}
      </div>
      <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', maxWidth: '80%', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {name}
      </span>
    </div>
  );
}

function ParticipantListPanel({ onClose, hostId }: { onClose: () => void; hostId?: string }) {
  const participants = useParticipants();
  const { localParticipant } = useLocalParticipant();
  const isMobile = useIsMobile();

  // Build unique list - useParticipants() includes remote only, add local manually
  const allParticipants = [
    {
      identity: localParticipant.identity,
      name: localParticipant.name || localParticipant.identity || 'You',
      isLocal: true,
      isMicEnabled: localParticipant.isMicrophoneEnabled,
      isCamEnabled: localParticipant.isCameraEnabled,
    },
    ...participants
      .filter((p) => p.identity !== localParticipant.identity)
      .map((p) => ({
        identity: p.identity,
        name: p.name || p.identity,
        isLocal: false,
        isMicEnabled: p.isMicrophoneEnabled,
        isCamEnabled: p.isCameraEnabled,
      })),
  ];

  // Sort: host first, then local, then alphabetical
  allParticipants.sort((a, b) => {
    const aIsHost = a.identity === hostId ? 1 : 0;
    const bIsHost = b.identity === hostId ? 1 : 0;
    if (aIsHost !== bIsHost) return bIsHost - aIsHost;
    if (a.isLocal !== b.isLocal) return a.isLocal ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  const colors = ['#6366f1', '#ec4899', '#14b8a6', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];
  const getColor = (identity: string) => {
    let hash = 0;
    for (let i = 0; i < identity.length; i++) hash = identity.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div
      style={
        isMobile
          ? {
              // Mobile (H-07): panel danh sách participant chiếm gần full màn
              // hình thay vì popover 260px cố định — tránh tràn viewport hẹp.
              position: 'absolute',
              top: '12px',
              left: '12px',
              right: '12px',
              width: 'auto',
              maxHeight: 'calc(100% - 24px)',
              background: '#161616',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              zIndex: 100,
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              overflow: 'hidden',
            }
          : {
              position: 'absolute',
              top: '12px',
              right: '12px',
              width: '260px',
              background: '#161616',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              zIndex: 100,
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              overflow: 'hidden',
            }
      }
    >
      <div
        style={{
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          padding: '0.65rem 0.85rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#1a1a1a',
        }}
      >
        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>
          Người tham gia ({allParticipants.length})
        </span>
        <button
          onClick={onClose}
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: 'none',
            color: 'rgba(255,255,255,0.5)',
            cursor: 'pointer',
            fontSize: '0.75rem',
            padding: '0.2rem 0.45rem',
            borderRadius: '6px',
          }}
        >
          ✕
        </button>
      </div>

      <div style={{ maxHeight: '300px', overflowY: 'auto', padding: '4px 0' }}>
        {allParticipants.map((p) => {
          const isHost = p.identity === hostId;
          const avatarColor = getColor(p.identity);
          return (
            <div
              key={p.identity}
              style={{
                padding: '0.5rem 0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
              }}
            >
              {/* Avatar */}
              <div
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  background: avatarColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: '#fff',
                  flexShrink: 0,
                }}
              >
                {(p.name || '?')[0].toUpperCase()}
              </div>

              {/* Name + badges */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: 500,
                      color: '#fff',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {p.name}
                  </span>
                  {p.isLocal && (
                    <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.35)' }}>(Bạn)</span>
                  )}
                </div>
              </div>

              {/* Status indicators */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexShrink: 0 }}>
                {/* Mic status */}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={p.isMicEnabled ? 'rgba(255,255,255,0.4)' : '#ff4040'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                  <line x1="12" y1="19" x2="12" y2="23"/>
                  {!p.isMicEnabled && <line x1="1" y1="1" x2="23" y2="23"/>}
                </svg>

                {/* Host badge */}
                {isHost && (
                  <span
                    style={{
                      fontSize: '0.55rem',
                      padding: '0.1rem 0.35rem',
                      borderRadius: '4px',
                      background: 'rgba(99,102,241,0.2)',
                      color: '#818cf8',
                      fontWeight: 700,
                      letterSpacing: '0.02em',
                    }}
                  >
                    HOST
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BottomBar({
  onParticipantsClick,
  showParticipants,
  isHost,
  hostId,
  handRaised,
  onToggleHand,
  onLeave,
  onRequestShare,
  pendingShareRequest,
  shareApproved,
  onShareStarted,
  pendingLeaveRequest,
  onDirectLeave,
  onDirectShare,
}: {
  onParticipantsClick?: () => void;
  showParticipants?: boolean;
  isHost?: boolean;
  hostId?: string;
  handRaised?: boolean;
  onToggleHand?: () => void;
  onLeave?: () => void;
  onRequestShare?: () => void;
  pendingShareRequest?: boolean;
  shareApproved?: boolean;
  onShareStarted?: () => void;
  pendingLeaveRequest?: boolean;
  onDirectLeave?: () => void;
  onDirectShare?: () => void;
}) {
  const participants = useParticipants();
  const { localParticipant } = useLocalParticipant();
  const totalCount = participants.length + 1;
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  // Check if host is in the room
  const hostInRoom = hostId ? participants.some(p => p.identity === hostId) : false;

  // Check if currently screen sharing
  useEffect(() => {
    if (!localParticipant) return;
    const checkScreenShare = () => {
      const screenTrack = localParticipant.getTrackPublication(Track.Source.ScreenShare);
      setIsScreenSharing(!!screenTrack && !screenTrack.isMuted);
    };
    checkScreenShare();
    // Listen for track changes
    const handleTrackChanged = () => checkScreenShare();
    localParticipant.on('trackPublished', handleTrackChanged);
    localParticipant.on('trackUnpublished', handleTrackChanged);
    localParticipant.on('trackMuted', handleTrackChanged);
    localParticipant.on('trackUnmuted', handleTrackChanged);
    return () => {
      localParticipant.off('trackPublished', handleTrackChanged);
      localParticipant.off('trackUnpublished', handleTrackChanged);
      localParticipant.off('trackMuted', handleTrackChanged);
      localParticipant.off('trackUnmuted', handleTrackChanged);
    };
  }, [localParticipant]);

  // Auto-enable screen share when approved
  useEffect(() => {
    if (shareApproved && localParticipant && !isScreenSharing) {
      localParticipant.setScreenShareEnabled(true).then(() => {
        onShareStarted?.();
      }).catch(() => {
        onShareStarted?.(); // Reset state even on error
      });
    }
  }, [shareApproved, localParticipant, isScreenSharing, onShareStarted]);

  // Handle screen share button click for students
  const handleScreenShareClick = async () => {
    if (isHost) {
      // Host can toggle directly
      await localParticipant?.setScreenShareEnabled(!isScreenSharing);
    } else {
      if (isScreenSharing) {
        // Student can stop sharing anytime
        await localParticipant?.setScreenShareEnabled(false);
      } else if (!hostInRoom) {
        // No host in room - student can share directly
        onDirectShare?.();
      } else {
        // Host is present - student needs to request permission
        onRequestShare?.();
      }
    }
  };

  // Handle leave button click
  const handleLeaveClick = () => {
    if (isHost || !hostInRoom) {
      // Host can leave directly, or no host means student can leave freely
      onDirectLeave?.();
    } else {
      // Host is present - student needs to request permission
      onLeave?.();
    }
  };

  return (
    <div
      style={{
        background: 'rgba(20,20,20,0.95)',
        backdropFilter: 'blur(12px)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        padding: '0.6rem 1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.375rem',
        flexShrink: 0,
        zIndex: 20,
        // H-07: nhiều nút icon-only trên màn hẹp có thể vượt viewport — cho cuộn
        // ngang thay vì bị cắt/đè lên nhau khi không đủ chỗ.
        overflowX: 'auto',
      }}
    >
      <TrackToggle source={Track.Source.Microphone} className="lk-toggle" />
      <TrackToggle source={Track.Source.Camera} className="lk-toggle" />
      {/* Custom Screen Share button for permission flow */}
      <button
        onClick={handleScreenShareClick}
        disabled={pendingShareRequest}
        title={
          pendingShareRequest
            ? 'Đang chờ giáo viên cho phép...'
            : isScreenSharing
              ? 'Dừng chia sẻ màn hình'
              : (isHost || !hostInRoom)
                ? 'Chia sẻ màn hình'
                : 'Xin chia sẻ màn hình'
        }
        className="lk-toggle"
        style={{
          background: isScreenSharing
            ? 'rgba(59,130,246,0.3)'
            : pendingShareRequest
              ? 'rgba(255,200,0,0.2)'
              : 'transparent',
          border: isScreenSharing
            ? '1px solid rgba(59,130,246,0.5)'
            : pendingShareRequest
              ? '1px solid rgba(255,200,0,0.4)'
              : '1px solid transparent',
          borderRadius: '8px',
          padding: '0.5rem',
          cursor: pendingShareRequest ? 'wait' : 'pointer',
          opacity: pendingShareRequest ? 0.7 : 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: isScreenSharing ? '#3b82f6' : pendingShareRequest ? '#ffc800' : 'rgba(255,255,255,0.6)',
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
          <line x1="8" y1="21" x2="16" y2="21"/>
          <line x1="12" y1="17" x2="12" y2="21"/>
        </svg>
      </button>

      <div style={{ width: '1px', height: '22px', background: 'rgba(255,255,255,0.12)', margin: '0 0.25rem' }} />

      {/* Raise hand button */}
      <button
        onClick={onToggleHand}
        title={handRaised ? 'Hạ tay' : 'Giơ tay'}
        style={{
          background: handRaised ? 'rgba(255,200,0,0.2)' : 'transparent',
          border: handRaised ? '1px solid rgba(255,200,0,0.4)' : '1px solid transparent',
          borderRadius: '8px',
          color: handRaised ? '#ffc800' : 'rgba(255,255,255,0.6)',
          cursor: 'pointer',
          padding: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.15s',
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill={handRaised ? '#ffc800' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 11V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2v0"/>
          <path d="M14 10V4a2 2 0 0 0-2-2 2 2 0 0 0-2 2v2"/>
          <path d="M10 10.5V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2v8"/>
          <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>
        </svg>
      </button>

      {/* Participants button */}
      <button
        onClick={onParticipantsClick}
        title="Người tham gia"
        style={{
          background: showParticipants ? 'rgba(255,99,82,0.2)' : 'transparent',
          border: showParticipants ? '1px solid rgba(255,99,82,0.4)' : '1px solid transparent',
          borderRadius: '8px',
          color: showParticipants ? '#ff6352' : 'rgba(255,255,255,0.6)',
          cursor: 'pointer',
          padding: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.15s',
          position: 'relative',
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
        {/* Badge count */}
        <div
          style={{
            position: 'absolute',
            top: '2px',
            right: '2px',
            background: '#ff6352',
            borderRadius: '8px',
            width: '16px',
            height: '16px',
            fontSize: '0.6rem',
            fontWeight: 700,
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {totalCount}
        </div>
      </button>

      <div style={{ width: '1px', height: '22px', background: 'rgba(255,255,255,0.12)', margin: '0 0.25rem' }} />

      <button
        onClick={handleLeaveClick}
        disabled={pendingLeaveRequest}
        title={
          pendingLeaveRequest
            ? 'Đang chờ giáo viên cho phép...'
            : (isHost || !hostInRoom)
              ? 'Rời phòng'
              : 'Xin rời phòng'
        }
        style={{
          background: pendingLeaveRequest ? 'rgba(255,200,0,0.2)' : 'rgba(255,82,82,0.15)',
          border: pendingLeaveRequest ? '1px solid rgba(255,200,0,0.4)' : 'none',
          borderRadius: '8px',
          color: pendingLeaveRequest ? '#ffc800' : '#ff5252',
          cursor: pendingLeaveRequest ? 'wait' : 'pointer',
          opacity: pendingLeaveRequest ? 0.7 : 1,
          padding: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '36px',
          height: '36px',
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
          <polyline points="16 17 21 12 16 7"/>
          <line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
      </button>
    </div>
  );
}
