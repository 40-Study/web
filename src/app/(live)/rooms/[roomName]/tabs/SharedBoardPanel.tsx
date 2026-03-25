'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import Excalidraw wrapper
const MiniExcalidraw = dynamic(() => import('./MiniExcalidraw'), { ssr: false });

const COLORS = {
  bg: '#0e0e0e',
  surface: '#1a1a1a',
  surfaceHigh: '#262626',
  primary: '#ff8e80',
  accent: '#3b82f6',
  text: '#ffffff',
  textMuted: '#adaaaa',
  textDim: '#767575',
  border: '#484847',
  borderDim: 'rgba(72,72,71,0.3)',
  success: '#ff8e80',
};

// Using Excalidraw's element format
export type BoardElement = any;
export type BoardFiles = Record<string, any>;

export interface BoardData {
  elements: BoardElement[];
  files?: BoardFiles;
}

interface SharedBoardPanelProps {
  isHost: boolean;
  participants: { identity: string; name: string }[];
  isPublished: boolean;
  onPublishChange: (published: boolean) => void;
  onClose: () => void;
  onBroadcast?: (event: any) => void;
  currentUserName?: string;
  currentUserIdentity?: string; // The actual identity (UUID) for matching with participants
  studentBoards?: Map<string, BoardData>;
  onStudentBoardUpdate?: (identity: string, data: BoardData) => void;
  zIndex?: number;
  onFocus?: () => void;
}

export default function SharedBoardPanel({
  isHost,
  participants,
  isPublished,
  onPublishChange,
  onClose,
  onBroadcast,
  currentUserName,
  currentUserIdentity,
  studentBoards = new Map(),
  onStudentBoardUpdate,
  zIndex = 200,
  onFocus,
}: SharedBoardPanelProps) {
  // Use identity for board operations, fallback to name if not provided
  const userIdentity = currentUserIdentity || currentUserName || '';
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);

  // Get selected student's board data
  const selectedBoardData = selectedStudent ? studentBoards.get(selectedStudent) : null;
  const selectedBoardElements = selectedBoardData?.elements || [];
  const selectedBoardFiles = selectedBoardData?.files || {};
  const selectedStudentName = participants.find(p => p.identity === selectedStudent)?.name || selectedStudent;

  // Handle teacher drawing on student's board
  const handleTeacherDraw = useCallback((elements: BoardElement[], files?: BoardFiles) => {
    if (!selectedStudent) return;
    const data: BoardData = { elements, files };
    // Broadcast to specific student
    onBroadcast?.({
      type: 'shared_board_teacher_draw',
      targetIdentity: selectedStudent,
      elements,
      files,
    });
    onStudentBoardUpdate?.(selectedStudent, data);
  }, [selectedStudent, onBroadcast, onStudentBoardUpdate]);

  // Clear selected student's board
  const handleClearStudentBoard = useCallback(() => {
    if (!selectedStudent) return;
    onBroadcast?.({
      type: 'shared_board_teacher_draw',
      targetIdentity: selectedStudent,
      elements: [],
      files: {},
    });
    onStudentBoardUpdate?.(selectedStudent, { elements: [], files: {} });
  }, [selectedStudent, onBroadcast, onStudentBoardUpdate]);

  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button, input, textarea, select')) return;
    if (!target.closest('[data-drag-handle]')) return;
    onFocus?.();
    setDragging(true);
    setDragOffset({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  useEffect(() => {
    if (!dragging) return;
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({
        x: Math.max(0, Math.min(window.innerWidth - 800, e.clientX - dragOffset.x)),
        y: Math.max(0, Math.min(window.innerHeight - 100, e.clientY - dragOffset.y)),
      });
    };
    const handleMouseUp = () => setDragging(false);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, dragOffset]);

  return (
      <div
        onClick={onFocus}
        onMouseDown={handleMouseDown}
        style={{
          position: 'fixed',
          left: position.x,
          top: position.y,
          background: COLORS.bg,
          borderRadius: '16px',
          width: '90vw',
          maxWidth: '1000px',
          height: '75vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: `1px solid ${COLORS.border}`,
          boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
          zIndex,
        }}
      >
        {/* Header - Drag handle */}
        <div
          data-drag-handle
          style={{
            padding: '16px 20px',
            borderBottom: `1px solid ${COLORS.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: dragging ? 'grabbing' : 'grab',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={COLORS.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/>
            </svg>
            <h2 style={{ color: COLORS.text, fontSize: '1rem', fontWeight: 600, margin: 0 }}>
              Bảng chia sẻ
            </h2>
            {isPublished && (
              <span
                style={{
                  background: `${COLORS.success}22`,
                  color: COLORS.success,
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                }}
              >
                Đang hoạt động
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isHost && (
              <button
                onClick={() => onPublishChange(!isPublished)}
                style={{
                  background: isPublished
                    ? 'rgba(255,82,82,0.15)'
                    : `${COLORS.success}22`,
                  color: isPublished ? '#ff5252' : COLORS.success,
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {isPublished ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
                    </svg>
                    Thu hồi
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="5,3 19,12 5,21"/>
                    </svg>
                    Phát bảng
                  </>
                )}
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: COLORS.textMuted,
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Main content */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Participant list (left sidebar) */}
          {isHost && (
            <div
              style={{
                width: '240px',
                borderRight: `1px solid ${COLORS.border}`,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '12px 16px',
                  borderBottom: `1px solid ${COLORS.borderDim}`,
                  fontSize: '0.75rem',
                  color: COLORS.textDim,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Học sinh ({participants.filter(p => p.identity !== userIdentity).length})
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
                {participants
                  .filter(p => p.identity !== userIdentity) // Exclude host by identity only
                  .map((p) => {
                    const boardData = studentBoards.get(p.identity);
                    const hasContent = (boardData?.elements?.length || 0) > 0;
                    return (
                      <button
                        key={p.identity}
                        onClick={() => setSelectedStudent(p.identity)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: 'none',
                          background:
                            selectedStudent === p.identity
                              ? `${COLORS.primary}22`
                              : 'transparent',
                          color:
                            selectedStudent === p.identity
                              ? COLORS.primary
                              : COLORS.text,
                          cursor: 'pointer',
                          textAlign: 'left',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          marginBottom: '4px',
                          transition: 'all 0.15s',
                        }}
                      >
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            background: `${COLORS.accent}33`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            color: COLORS.accent,
                          }}
                        >
                          {p.name[0]?.toUpperCase() || '?'}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: '0.85rem',
                              fontWeight: 500,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {p.name}
                          </div>
                          <div
                            style={{
                              fontSize: '0.7rem',
                              color: hasContent ? COLORS.success : COLORS.textDim,
                            }}
                          >
                            {hasContent ? 'Đã vẽ' : 'Chưa vẽ'}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                {participants.filter(p => p.identity !== userIdentity).length === 0 && (
                  <div
                    style={{
                      padding: '20px',
                      textAlign: 'center',
                      color: COLORS.textDim,
                      fontSize: '0.85rem',
                    }}
                  >
                    Chưa có học sinh
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Board area */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {isHost ? (
              selectedStudent ? (
                <>
                  {/* Selected student header */}
                  <div
                    style={{
                      padding: '8px 16px',
                      borderBottom: `1px solid ${COLORS.borderDim}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span style={{ color: COLORS.text, fontWeight: 500, fontSize: '0.85rem' }}>
                      Bảng của: {selectedStudentName}
                    </span>
                    <button
                      onClick={handleClearStudentBoard}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        background: 'transparent',
                        border: 'none',
                        color: '#ff5252',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3,6 5,6 21,6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                      </svg>
                      Xóa bảng
                    </button>
                  </div>
                  {/* Excalidraw Canvas */}
                  <div style={{ flex: 1, position: 'relative' }}>
                    <MiniExcalidraw
                      elements={selectedBoardElements}
                      files={selectedBoardFiles}
                      onChange={handleTeacherDraw}
                      editable={true}
                    />
                  </div>
                </>
              ) : (
                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: COLORS.textDim,
                  }}
                >
                  <div style={{ textAlign: 'center' }}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: '16px', opacity: 0.5 }}>
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="9" x2="15" y2="15"/><line x1="15" y1="9" x2="9" y2="15"/>
                    </svg>
                    <div style={{ fontSize: '0.9rem' }}>Chọn học sinh từ danh sách bên trái</div>
                  </div>
                </div>
              )
            ) : (
              // Student view - their own board
              <StudentBoardView
                data={studentBoards.get(userIdentity) || { elements: [] }}
                isPublished={isPublished}
                onDataChange={(data) => {
                  if (!userIdentity) return;
                  onStudentBoardUpdate?.(userIdentity, data);
                  onBroadcast?.({
                    type: 'shared_board_student_draw',
                    identity: userIdentity,
                    name: currentUserName || userIdentity,
                    elements: data.elements,
                    files: data.files,
                  });
                }}
              />
            )}
          </div>
        </div>
      </div>
  );
}

