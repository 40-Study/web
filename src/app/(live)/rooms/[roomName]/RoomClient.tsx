'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import VideoTab from './tabs/VideoTab';
import WhiteboardTab from './tabs/WhiteboardTab';
import SandboxTab from './tabs/SandboxTab';
import ChatTab from './tabs/ChatTab';
import ExercisePanel from './tabs/ExercisePanel';
import AssignmentWorkOverlay from './tabs/AssignmentWorkOverlay';
import { TimerModal, MinimizedTimer, RandomPickerModal, HandRaisedNotification, LeaveRequestNotification, ShareRequestNotification, ResponseNotification } from './tabs/HostTools';
import SharedBoardPanel, { StudentMiniBoard, BoardData } from './tabs/SharedBoardPanel';
import { getMe } from '@/lib/meet/auth';
import { api } from '@/lib/meet/api';
import { resolveTimerRestartDuration } from './room-timer';
import { useIsMobile } from '@/lib/meet/use-is-mobile';

interface AssignmentNotification {
  assignment_id: string;
  title: string;
  language?: string[];
  difficulty?: string;
  start_time?: string;
  end_time?: string;
}

interface RoomNotification {
  type: 'timer' | 'random_pick' | 'note' | 'hand_raised';
  data: any;
}

export default function RoomClient({
  sessionId,
  token,
  serverUrl,
  livekitRoomName,
}: {
  sessionId: string;
  token: string;
  serverUrl: string;
  livekitRoomName: string;
}) {
  const router = useRouter();
  // Layout dựng bằng inline style nên không dùng được breakpoint Tailwind — panel
  // Chat/Whiteboard/Sandbox chuyển sang gần full màn hình trên mobile (H-07).
  const isMobile = useIsMobile();
  const [showChat, setShowChat] = useState(false);
  const [showSandbox, setShowSandbox] = useState(false);
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [showExercises, setShowExercises] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  // Z-index management for floating panels
  const [zIndexCounter, setZIndexCounter] = useState(200);
  const [panelZIndex, setPanelZIndex] = useState<Record<string, number>>({
    exercises: 200,
    sharedBoard: 200,
    timer: 200,
    randomPicker: 200,
  });

  const bringToFront = useCallback((panelId: string) => {
    setZIndexCounter(prev => {
      const newZ = prev + 1;
      setPanelZIndex(pz => ({ ...pz, [panelId]: newZ }));
      return newZ;
    });
  }, []);
  const [notification, setNotification] = useState<AssignmentNotification | null>(null);
  const [activeAssignment, setActiveAssignment] = useState<AssignmentNotification | null>(null);
  const [assignmentList, setAssignmentList] = useState<AssignmentNotification[]>([]);
  const [submittedAssignments, setSubmittedAssignments] = useState<Set<string>>(new Set());
  const [showAssignmentList, setShowAssignmentList] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string>('User');
  const [hostId, setHostId] = useState<string | null>(null);
  const [remoteWhiteboardEvent, setRemoteWhiteboardEvent] = useState<any>(null);
  const [whiteboardShared, setWhiteboardShared] = useState(false);
  const [whiteboardPublished, setWhiteboardPublished] = useState(false);
  const whiteboardBroadcastRef = useRef<((event: any) => void) | null>(null);

  // Timer state
  const [showTimer, setShowTimer] = useState(false);
  const [timerMinimized, setTimerMinimized] = useState(false);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerPaused, setTimerPaused] = useState(false);
  const [timerLeft, setTimerLeft] = useState(0);
  const [timerTotal, setTimerTotal] = useState(0);
  const [timerPosition, setTimerPosition] = useState({ x: 100, y: 100 });
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Random picker state
  const [showRandom, setShowRandom] = useState(false);
  const [randomResult, setRandomResult] = useState<string | null>(null);
  const [randomSpinning, setRandomSpinning] = useState(false);
  const [randomPosition, setRandomPosition] = useState({ x: 150, y: 150 });

  // Hand state
  const [handRaisedName, setHandRaisedName] = useState<string | null>(null);
  const [leaveRequestName, setLeaveRequestName] = useState<string | null>(null);
  const [shareRequestName, setShareRequestName] = useState<string | null>(null);
  const [responseMessage, setResponseMessage] = useState<{ type: 'leave' | 'share'; approved: boolean } | null>(null);
  const [participants, setParticipants] = useState<{identity: string; name: string}[]>([]);
  const [participantLeftName, setParticipantLeftName] = useState<string | null>(null);

  // Shared board state
  const [showSharedBoard, setShowSharedBoard] = useState(false);
  const [sharedBoardPublished, setSharedBoardPublished] = useState(false);
  const [studentBoards, setStudentBoards] = useState<Map<string, BoardData>>(new Map());

  // Chat message handler ref (for real-time via LiveKit)
  const chatMessageHandlerRef = useRef<((msg: any) => void) | null>(null);

  // Play notification sound using Web Audio API
  const playNotificationSound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 880; // A5 note
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);

      // Play second beep
      setTimeout(() => {
        const osc2 = audioContext.createOscillator();
        const gain2 = audioContext.createGain();
        osc2.connect(gain2);
        gain2.connect(audioContext.destination);
        osc2.frequency.value = 1100; // Higher note
        osc2.type = 'sine';
        gain2.gain.setValueAtTime(0.3, audioContext.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        osc2.start(audioContext.currentTime);
        osc2.stop(audioContext.currentTime + 0.2);
      }, 150);
    } catch {}
  }, []);

  const isHost = currentUserId !== null && hostId !== null && currentUserId === hostId;

  useEffect(() => {
    // Fetch current user
    getMe()
      .then((u) => {
        setCurrentUserId(u.id);
        setCurrentUserName(u.username || u.email || 'User');
      })
      .catch(() => setCurrentUserId(null));

    // Fetch session to get host_id
    api.get<{ data: { host_id: string } }>(`/livestream/${sessionId}`)
      .then((res: any) => {
        const hid = res?.data?.host_id || res?.host_id || '';
        setHostId(hid);
      })
      .catch((err) => {
        console.error('[RoomClient] Failed to fetch hostId:', err);
        setHostId(null);
      });

    // Fetch published assignments for this session
    api.get<{ data: Array<{ id: string; title: string; language: string[]; difficulty: string; start_time?: string; end_time?: string }> }>(`/assignments?session_id=${sessionId}`)
      .then(async (res: any) => {
        const assignments = res?.data || [];
        const mapped = assignments.map((a: any) => ({
          assignment_id: a.id,
          title: a.title,
          language: a.language || [],
          difficulty: a.difficulty || 'medium',
          start_time: a.start_time,
          end_time: a.end_time,
        }));
        setAssignmentList(mapped);

        // Check which assignments have been submitted by this user
        if (currentUserId && mapped.length > 0) {
          const submitted = new Set<string>();
          for (const a of mapped) {
            try {
              const subRes = await api.get<{ data: any[] }>(`/submissions/my/${a.assignment_id}?user_id=${currentUserId}`);
              if (subRes.data && subRes.data.length > 0) {
                submitted.add(a.assignment_id);
              }
            } catch {
              // No submission found
            }
          }
          setSubmittedAssignments(submitted);
        }
      })
      .catch((err) => {
        console.error('[RoomClient] Failed to fetch assignments:', err);
      });
  }, [sessionId, currentUserId]);

  const handleLeave = () => {
    router.push('/');
    router.refresh();
  };

  // Shared board handlers
  const handleSharedBoardPublishChange = useCallback((published: boolean) => {
    setSharedBoardPublished(published);
    if (whiteboardBroadcastRef.current) {
      whiteboardBroadcastRef.current({
        type: published ? 'shared_board_publish' : 'shared_board_unpublish',
      });
    }
  }, []);

  const handleStudentBoardUpdate = useCallback((identity: string, data: BoardData) => {
    setStudentBoards(prev => {
      const newMap = new Map(prev);
      newMap.set(identity, data);
      return newMap;
    });
  }, []);

  const handleAssignmentReceived = useCallback((event: {
    assignment_id: string;
    title: string;
    language: string[];
    difficulty: string;
    timestamp: string;
    start_time?: string;
    end_time?: string;
  }) => {
    const assignment = {
      assignment_id: event.assignment_id,
      title: event.title,
      language: event.language,
      difficulty: event.difficulty,
      start_time: event.start_time,
      end_time: event.end_time,
    };

    // Add to assignment list (avoid duplicates)
    setAssignmentList(prev => {
      if (prev.some(a => a.assignment_id === assignment.assignment_id)) return prev;
      return [...prev, assignment];
    });

    // Only show notification to students (not host/teacher)
    if (!isHost) {
      setNotification(assignment);
    }
  }, [isHost]);

  const handleOpenAssignment = () => {
    if (notification) {
      setActiveAssignment(notification);
      setNotification(null);
    }
  };

  const handleWhiteboardEvent = useCallback((event: any) => {
    // Whiteboard events
    if (event?.type === 'whiteboard_event' || event?.type === 'whiteboard_control' || event?.type === 'cursor') {
      setRemoteWhiteboardEvent(event);
      if (event?.type === 'whiteboard_control') {
        // Share: controls visibility for students
        if (event.action === 'share') {
          setWhiteboardShared(true);
          if (!isHost) setShowWhiteboard(true);
        } else if (event.action === 'unshare') {
          setWhiteboardShared(false);
          if (!isHost) setShowWhiteboard(false);
        }
        // Lock/Unlock: controls edit permission
        else if (event.action === 'publish') {
          setWhiteboardPublished(true);
        } else if (event.action === 'unpublish') {
          setWhiteboardPublished(false);
        }
      }
      return;
    }

    // Timer events
    if (event?.type === 'timer') {
      if (event.action === 'start') {
        setShowTimer(true);
        setTimerRunning(true);
        setTimerPaused(false);
        setTimerLeft(event.duration);
        setTimerTotal(event.duration);
        if (event.position) setTimerPosition(event.position);
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
          setTimerLeft(t => {
            if (t <= 1) {
              if (timerRef.current) clearInterval(timerRef.current);
              return 0;
            }
            return t - 1;
          });
        }, 1000);
      } else if (event.action === 'stop') {
        setTimerRunning(false);
        setTimerPaused(false);
        setShowTimer(false);
        setTimerTotal(0);
        if (timerRef.current) clearInterval(timerRef.current);
      } else if (event.action === 'pause') {
        setTimerPaused(true);
        if (timerRef.current) clearInterval(timerRef.current);
      } else if (event.action === 'resume') {
        setTimerPaused(false);
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
          setTimerLeft(t => {
            if (t <= 1) {
              if (timerRef.current) clearInterval(timerRef.current);
              return 0;
            }
            return t - 1;
          });
        }, 1000);
      } else if (event.action === 'restart') {
        setTimerPaused(false);
        setTimerLeft(resolveTimerRestartDuration(event.duration, timerTotal));
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
          setTimerLeft(t => {
            if (t <= 1) {
              if (timerRef.current) clearInterval(timerRef.current);
              return 0;
            }
            return t - 1;
          });
        }, 1000);
      } else if (event.action === 'move' && event.position) {
        setTimerPosition(event.position);
      } else if (event.action === 'show') {
        setShowTimer(true);
        if (event.position) setTimerPosition(event.position);
      } else if (event.action === 'hide') {
        setShowTimer(false);
        setTimerRunning(false);
        setTimerPaused(false);
        setTimerTotal(0);
        if (timerRef.current) clearInterval(timerRef.current);
      }
      return;
    }

    // Random picker events
    if (event?.type === 'random') {
      if (event.action === 'show') {
        setShowRandom(true);
        setRandomResult(null);
        setRandomSpinning(false);
        if (event.position) setRandomPosition(event.position);
      } else if (event.action === 'hide') {
        setShowRandom(false);
        setRandomResult(null);
      } else if (event.action === 'spin') {
        setShowRandom(true);
        setRandomSpinning(true);
        setRandomResult(event.name || '...');
      } else if (event.action === 'result') {
        setRandomSpinning(false);
        setRandomResult(event.name);
      } else if (event.action === 'move' && event.position) {
        setRandomPosition(event.position);
      }
      return;
    }

    // Hand raised events
    if (event?.type === 'hand_raised') {
      if (isHost && event.name) {
        if (event.raised) {
          setHandRaisedName(event.name);
          // Play sound
          playNotificationSound();
        } else {
          // Hand lowered - clear notification
          setHandRaisedName(null);
        }
      }
      return;
    }

    // Leave request events
    if (event?.type === 'leave_request') {
      if (isHost && event.name) {
        setLeaveRequestName(event.name);
        playNotificationSound();
      }
      return;
    }

    // Share request events
    if (event?.type === 'share_request') {
      if (isHost && event.name) {
        setShareRequestName(event.name);
        playNotificationSound();
      }
      return;
    }

    // Leave response events (for students)
    if (event?.type === 'leave_response') {
      if (!isHost && event.name === currentUserName) {
        playNotificationSound();
        if (event.approved) {
          setResponseMessage({ type: 'leave', approved: true });
        } else {
          setResponseMessage({ type: 'leave', approved: false });
        }
      }
      return;
    }

    // Share response events (for students)
    if (event?.type === 'share_response') {
      if (!isHost && event.name === currentUserName) {
        playNotificationSound();
        if (event.approved) {
          setResponseMessage({ type: 'share', approved: true });
        } else {
          setResponseMessage({ type: 'share', approved: false });
        }
      }
      return;
    }

    // Shared board events
    if (event?.type === 'shared_board_publish') {
      setSharedBoardPublished(true);
      if (!isHost) setShowSharedBoard(true);
      return;
    }
    if (event?.type === 'shared_board_unpublish') {
      setSharedBoardPublished(false);
      if (!isHost) setShowSharedBoard(false);
      return;
    }
    // Student drawing on their board
    if (event?.type === 'shared_board_student_draw' && isHost) {
      if (event.identity && event.elements) {
        setStudentBoards(prev => {
          const newMap = new Map(prev);
          newMap.set(event.identity, { elements: event.elements, files: event.files || {} });
          return newMap;
        });
      }
      return;
    }
    // Teacher drawing on student's board
    if (event?.type === 'shared_board_teacher_draw' && !isHost) {
      if (event.targetIdentity === currentUserId && event.elements) {
        setStudentBoards(prev => {
          const newMap = new Map(prev);
          newMap.set(currentUserId!, { elements: event.elements, files: event.files || {} });
          return newMap;
        });
      }
      return;
    }

    // Chat message events (real-time via LiveKit)
    if (event?.type === 'chat_message' && event.message) {
      // Forward to chat handler if registered
      if (chatMessageHandlerRef.current) {
        chatMessageHandlerRef.current(event.message);
      }
      return;
    }

    // Exercise published events - only show to non-host (students)
    if (event?.type === 'exercise_published') {
      // Skip if sender is current user (host doesn't receive their own exercise)
      if (event.senderId === currentUserId) return;
      // Only show to students, not host
      if (!isHost && event.assignmentId) {
        setNotification({
          assignment_id: event.assignmentId,
          title: event.exerciseType === 'multiple_choice' ? 'Trắc nghiệm mới' : 'Bài tập mới',
        });
      }
      return;
    }
  }, [isHost, currentUserId, currentUserName, playNotificationSound, timerTotal]);

  const handleWhiteboardBroadcasterReady = useCallback((broadcast: (event: any) => void) => {
    whiteboardBroadcastRef.current = broadcast;
  }, []);

  // Register chat message handler
  const handleChatMessageRegister = useCallback((handler: (msg: any) => void) => {
    chatMessageHandlerRef.current = handler;
  }, []);

  // Timer handlers
  const handleTimerStart = useCallback((duration: number) => {
    setTimerRunning(true);
    setTimerPaused(false);
    setTimerLeft(duration);
    setTimerTotal(duration);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimerLeft(t => {
        if (t <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    whiteboardBroadcastRef.current?.({ type: 'timer', action: 'start', duration, position: timerPosition });
  }, [timerPosition]);

  const handleTimerStop = useCallback(() => {
    setTimerRunning(false);
    setTimerPaused(false);
    setShowTimer(false);
    setTimerTotal(0);
    if (timerRef.current) clearInterval(timerRef.current);
    whiteboardBroadcastRef.current?.({ type: 'timer', action: 'stop' });
  }, []);

  const handleTimerPause = useCallback(() => {
    setTimerPaused(true);
    if (timerRef.current) clearInterval(timerRef.current);
    whiteboardBroadcastRef.current?.({ type: 'timer', action: 'pause' });
  }, []);

  const handleTimerResume = useCallback(() => {
    setTimerPaused(false);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimerLeft(t => {
        if (t <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    whiteboardBroadcastRef.current?.({ type: 'timer', action: 'resume' });
  }, []);

  const handleTimerRestart = useCallback(() => {
    setTimerPaused(false);
    setTimerLeft(timerTotal);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimerLeft(t => {
        if (t <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    whiteboardBroadcastRef.current?.({ type: 'timer', action: 'restart', duration: timerTotal });
  }, [timerTotal]);

  const handleTimerPositionChange = useCallback((pos: { x: number; y: number }) => {
    setTimerPosition(pos);
    whiteboardBroadcastRef.current?.({ type: 'timer', action: 'move', position: pos });
  }, []);

  const handleToggleTimer = useCallback(() => {
    if (showTimer) {
      handleTimerStop();
    } else {
      setShowTimer(true);
      whiteboardBroadcastRef.current?.({ type: 'timer', action: 'show', position: timerPosition });
    }
  }, [showTimer, timerPosition, handleTimerStop]);

  // Random picker handlers
  const handleToggleRandom = useCallback(() => {
    if (showRandom) {
      setShowRandom(false);
      setRandomResult(null);
      whiteboardBroadcastRef.current?.({ type: 'random', action: 'hide' });
    } else {
      setShowRandom(true);
      setRandomResult(null);
      whiteboardBroadcastRef.current?.({ type: 'random', action: 'show', position: randomPosition });
    }
  }, [showRandom, randomPosition]);

  const handleRandomPick = useCallback(() => {
    if (participants.length === 0) return;
    setRandomSpinning(true);

    let count = 0;
    const maxCount = 15;
    const interval = setInterval(() => {
      const randomIdx = Math.floor(Math.random() * participants.length);
      const name = participants[randomIdx].name;
      setRandomResult(name);
      whiteboardBroadcastRef.current?.({ type: 'random', action: 'spin', name });
      count++;
      if (count >= maxCount) {
        clearInterval(interval);
        const finalIdx = Math.floor(Math.random() * participants.length);
        const finalName = participants[finalIdx].name;
        setRandomResult(finalName);
        setRandomSpinning(false);
        whiteboardBroadcastRef.current?.({ type: 'random', action: 'result', name: finalName });
      }
    }, 100);
  }, [participants]);

  const handleRandomPositionChange = useCallback((pos: { x: number; y: number }) => {
    setRandomPosition(pos);
    whiteboardBroadcastRef.current?.({ type: 'random', action: 'move', position: pos });
  }, []);

  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => setNotification(null), 12000);
    return () => clearTimeout(timer);
  }, [notification]);

  const isOverlay = !!activeAssignment;

  const sidebarItems = [
    {
      id: 'whiteboard',
      label: 'Bảng vẽ',
      active: showWhiteboard,
      onClick: () => setShowWhiteboard(!showWhiteboard),
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 19l7-7 3 3-7 7-3-3z"/>
          <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
          <path d="M2 2l7.586 7.586"/>
          <circle cx="11" cy="11" r="2"/>
        </svg>
      ),
      show: true,
    },
    {
      id: 'chat',
      label: 'Chat',
      active: showChat,
      onClick: () => setShowChat(!showChat),
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      ),
      show: true,
    },
    {
      id: 'sandbox',
      label: 'Code',
      active: showSandbox,
      onClick: () => setShowSandbox(!showSandbox),
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 18 22 12 16 6"/>
          <polyline points="8 6 2 12 8 18"/>
        </svg>
      ),
      show: true,
    },
    {
      id: 'exercises',
      label: 'Bài tập',
      active: showExercises,
      onClick: () => setShowExercises(!showExercises),
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
        </svg>
      ),
      show: isHost,
    },
    {
      id: 'myAssignments',
      label: 'Bài của tôi',
      active: showAssignmentList,
      onClick: () => setShowAssignmentList(!showAssignmentList),
      badge: assignmentList.filter(a => !submittedAssignments.has(a.assignment_id)).length > 0
        ? assignmentList.filter(a => !submittedAssignments.has(a.assignment_id)).length
        : undefined,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
          <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
          <path d="M9 14l2 2 4-4"/>
        </svg>
      ),
      show: !isHost,
    },
    {
      id: 'timer',
      label: 'Bấm giờ',
      active: showTimer,
      onClick: handleToggleTimer,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
      ),
      show: isHost,
    },
    {
      id: 'random',
      label: 'Quay tên',
      active: showRandom,
      onClick: handleToggleRandom,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 3 21 3 21 8"/>
          <line x1="4" y1="20" x2="21" y2="3"/>
          <polyline points="21 16 21 21 16 21"/>
          <line x1="15" y1="15" x2="21" y2="21"/>
          <line x1="4" y1="4" x2="9" y2="9"/>
        </svg>
      ),
      show: isHost,
    },
    {
      id: 'sharedBoard',
      label: 'Bảng ghi chú',
      active: showSharedBoard || sharedBoardPublished,
      onClick: () => setShowSharedBoard(true),
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <path d="M9 3v18"/>
          <path d="M14 9h3"/>
          <path d="M14 14h3"/>
        </svg>
      ),
      show: true, // Show for both host and students
    },
  ];

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#0a0a0a', color: '#fff' }}>
      <style>{`
        .rc-sidebar-btn {
          opacity: 0.35;
          transition: all 0.15s ease;
        }
        .rc-sidebar-btn:hover {
          opacity: 0.9;
          background: rgba(255,255,255,0.08);
        }
        .rc-sidebar-btn.active {
          opacity: 1;
          background: rgba(255,255,255,0.1);
        }
      `}</style>

      {/* Main content */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
            <div
              key={isOverlay ? 'pip' : 'full'}
              style={{
                position: 'absolute',
                ...(isOverlay
                  ? {
                      width: '200px',
                      height: '112px',
                      bottom: '12px',
                      right: '12px',
                      top: 'auto',
                      left: 'auto',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      boxShadow: '0 4px 24px rgba(0,0,0,0.6)',
                      border: '2px solid rgba(255,255,255,0.12)',
                      zIndex: 10,
                    }
                  : { inset: 0, zIndex: 1 }),
              }}
            >
              <VideoTab
                token={token}
                serverUrl={serverUrl}
                onAssignmentReceived={handleAssignmentReceived}
                onWhiteboardEvent={handleWhiteboardEvent}
                onWhiteboardBroadcasterReady={handleWhiteboardBroadcasterReady}
                onParticipantsChange={setParticipants}
                onParticipantLeft={(p) => {
                  if (isHost) {
                    setParticipantLeftName(p.name);
                    setTimeout(() => setParticipantLeftName(null), 4000);
                  }
                }}
                onLeave={handleLeave}
                pip={isOverlay}
                isHost={isHost}
                hostId={hostId || undefined}
                currentUserName={currentUserName}
              />
            </div>

            {/* Sandbox - floating panel */}
            {showSandbox && (
              <SandboxTab sessionId={sessionId} onClose={() => setShowSandbox(false)} />
            )}

            {/* Chat panel - full-screen bottom sheet trên mobile, sidebar bên phải trên desktop (H-07) */}
            {showChat && (
              <div
                style={
                  isMobile
                    ? {
                        position: 'absolute',
                        inset: '8px',
                        bottom: '60px',
                        width: 'auto',
                        zIndex: 20,
                        background: '#0e0e0e',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        borderRadius: '16px',
                        border: '1px solid rgba(72,72,71,0.3)',
                        boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
                      }
                    : {
                        position: 'absolute',
                        top: '8px',
                        right: '56px',
                        bottom: '60px',
                        width: '360px',
                        zIndex: 20,
                        background: '#0e0e0e',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        borderRadius: '16px',
                        border: '1px solid rgba(72,72,71,0.3)',
                        boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
                      }
                }
              >
                <ChatTab
                  sessionId={sessionId}
                  onClose={() => setShowChat(false)}
                  broadcast={whiteboardBroadcastRef.current || undefined}
                  onChatMessage={handleChatMessageRegister}
                />
              </div>
            )}

            {/* Whiteboard - full-screen trên mobile, chừa chỗ cho toolbar/chat trên desktop (H-07) */}
            {showWhiteboard && (
              <div
                style={
                  isMobile
                    ? {
                        position: 'absolute',
                        inset: '8px',
                        bottom: '60px',
                        zIndex: 15,
                        background: '#000',
                        overflow: 'hidden',
                        borderRadius: '12px',
                        border: '1px solid rgba(255,255,255,0.08)',
                        boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
                      }
                    : {
                        position: 'absolute',
                        top: '8px',
                        left: '8px',
                        right: showChat ? '404px' : '56px',
                        bottom: '60px',
                        zIndex: 15,
                        background: '#000',
                        overflow: 'hidden',
                        borderRadius: '12px',
                        border: '1px solid rgba(255,255,255,0.08)',
                        boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
                      }
                }
              >
                <WhiteboardTab
                  sessionId={sessionId}
                  remoteWhiteboardEvent={remoteWhiteboardEvent}
                  isHost={isHost}
                  whiteboardShared={whiteboardShared}
                  whiteboardPublished={whiteboardPublished}
                  onClose={() => setShowWhiteboard(false)}
                  onBroadcast={(event) => whiteboardBroadcastRef.current?.(event)}
                  currentUserId={currentUserId || ''}
                  currentUserName={currentUserName}
                />
              </div>
            )}

            {/* Timer Modal */}
            {showTimer && !timerMinimized && (
              <TimerModal
                isHost={isHost}
                timeLeft={timerLeft}
                totalTime={timerTotal}
                isRunning={timerRunning}
                isPaused={timerPaused}
                position={timerPosition}
                onStart={handleTimerStart}
                onPause={handleTimerPause}
                onResume={handleTimerResume}
                onStop={handleTimerStop}
                onRestart={handleTimerRestart}
                zIndex={panelZIndex.timer}
                onFocus={() => bringToFront('timer')}
                onClose={() => {
                  if (isHost) {
                    handleTimerStop();
                    whiteboardBroadcastRef.current?.({ type: 'timer', action: 'hide' });
                  }
                  setShowTimer(false);
                  setTimerMinimized(false);
                }}
                onMinimize={() => setTimerMinimized(true)}
                onPositionChange={isHost ? handleTimerPositionChange : undefined}
              />
            )}

            {/* Minimized Timer */}
            {showTimer && timerMinimized && (
              <MinimizedTimer
                timeLeft={timerLeft}
                onClick={() => setTimerMinimized(false)}
              />
            )}

            {/* Random Picker Modal */}
            {showRandom && (
              <RandomPickerModal
                isHost={isHost}
                participants={participants}
                position={randomPosition}
                onPick={handleRandomPick}
                onClose={() => {
                  if (isHost) {
                    whiteboardBroadcastRef.current?.({ type: 'random', action: 'hide' });
                  }
                  setShowRandom(false);
                  setRandomResult(null);
                }}
                onPositionChange={isHost ? handleRandomPositionChange : undefined}
                result={randomResult}
                isSpinning={randomSpinning}
                zIndex={panelZIndex.randomPicker}
                onFocus={() => bringToFront('randomPicker')}
              />
            )}

        {/* Right sidebar - floating pill */}
        <div
          style={{
            position: 'absolute',
            right: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 30,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
            padding: '6px',
            background: 'rgba(20,20,20,0.85)',
            backdropFilter: 'blur(12px)',
            borderRadius: '16px',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          {sidebarItems.filter(item => item.show).map((item) => (
            <button
              key={item.id}
              onClick={item.onClick}
              title={item.label}
              className={`rc-sidebar-btn ${item.active ? 'active' : ''}`}
              style={{
                background: 'transparent',
                border: 'none',
                borderRadius: '10px',
                width: '34px',
                height: '34px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#fff',
                position: 'relative',
              }}
            >
              {item.icon}
              {item.badge && (
                <span style={{
                  position: 'absolute',
                  top: '2px',
                  right: '2px',
                  background: '#ff6352',
                  color: '#fff',
                  fontSize: '9px',
                  fontWeight: 700,
                  minWidth: '14px',
                  height: '14px',
                  borderRadius: '7px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 3px',
                }}>
                  {item.badge}
                </span>
              )}
            </button>
          ))}

          {/* Divider */}
          <div style={{ width: '20px', height: '1px', background: 'rgba(255,255,255,0.1)', margin: '4px 0' }} />

          {/* Record button */}
          {isHost && (
            <button
              onClick={() => setIsRecording(!isRecording)}
              title={isRecording ? 'Dừng ghi' : 'Ghi hình'}
              className={`rc-sidebar-btn ${isRecording ? 'active' : ''}`}
              style={{
                background: isRecording ? 'rgba(255,60,60,0.2)' : 'transparent',
                border: 'none',
                borderRadius: '10px',
                width: '34px',
                height: '34px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: isRecording ? '#ff4040' : '#fff',
                opacity: isRecording ? 1 : undefined,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill={isRecording ? '#ff4040' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                {isRecording
                  ? <rect x="9" y="9" width="6" height="6" rx="1" fill="#fff" stroke="none"/>
                  : <circle cx="12" cy="12" r="4" fill="currentColor"/>
                }
              </svg>
            </button>
          )}

        </div>
      </div>

      {/* Notification toast */}
      {notification && (
        <div
          style={{
            position: 'fixed',
            bottom: '100px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 200,
            display: 'flex',
            alignItems: 'center',
            gap: '0.875rem',
            background: 'rgba(30,30,30,0.96)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,99,82,0.35)',
            borderRadius: '16px',
            padding: '0.875rem 1.25rem',
            boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
            minWidth: '380px',
            maxWidth: '500px',
            animation: 'slideUp 0.3s cubic-bezier(0.16,1,0.3,1)',
          }}
        >
          <style>{`
            @keyframes slideUp {
              from { opacity: 0; transform: translateX(-50%) translateY(20px); }
              to { opacity: 1; transform: translateX(-50%) translateY(0); }
            }
          `}</style>
          <div style={{
            width: '44px', height: '44px', borderRadius: '12px',
            background: 'rgba(255,99,82,0.15)', border: '1px solid rgba(255,99,82,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.25rem', flexShrink: 0,
          }}>📋</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#ff6352', marginBottom: '0.2rem' }}>
              Bài tập mới được giao
            </div>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {notification.title}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
            <button onClick={handleOpenAssignment} style={{ background: '#ff6352', border: 'none', borderRadius: '10px', padding: '0.45rem 1rem', color: '#fff', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
              Làm bài
            </button>
            <button onClick={() => setNotification(null)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', padding: '0.45rem 0.75rem', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', cursor: 'pointer' }}>
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Exercise panel */}
      {showExercises && isHost && (
        <ExercisePanel
          sessionId={sessionId}
          hostId={hostId!}
          onClose={() => setShowExercises(false)}
          onBroadcast={(event) => whiteboardBroadcastRef.current?.(event)}
          currentUserId={currentUserId || ''}
          zIndex={panelZIndex.exercises}
          onFocus={() => bringToFront('exercises')}
        />
      )}

      {/* Student Assignment List */}
      {showAssignmentList && !isHost && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 400,
          background: '#0a0a0a',
          borderRadius: '16px',
          boxShadow: '0 25px 80px rgba(0,0,0,0.7)',
          width: '420px',
          maxHeight: '600px',
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.06)',
        }}>
          {/* Header */}
          <div style={{
            padding: '20px 20px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
              <h2 style={{
                fontSize: '16px',
                fontWeight: 600,
                color: '#fff',
                margin: 0,
                lineHeight: 1.4,
              }}>
                Tiếp tục hành trình<br />lập trình của bạn.
              </h2>
              <button
                onClick={() => setShowAssignmentList(false)}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: 'none',
                  color: '#888',
                  cursor: 'pointer',
                  padding: '8px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                  e.currentTarget.style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                  e.currentTarget.style.color = '#888';
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            {/* Search bar */}
            <div style={{
              display: 'flex',
              gap: '8px',
            }}>
              <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: '#111',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '10px',
                padding: '10px 12px',
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                <input
                  type="text"
                  placeholder="Tìm kiếm bài tập..."
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
              </div>
              <button style={{
                background: '#111',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '10px',
                padding: '10px 12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2">
                  <line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="16" y2="12"/><line x1="4" y1="18" x2="12" y2="18"/>
                </svg>
              </button>
            </div>
          </div>

          {/* List */}
          <div style={{ padding: '16px', maxHeight: '420px', overflowY: 'auto' }}>
            {assignmentList.length === 0 ? (
              <div style={{
                padding: '50px 20px',
                textAlign: 'center',
              }}>
                {/* Decorative graphics */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '12px',
                  marginBottom: '24px',
                }}>
                  <div style={{
                    width: '70px',
                    height: '50px',
                    background: 'rgba(255,255,255,0.04)',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <div style={{ width: '30px', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px' }} />
                  </div>
                  <div style={{
                    width: '70px',
                    height: '50px',
                    background: 'rgba(255,142,128,0.1)',
                    borderRadius: '10px',
                    border: '1px solid rgba(255,142,128,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ff8e80" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2"/>
                      <path d="M9 12l2 2 4-4"/>
                    </svg>
                  </div>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '12px',
                  marginBottom: '28px',
                }}>
                  <div style={{
                    width: '70px',
                    height: '50px',
                    background: 'rgba(255,255,255,0.04)',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2">
                      <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
                    </svg>
                  </div>
                  <div style={{
                    width: '70px',
                    height: '50px',
                    background: 'rgba(255,255,255,0.04)',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2">
                      <path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/>
                    </svg>
                  </div>
                </div>
                <h3 style={{
                  fontSize: '17px',
                  fontWeight: 700,
                  color: '#fff',
                  margin: '0 0 8px',
                  fontStyle: 'italic',
                }}>
                  Bạn chưa có bài tập nào
                </h3>
                <p style={{
                  fontSize: '13px',
                  color: '#666',
                  margin: 0,
                  lineHeight: 1.5,
                }}>
                  Khi giáo viên giao bài tập, chúng sẽ xuất hiện ở đây.<br />
                  Hãy tập trung học tập và sẵn sàng cho những thử thách mới!
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {assignmentList.map((assignment, index) => {
                  const difficultyConfig = {
                    easy: { label: 'EASY', color: '#4ade80', bg: 'rgba(74,222,128,0.15)' },
                    medium: { label: 'MEDIUM', color: '#fbbf24', bg: 'rgba(251,191,36,0.15)' },
                    hard: { label: 'HARD', color: '#f87171', bg: 'rgba(248,113,113,0.15)' },
                  };
                  const diff = difficultyConfig[assignment.difficulty as keyof typeof difficultyConfig] || difficultyConfig.medium;

                  return (
                    <div
                      key={assignment.assignment_id}
                      onClick={() => {
                        setActiveAssignment(assignment);
                        setShowAssignmentList(false);
                      }}
                      style={{
                        background: '#0f0f0f',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '14px',
                        padding: '16px 18px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#161616';
                        e.currentTarget.style.borderColor = 'rgba(56,189,248,0.3)';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#0f0f0f';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      {/* Tags & Difficulty */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                        {assignment.language && assignment.language.length > 0 && (
                          <span style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '4px 10px',
                            borderRadius: '4px',
                            background: 'rgba(56,189,248,0.15)',
                            color: '#38bdf8',
                            letterSpacing: '0.3px',
                            textTransform: 'uppercase',
                          }}>
                            {assignment.language[0]}
                          </span>
                        )}
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '4px 10px',
                          borderRadius: '4px',
                          background: diff.bg,
                          color: diff.color,
                          letterSpacing: '0.3px',
                        }}>
                          {diff.label}
                        </span>
                      </div>

                      {/* Title */}
                      <h4 style={{
                        fontSize: '16px',
                        fontWeight: 700,
                        color: '#fff',
                        margin: '0 0 10px',
                        lineHeight: 1.4,
                      }}>
                        {assignment.title}
                      </h4>

                      {/* Time Info */}
                      {assignment.end_time && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          marginBottom: '12px',
                          fontSize: '11px',
                          color: 'rgba(255,255,255,0.5)',
                        }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="12 6 12 12 16 14"/>
                          </svg>
                          <span>
                            Hạn nộp: {new Date(assignment.end_time).toLocaleString('vi-VN', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      )}

                      {/* Action Button */}
                      {submittedAssignments.has(assignment.assignment_id) ? (
                        <div
                          style={{
                            width: '100%',
                            padding: '11px',
                            background: 'rgba(0,200,100,0.1)',
                            border: '1px solid rgba(0,200,100,0.2)',
                            borderRadius: '8px',
                            color: '#00c864',
                            fontSize: '12px',
                            fontWeight: 600,
                            textAlign: 'center',
                            letterSpacing: '0.3px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                          ĐÃ NỘP
                        </div>
                      ) : (
                        <button
                          style={{
                            width: '100%',
                            padding: '11px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                            color: '#fff',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                            letterSpacing: '0.3px',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(56,189,248,0.1)';
                            e.currentTarget.style.borderColor = 'rgba(56,189,248,0.3)';
                            e.currentTarget.style.color = '#38bdf8';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                            e.currentTarget.style.color = '#fff';
                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                          }}
                        >
                          BẮT ĐẦU NGAY
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Assignment work overlay */}
      {activeAssignment && currentUserId && (
        <AssignmentWorkOverlay
          assignmentId={activeAssignment.assignment_id}
          title={activeAssignment.title}
          userId={currentUserId}
          isHost={isHost}
          onClose={(wasSubmitted?: boolean) => {
            if (wasSubmitted) {
              setSubmittedAssignments(prev => new Set([...Array.from(prev), activeAssignment.assignment_id]));
            }
            setActiveAssignment(null);
          }}
        />
      )}

      {/* Hand raised notification (for host) */}
      {handRaisedName && isHost && (
        <HandRaisedNotification name={handRaisedName} onClose={() => setHandRaisedName(null)} />
      )}

      {/* Participant left notification (for host) */}
      {participantLeftName && isHost && (
        <div
          style={{
            position: 'fixed',
            top: '80px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'linear-gradient(145deg, #1e1e1e, #161616)',
            borderRadius: '12px',
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            border: '1px solid rgba(248,113,113,0.2)',
            zIndex: 1000,
            animation: 'slideDown 0.3s ease',
          }}
        >
          <style>{`
            @keyframes slideDown {
              from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
              to { opacity: 1; transform: translateX(-50%) translateY(0); }
            }
          `}</style>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'rgba(248,113,113,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>
              {participantLeftName}
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>
              đã rời khỏi phòng
            </div>
          </div>
          <button
            onClick={() => setParticipantLeftName(null)}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.4)',
              cursor: 'pointer',
              padding: '4px',
              marginLeft: '8px',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      )}

      {leaveRequestName && isHost && (
        <LeaveRequestNotification
          name={leaveRequestName}
          onClose={() => {
            // Closing notification = rejection
            whiteboardBroadcastRef.current?.({ type: 'leave_response', name: leaveRequestName, approved: false });
            setLeaveRequestName(null);
          }}
          onApprove={() => {
            whiteboardBroadcastRef.current?.({ type: 'leave_response', name: leaveRequestName, approved: true });
            setLeaveRequestName(null);
          }}
          onReject={() => {
            whiteboardBroadcastRef.current?.({ type: 'leave_response', name: leaveRequestName, approved: false });
            setLeaveRequestName(null);
          }}
        />
      )}

      {shareRequestName && isHost && (
        <ShareRequestNotification
          name={shareRequestName}
          onClose={() => {
            // Closing notification = rejection
            whiteboardBroadcastRef.current?.({ type: 'share_response', name: shareRequestName, approved: false });
            setShareRequestName(null);
          }}
          onApprove={() => {
            whiteboardBroadcastRef.current?.({ type: 'share_response', name: shareRequestName, approved: true });
            setShareRequestName(null);
          }}
          onReject={() => {
            whiteboardBroadcastRef.current?.({ type: 'share_response', name: shareRequestName, approved: false });
            setShareRequestName(null);
          }}
        />
      )}

      {/* Response notification (for students) */}
      {responseMessage && !isHost && (
        <ResponseNotification
          type={responseMessage.type}
          approved={responseMessage.approved}
          onClose={() => setResponseMessage(null)}
        />
      )}

      {/* Shared Board Panel */}
      {showSharedBoard && (
        <SharedBoardPanel
          isHost={isHost}
          participants={participants}
          isPublished={sharedBoardPublished}
          onPublishChange={handleSharedBoardPublishChange}
          onClose={() => setShowSharedBoard(false)}
          onBroadcast={(event) => whiteboardBroadcastRef.current?.(event)}
          currentUserName={currentUserName}
          currentUserIdentity={currentUserId || undefined}
          studentBoards={studentBoards}
          onStudentBoardUpdate={handleStudentBoardUpdate}
          zIndex={panelZIndex.sharedBoard}
          onFocus={() => bringToFront('sharedBoard')}
        />
      )}

      {/* Mini board for students when published */}
      {!isHost && sharedBoardPublished && !showSharedBoard && currentUserId && (
        <StudentMiniBoard
          data={studentBoards.get(currentUserId) || { elements: [] }}
          isPublished={sharedBoardPublished}
          onDataChange={(data) => {
            handleStudentBoardUpdate(currentUserId, data);
            whiteboardBroadcastRef.current?.({
              type: 'shared_board_student_draw',
              identity: currentUserId,
              name: currentUserName,
              elements: data.elements,
              files: data.files,
            });
          }}
          onClose={() => {}}
        />
      )}

      {/* Animation keyframes */}
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
          to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  );
}
