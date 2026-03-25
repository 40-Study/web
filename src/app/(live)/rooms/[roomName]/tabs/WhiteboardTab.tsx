'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, memo, useCallback, useState } from 'react';
import { api } from '@/lib/meet/api';
import { CursorManager, CursorData, ViewportState } from '@/lib/meet/realtime-cursors';
import '@excalidraw/excalidraw/index.css';

const Excalidraw = dynamic(
  async () => (await import('@excalidraw/excalidraw')).Excalidraw,
  { ssr: false }
);

interface WhiteboardTabProps {
  sessionId: string;
  remoteWhiteboardEvent?: any;
  isHost?: boolean;
  whiteboardShared?: boolean;
  whiteboardPublished?: boolean;
  onClose: () => void;
  onBroadcast?: (event: any) => void;
  currentUserName?: string;
  currentUserId?: string;
}

function WhiteboardTabInner({
  sessionId,
  remoteWhiteboardEvent,
  isHost = false,
  whiteboardShared: initialShared = false,
  whiteboardPublished: initialPublished = false,
  onClose,
  onBroadcast,
  currentUserId = '',
  currentUserName = 'User',
}: WhiteboardTabProps) {
  const excalidrawRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<CursorManager | null>(null);
  const lastBroadcastRef = useRef('');
  const isRemoteRef = useRef(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const [isShared, setIsShared] = useState(initialShared);
  const [isPublished, setIsPublished] = useState(initialPublished);
  const canEdit = isHost || isPublished;

  // Ref to track latest isPublished for cursor callback
  const isPublishedRef = useRef(isPublished);
  useEffect(() => {
    isPublishedRef.current = isPublished;
  }, [isPublished]);

  // ===== CURSOR MANAGER =====
  useEffect(() => {
    if (!containerRef.current || !currentUserId) return;

    const manager = new CursorManager();
    manager.init({
      container: containerRef.current,
      userId: currentUserId,
      userName: currentUserName,
      onSend: (data: CursorData) => {
        // Only send cursor if can edit (host always, student when published)
        if (!isHost && !isPublishedRef.current) return;
        onBroadcast?.({
          type: 'cursor',
          payload: JSON.stringify(data),
        });
      },
    });
    cursorRef.current = manager;

    return () => {
      manager.destroy();
      cursorRef.current = null;
    };
  }, [currentUserId, currentUserName, onBroadcast, isHost]);

  // ===== BROADCAST CHANGES =====
  const broadcastChanges = useCallback((elements: readonly any[]) => {
    if (isRemoteRef.current) return;
    if (!isHost && !isPublished) return;

    const serialized = JSON.stringify(elements);
    if (serialized === lastBroadcastRef.current) return;
    lastBroadcastRef.current = serialized;

    // Broadcast via LiveKit
    onBroadcast?.({
      type: 'whiteboard_event',
      action: 'update',
      payload: serialized,
      senderId: currentUserId,
    });

    // Save to backend
    api.post(`/whiteboard/${sessionId}/snapshot`, { elements }).catch(() => {});
  }, [onBroadcast, isHost, isPublished, currentUserId, sessionId]);

  // ===== EXCALIDRAW ONCHANGE =====
  const handleChange = useCallback((elements: readonly any[], appState: any) => {
    // Update cursor manager with viewport state for correct coordinate conversion
    if (appState && cursorRef.current) {
      const viewport: ViewportState = {
        zoom: appState.zoom?.value ?? 1,
        scrollX: appState.scrollX ?? 0,
        scrollY: appState.scrollY ?? 0,
      };
      cursorRef.current.updateViewport(viewport);
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => broadcastChanges(elements), 100);
  }, [broadcastChanges]);

  // ===== LOAD INITIAL DATA =====
  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get<any>(`/whiteboard/${sessionId}/snapshot`);
        const snapshot = res?.data ?? res;
        if (snapshot?.elements?.length && excalidrawRef.current) {
          isRemoteRef.current = true;
          excalidrawRef.current.updateScene({ elements: snapshot.elements });
          setTimeout(() => { isRemoteRef.current = false; }, 50);
        }
      } catch {}
    };
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [sessionId]);

  // ===== HANDLE REMOTE EVENTS =====
  useEffect(() => {
    if (!remoteWhiteboardEvent) return;

    const { type, action, payload, senderId } = remoteWhiteboardEvent;

    // Cursor events
    if (type === 'cursor' && payload) {
      try {
        const data: CursorData = JSON.parse(payload);
        cursorRef.current?.receive(data);
      } catch {}
      return;
    }

    // Skip own events
    if (senderId === currentUserId) return;

    // Whiteboard updates - MERGE
    if (type === 'whiteboard_event' && action === 'update' && payload) {
      try {
        const data = typeof payload === 'string' ? JSON.parse(payload) : payload;
        const remoteElements = data.elements || (Array.isArray(data) ? data : null);

        if (remoteElements && excalidrawRef.current) {
          isRemoteRef.current = true;

          const localElements = excalidrawRef.current.getSceneElements() || [];
          const localMap = new Map(localElements.map((el: any) => [el.id, el]));

          remoteElements.forEach((remote: any) => {
            const local = localMap.get(remote.id) as any;
            if (!local || (remote.version || 0) >= (local?.version || 0)) {
              localMap.set(remote.id, remote);
            }
          });

          excalidrawRef.current.updateScene({ elements: Array.from(localMap.values()) });
          setTimeout(() => { isRemoteRef.current = false; }, 50);
        }
      } catch {}
    }

    // Control events
    if (type === 'whiteboard_control') {
      if (action === 'share') setIsShared(true);
      if (action === 'unshare') setIsShared(false);
      if (action === 'publish') setIsPublished(true);
      if (action === 'unpublish') setIsPublished(false);
    }
  }, [remoteWhiteboardEvent, currentUserId]);

  // Sync props
  useEffect(() => {
    setIsShared(initialShared);
  }, [initialShared]);

  useEffect(() => {
    setIsPublished(initialPublished);
  }, [initialPublished]);

  // ===== TOGGLE SHARE (visibility for students) =====
  const handleShare = () => {
    const newState = !isShared;
    setIsShared(newState);
    onBroadcast?.({
      type: 'whiteboard_control',
      action: newState ? 'share' : 'unshare',
      senderId: currentUserId,
    });
  };

  // ===== TOGGLE PUBLISH (edit permission) =====
  const handlePublish = () => {
    const newState = !isPublished;
    setIsPublished(newState);
    onBroadcast?.({
      type: 'whiteboard_control',
      action: newState ? 'publish' : 'unpublish',
      senderId: currentUserId,
    });
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#121212', borderRadius: '12px', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        background: '#1a1a1a',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        padding: '0.5rem 0.75rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 19l7-7 3 3-7 7-3-3z"/>
            <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
          </svg>
          <span style={{ fontSize: '0.8rem', color: '#fff', fontWeight: 500 }}>Bảng vẽ</span>
          <span style={{
            fontSize: '0.6rem',
            padding: '0.15rem 0.4rem',
            borderRadius: '4px',
            background: isHost ? 'rgba(167,139,250,0.15)' : canEdit ? 'rgba(74,222,128,0.15)' : 'rgba(248,113,113,0.15)',
            color: isHost ? '#a78bfa' : canEdit ? '#4ade80' : '#f87171',
            fontWeight: 500,
          }}>
            {isHost ? 'Host' : canEdit ? 'Có thể vẽ' : 'Chỉ xem'}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
          {isHost && (
            <>
              {/* Share button - eye icon */}
              <button
                onClick={handleShare}
                title={isShared ? 'Ẩn với học sinh' : 'Chia sẻ với học sinh'}
                style={{
                  background: isShared ? 'rgba(59,130,246,0.15)' : 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.35rem',
                  color: isShared ? '#3b82f6' : 'rgba(255,255,255,0.4)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {isShared ? (
                    <>
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </>
                  ) : (
                    <>
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                      <path d="M1 1l22 22"/>
                    </>
                  )}
                </svg>
              </button>
              {/* Lock button - lock icon */}
              <button
                onClick={handlePublish}
                title={isPublished ? 'Khóa quyền vẽ' : 'Mở khóa quyền vẽ'}
                style={{
                  background: isPublished ? 'rgba(74,222,128,0.15)' : 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.35rem',
                  color: isPublished ? '#4ade80' : 'rgba(255,255,255,0.4)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  {isPublished ? <path d="M7 11V7a5 5 0 0 1 9.9-1"/> : <path d="M7 11V7a5 5 0 0 1 10 0v4"/>}
                </svg>
              </button>
            </>
          )}
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(255,255,255,0.4)',
              cursor: 'pointer',
              padding: '0.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Canvas - rely on Excalidraw's built-in dark theme */}
      <div ref={containerRef} style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <Excalidraw
          excalidrawAPI={(api) => {
            excalidrawRef.current = api;
          }}
          onChange={handleChange}
          initialData={{
            elements: [],
            appState: { theme: 'dark' }
          }}
          viewModeEnabled={!canEdit}
          theme="dark"
        />
      </div>
    </div>
  );
}

export default memo(WhiteboardTabInner);