// Student's board view
function StudentBoardView({
  data,
  isPublished,
  onDataChange,
}: {
  data: BoardData;
  isPublished: boolean;
  onDataChange: (data: BoardData) => void;
}) {
  if (!isPublished) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: COLORS.textDim,
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: '16px', opacity: 0.5 }}>
            <circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/>
          </svg>
          <div style={{ fontSize: '0.9rem' }}>Chờ giáo viên bắt đầu bảng chia sẻ</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, position: 'relative' }}>
      <MiniExcalidraw
        elements={data.elements || []}
        files={data.files}
        onChange={(elements, files) => onDataChange({ elements, files })}
        editable={true}
      />
    </div>
  );
}

// Mini floating board for students when board is published
export function StudentMiniBoard({
  data,
  isPublished,
  onDataChange,
  onClose,
}: {
  data: BoardData;
  isPublished: boolean;
  onDataChange: (data: BoardData) => void;
  onClose: () => void;
}) {
  const [minimized, setMinimized] = useState(false);

  if (!isPublished) return null;

  if (minimized) {
    return (
      <button
        onClick={() => setMinimized(false)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 200,
          width: '52px',
          height: '52px',
          borderRadius: '12px',
          background: COLORS.surface,
          border: `1px solid ${COLORS.border}`,
          color: COLORS.text,
          cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/>
        </svg>
      </button>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 200,
        width: '500px',
        height: '400px',
        background: COLORS.bg,
        borderRadius: '16px',
        border: `1px solid ${COLORS.border}`,
        boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '8px 14px',
          borderBottom: `1px solid ${COLORS.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={COLORS.text} strokeWidth="2">
            <path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
          </svg>
          <span style={{ color: COLORS.text, fontSize: '0.85rem', fontWeight: 500 }}>
            Bảng của bạn
          </span>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={() => setMinimized(true)}
            style={{
              background: 'transparent',
              border: 'none',
              color: COLORS.textMuted,
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: COLORS.textMuted,
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Excalidraw Canvas */}
      <div style={{ flex: 1, position: 'relative' }}>
        <MiniExcalidraw
          elements={data.elements || []}
          files={data.files}
          onChange={(elements, files) => onDataChange({ elements, files })}
          editable={true}
        />
      </div>
    </div>
  );
}
