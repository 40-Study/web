'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// Unified color palette (same as ExercisePanel and SharedBoardPanel)
const COLORS = {
  bg: '#0e0e0e',
  surface: '#1a1a1a',
  surfaceHigh: '#262626',
  primary: '#ff8e80',
  primaryDim: '#ff7162',
  accent: '#3b82f6',
  text: '#ffffff',
  textMuted: '#adaaaa',
  textDim: '#767575',
  border: '#484847',
  borderDim: 'rgba(72,72,71,0.3)',
  success: '#ff8e80',
  warning: '#ffb020',
  danger: '#ff6352',
};

// Play notification sound using Web Audio API
function playNotificationSound() {
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
}

// Play tick sound (for countdown <= 10 seconds) - pleasant but urgent
function playTickSound() {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = audioContext.currentTime;

    // Main tone - soft "ding" sound
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();

    osc.connect(gain);
    gain.connect(audioContext.destination);

    osc.frequency.value = 587.33; // D5 - pleasant, attention-grabbing
    osc.type = 'sine';

    // Soft attack, quick decay - sounds like a gentle tap
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    osc.start(now);
    osc.stop(now + 0.12);

    // Add subtle harmonic for richness
    const osc2 = audioContext.createOscillator();
    const gain2 = audioContext.createGain();
    osc2.connect(gain2);
    gain2.connect(audioContext.destination);
    osc2.frequency.value = 1174.66; // D6 (octave up)
    osc2.type = 'sine';
    gain2.gain.setValueAtTime(0, now);
    gain2.gain.linearRampToValueAtTime(0.08, now + 0.01);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
    osc2.start(now);
    osc2.stop(now + 0.08);
  } catch {}
}

// Play ring/alarm sound (for time's up - 3 seconds)
function playRingSound() {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

    const playBeep = (startTime: number, freq: number) => {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      osc.connect(gain);
      gain.connect(audioContext.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.3, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);
      osc.start(startTime);
      osc.stop(startTime + 0.15);
    };

    // Ring pattern: beep beep beep, pause, repeat for 3 seconds
    const now = audioContext.currentTime;
    for (let i = 0; i < 6; i++) {
      const baseTime = now + i * 0.5;
      playBeep(baseTime, 880);
      playBeep(baseTime + 0.18, 1100);
    }
  } catch {}
}

// ===== DRAGGABLE MODAL (macOS style) =====
export function DraggableModal({
  children,
  onClose,
  position,
  onPositionChange,
  canClose = true,
  zIndex = 200,
  onFocus,
}: {
  children: React.ReactNode;
  onClose?: () => void;
  position: { x: number; y: number };
  onPositionChange?: (pos: { x: number; y: number }) => void;
  canClose?: boolean;
  zIndex?: number;
  onFocus?: () => void;
}) {
  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    onFocus?.();
    if ((e.target as HTMLElement).closest('button, input, textarea')) return;
    setDragging(true);
    setOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  useEffect(() => {
    if (!dragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newPos = {
        x: e.clientX - offset.x,
        y: e.clientY - offset.y,
      };
      onPositionChange?.(newPos);
    };

    const handleMouseUp = () => setDragging(false);

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, offset, onPositionChange]);

  return (
    <div
      onClick={onFocus}
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        zIndex,
        background: COLORS.surface,
        borderRadius: '8px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        cursor: dragging ? 'grabbing' : 'default',
        userSelect: 'none',
      }}
    >
      {/* Header - draggable area */}
      <div
        onMouseDown={handleMouseDown}
        style={{
          background: COLORS.surfaceHigh,
          padding: '6px 8px',
          borderRadius: '8px 8px 0 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          cursor: 'grab',
          minHeight: '16px',
        }}
      >
        {/* Close button (host only) */}
        {canClose && onClose && (
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'rgba(255,255,255,0.5)',
              borderRadius: '4px',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        )}
      </div>
      {/* Content */}
      <div style={{ padding: '16px' }}>{children}</div>
    </div>
  );
}

// ===== SIMPLE TIMER DIGIT BOX =====
function TimerDigitBox({ value, label }: { value: string; label: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{
        background: COLORS.surfaceHigh,
        borderRadius: '6px',
        padding: '12px 14px',
        minWidth: '52px',
        textAlign: 'center',
      }}>
        <span style={{
          fontSize: '1.8rem',
          fontWeight: 500,
          color: COLORS.text,
          fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
        }}>
          {value}
        </span>
      </div>
      <span style={{
        fontSize: '0.5rem',
        color: COLORS.textDim,
        marginTop: '6px',
        textTransform: 'uppercase',
        letterSpacing: '1px',
      }}>
        {label}
      </span>
    </div>
  );
}

// ===== SIMPLE DIGIT INPUT (for setup) =====
function DigitInput({ value, label, onIncrement, onDecrement }: {
  value: number;
  label: string;
  onIncrement: () => void;
  onDecrement: () => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <button
        onClick={onIncrement}
        style={{
          background: 'transparent', border: 'none', color: COLORS.textDim,
          cursor: 'pointer', padding: '4px',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 8l-6 6h12z"/>
        </svg>
      </button>
      <div style={{
        background: COLORS.surfaceHigh,
        borderRadius: '6px',
        padding: '12px 14px',
        minWidth: '52px',
        textAlign: 'center',
      }}>
        <span style={{
          fontSize: '1.8rem',
          fontWeight: 500,
          color: COLORS.text,
          fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
        }}>
          {value.toString().padStart(2, '0')}
        </span>
      </div>
      <button
        onClick={onDecrement}
        style={{
          background: 'transparent', border: 'none', color: COLORS.textDim,
          cursor: 'pointer', padding: '4px',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 16l6-6H6z"/>
        </svg>
      </button>
      <span style={{
        fontSize: '0.5rem',
        color: COLORS.textDim,
        marginTop: '4px',
        textTransform: 'uppercase',
        letterSpacing: '1px',
      }}>
        {label}
      </span>
    </div>
  );
}

// ===== MINIMIZED TIMER (Dynamic Island style) =====
export function MinimizedTimer({
  timeLeft,
  onClick,
}: {
  timeLeft: number;
  onClick: () => void;
}) {
  const m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const s = (timeLeft % 60).toString().padStart(2, '0');
  const isLow = timeLeft <= 10 && timeLeft > 0;

  return (
    <button
      onClick={onClick}
      style={{
        position: 'fixed',
        bottom: '80px',
        right: '20px',
        zIndex: 300,
        background: isLow ? COLORS.danger : COLORS.bg,
        border: 'none',
        borderRadius: '22px',
        padding: '8px 14px',
        color: COLORS.text,
        fontSize: '15px',
        fontWeight: 600,
        fontFamily: "'SF Mono', -apple-system, monospace",
        cursor: 'pointer',
        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        transition: 'all 0.2s ease',
      }}
    >
      <div style={{
        width: 6, height: 6, borderRadius: '50%',
        background: isLow ? COLORS.text : COLORS.warning,
        animation: 'pulse 1s infinite',
      }} />
      {m}:{s}
    </button>
  );
}

// ===== TIMER MODAL (iOS Clock style) =====
export function TimerModal({
  isHost,
  timeLeft,
  totalTime,
  isRunning,
  isPaused,
  position,
  onStart,
  onPause,
  onResume,
  onStop,
  onRestart,
  onClose,
  onMinimize,
  onPositionChange,
  zIndex = 200,
  onFocus,
}: {
  isHost: boolean;
  timeLeft: number;
  totalTime: number;
  isRunning: boolean;
  isPaused: boolean;
  position: { x: number; y: number };
  onStart?: (duration: number) => void;
  onPause?: () => void;
  onResume?: () => void;
  onStop?: () => void;
  onRestart?: () => void;
  onClose: () => void;
  onMinimize?: () => void;
  onPositionChange?: (pos: { x: number; y: number }) => void;
  zIndex?: number;
  onFocus?: () => void;
}) {
  const [minutes, setMinutes] = useState(5);
  const [seconds, setSeconds] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [dragging, setDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const handleStart = () => {
    const total = minutes * 60 + seconds;
    if (total > 0) onStart?.(total);
  };

  const isLow = timeLeft <= 10 && timeLeft > 0;
  const isFinished = isRunning && timeLeft === 0;
  const timerActive = isRunning || isFinished;

  const displayM = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const displayS = (timeLeft % 60).toString().padStart(2, '0');

  const progress = totalTime > 0 ? (timeLeft / totalTime) : 0;
  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference * (1 - progress);

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    setDragging(true);
    dragOffset.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent) => {
      onPositionChange?.({
        x: Math.max(0, Math.min(window.innerWidth - 280, e.clientX - dragOffset.current.x)),
        y: Math.max(0, Math.min(window.innerHeight - 100, e.clientY - dragOffset.current.y)),
      });
    };
    const onUp = () => setDragging(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [dragging, onPositionChange]);

  // Sound effects for timer
  const prevTimeLeftRef = useRef(timeLeft);
  const hasPlayedRingRef = useRef(false);

  useEffect(() => {
    const prevTime = prevTimeLeftRef.current;

    // Reset ring flag when timer is reset to a new time
    if (timeLeft > 0 && prevTime === 0) {
      hasPlayedRingRef.current = false;
    }

    // Play tick sound when <= 10 seconds and time actually decreased
    if (isRunning && timeLeft <= 10 && timeLeft > 0 && timeLeft < prevTime) {
      playTickSound();
    }

    // Play ring sound ONLY when time just reached 0 (transitioned from >0 to 0)
    if (isRunning && timeLeft === 0 && prevTime > 0 && !hasPlayedRingRef.current) {
      hasPlayedRingRef.current = true;
      playRingSound();
    }

    prevTimeLeftRef.current = timeLeft;
  }, [timeLeft, isRunning]);

  const progressColor = isFinished ? COLORS.danger : isLow ? COLORS.warning : COLORS.success;

  return (
    <div
      onClick={onFocus}
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        zIndex,
        background: COLORS.bg,
        borderRadius: '16px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        overflow: 'hidden',
        width: '220px',
      }}
    >
      {/* Title Bar */}
      <div
        onMouseDown={(e) => { onFocus?.(); handleMouseDown(e); }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          height: '36px',
          display: 'flex',
          alignItems: 'center',
          padding: '0 14px',
          cursor: 'move',
          userSelect: 'none',
        }}
      >
        {/* Traffic Lights */}
        <div style={{ display: 'flex', gap: 8 }}>
          {/* Close - Red (host only) */}
          {isHost ? (
            <button
              onClick={onClose}
              style={{
                width: 12, height: 12, borderRadius: '50%',
                background: '#ff5f56', border: 'none', cursor: 'pointer',
                fontSize: 8, color: hovered ? '#4d0000' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >✕</button>
          ) : (
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: COLORS.border }} />
          )}
          {/* Minimize - Yellow (everyone) */}
          <button
            onClick={onMinimize}
            style={{
              width: 12, height: 12, borderRadius: '50%',
              background: '#ffbd2e', border: 'none', cursor: 'pointer',
              fontSize: 9, color: hovered ? '#995700' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >−</button>
        </div>
        <div style={{ flex: 1 }} />
      </div>

      {/* Content */}
      <div style={{ padding: '8px 20px 20px' }}>
        {!timerActive && isHost ? (
          // ===== SETUP =====
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Time picker */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0', marginBottom: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <button onClick={() => setMinutes(m => Math.min(59, m + 1))} style={{ background: 'none', border: 'none', color: COLORS.border, cursor: 'pointer', padding: '4px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 8l-6 6h12z"/></svg>
                </button>
                <span style={{
                  fontSize: '48px',
                  fontWeight: 200,
                  color: COLORS.text,
                  fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
                  width: '64px',
                  textAlign: 'center',
                  lineHeight: 1,
                }}>
                  {minutes.toString().padStart(2, '0')}
                </span>
                <button onClick={() => setMinutes(m => Math.max(0, m - 1))} style={{ background: 'none', border: 'none', color: COLORS.border, cursor: 'pointer', padding: '4px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 16l6-6H6z"/></svg>
                </button>
              </div>
              <span style={{ fontSize: '48px', fontWeight: 200, color: COLORS.border, fontFamily: "'SF Pro Display', -apple-system" }}>:</span>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <button onClick={() => setSeconds(s => Math.min(59, s + 1))} style={{ background: 'none', border: 'none', color: COLORS.border, cursor: 'pointer', padding: '4px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 8l-6 6h12z"/></svg>
                </button>
                <span style={{
                  fontSize: '48px',
                  fontWeight: 200,
                  color: COLORS.text,
                  fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
                  width: '64px',
                  textAlign: 'center',
                  lineHeight: 1,
                }}>
                  {seconds.toString().padStart(2, '0')}
                </span>
                <button onClick={() => setSeconds(s => Math.max(0, s - 1))} style={{ background: 'none', border: 'none', color: COLORS.border, cursor: 'pointer', padding: '4px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 16l6-6H6z"/></svg>
                </button>
              </div>
            </div>
            {/* Start button */}
            <button
              onClick={handleStart}
              style={{
                width: '48px',
                height: '48px',
                background: COLORS.success,
                border: 'none',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill={COLORS.bg}>
                <polygon points="6,4 20,12 6,20"/>
              </svg>
            </button>
          </div>
        ) : (
          // ===== RUNNING =====
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Circular progress */}
            <div style={{ position: 'relative', width: '130px', height: '130px', marginBottom: '16px' }}>
              <svg width="130" height="130" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="65" cy="65" r="56" fill="none" stroke={COLORS.surfaceHigh} strokeWidth="6" />
                <circle
                  cx="65" cy="65" r="56" fill="none"
                  stroke={progressColor}
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 56}
                  strokeDashoffset={2 * Math.PI * 56 * (1 - progress)}
                  style={{ transition: 'stroke-dashoffset 0.3s linear, stroke 0.3s' }}
                />
              </svg>
              <div style={{
                position: 'absolute',
                top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
              }}>
                <span style={{
                  fontSize: '36px',
                  fontWeight: 200,
                  color: COLORS.text,
                  fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
                  letterSpacing: '1px',
                }}>
                  {displayM}:{displayS}
                </span>
              </div>
            </div>

            {/* Status indicator */}
            {(isPaused || isFinished) && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '16px',
                padding: '4px 12px',
                background: isPaused ? `${COLORS.warning}26` : `${COLORS.danger}26`,
                borderRadius: '12px',
              }}>
                <div style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: isPaused ? COLORS.warning : COLORS.danger,
                }} />
                <span style={{
                  fontSize: '12px',
                  fontWeight: 500,
                  color: isPaused ? COLORS.warning : COLORS.danger,
                  fontFamily: "'SF Pro Text', -apple-system",
                }}>
                  {isPaused ? 'PAUSED' : 'DONE'}
                </span>
              </div>
            )}

            {/* Controls */}
            {isHost && (
              <div style={{ display: 'flex', gap: '12px' }}>
                {/* Cancel */}
                <button
                  onClick={onStop}
                  style={{
                    width: '44px',
                    height: '44px',
                    background: COLORS.surfaceHigh,
                    border: 'none',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={COLORS.text} strokeWidth="2" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>

                {/* Pause/Play */}
                {!isFinished ? (
                  <button
                    onClick={isPaused ? onResume : onPause}
                    style={{
                      width: '44px',
                      height: '44px',
                      background: isPaused ? COLORS.success : COLORS.warning,
                      border: 'none',
                      borderRadius: '50%',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {isPaused ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill={COLORS.bg}>
                        <polygon points="7,5 19,12 7,19"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill={COLORS.bg}>
                        <rect x="6" y="5" width="4" height="14" rx="1"/>
                        <rect x="14" y="5" width="4" height="14" rx="1"/>
                      </svg>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={onRestart}
                    style={{
                      width: '44px',
                      height: '44px',
                      background: COLORS.success,
                      border: 'none',
                      borderRadius: '50%',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={COLORS.bg} strokeWidth="2" strokeLinecap="round">
                      <path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
                    </svg>
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ===== RANDOM PICKER MODAL (Wheel Spinner) =====
export function RandomPickerModal({
  isHost,
  participants,
  position,
  onPick,
  onClose,
  onPositionChange,
  result,
  isSpinning,
  zIndex = 200,
  onFocus,
}: {
  isHost: boolean;
  participants: { identity: string; name: string }[];
  position: { x: number; y: number };
  onPick?: () => void;
  onClose: () => void;
  onPositionChange?: (pos: { x: number; y: number }) => void;
  result?: string | null;
  isSpinning?: boolean;
  zIndex?: number;
  onFocus?: () => void;
}) {
  const [rotation, setRotation] = useState(0);
  const wheelSize = 280;
  const centerSize = 60;

  // Colors for wheel segments - simple pastel tones
  const colors = [
    '#94a3b8', '#a1a1aa', '#9ca3af', '#a8a29e', '#a3a3a3',
    '#b4b4b4', '#9e9e9e', '#8b8b8b', '#a0aec0', '#b0b0b0',
  ];

  // Calculate segment angle
  const segmentAngle = participants.length > 0 ? 360 / participants.length : 360;

  // Spin the wheel when picking starts
  useEffect(() => {
    if (isSpinning && participants.length > 0) {
      // More rotations (8-12 full spins) for smoother feel + random stop position
      const extraSpins = (8 + Math.random() * 4) * 360;
      const randomOffset = Math.random() * 360;
      setRotation(prev => prev + extraSpins + randomOffset);
    }
  }, [isSpinning, participants.length]);

  // Draw wheel segment path
  const getSegmentPath = (index: number, total: number) => {
    if (total === 1) {
      // Full circle for single participant
      return `M ${wheelSize/2} ${wheelSize/2} m -${wheelSize/2 - 10}, 0 a ${wheelSize/2 - 10},${wheelSize/2 - 10} 0 1,0 ${wheelSize - 20},0 a ${wheelSize/2 - 10},${wheelSize/2 - 10} 0 1,0 -${wheelSize - 20},0`;
    }
    const startAngle = (index * segmentAngle - 90) * Math.PI / 180;
    const endAngle = ((index + 1) * segmentAngle - 90) * Math.PI / 180;
    const radius = wheelSize / 2 - 10;
    const x1 = wheelSize/2 + radius * Math.cos(startAngle);
    const y1 = wheelSize/2 + radius * Math.sin(startAngle);
    const x2 = wheelSize/2 + radius * Math.cos(endAngle);
    const y2 = wheelSize/2 + radius * Math.sin(endAngle);
    const largeArc = segmentAngle > 180 ? 1 : 0;
    return `M ${wheelSize/2} ${wheelSize/2} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
  };

  // Get text position for segment
  const getTextPosition = (index: number, total: number) => {
    const angle = ((index + 0.5) * segmentAngle - 90) * Math.PI / 180;
    const radius = (wheelSize / 2 - 10) * 0.65;
    return {
      x: wheelSize/2 + radius * Math.cos(angle),
      y: wheelSize/2 + radius * Math.sin(angle),
      rotation: (index + 0.5) * segmentAngle,
    };
  };

  return (
    <DraggableModal
      onClose={onClose}
      position={position}
      onPositionChange={onPositionChange}
      zIndex={zIndex}
      onFocus={onFocus}
    >

      <div style={{ textAlign: 'center', padding: '8px' }}>
        {/* Wheel container */}
        <div style={{
          position: 'relative',
          width: wheelSize,
          height: wheelSize,
          margin: '0 auto 16px',
        }}>
          {/* Pointer/Arrow at top */}
          <div style={{
            position: 'absolute',
            top: -8,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10,
            width: 0,
            height: 0,
            borderLeft: '10px solid transparent',
            borderRight: '10px solid transparent',
            borderTop: `16px solid ${COLORS.primary}`,
            filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.2))',
          }} />

          {/* Wheel SVG */}
          <svg
            width={wheelSize}
            height={wheelSize}
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: isSpinning ? 'transform 6s cubic-bezier(0.15, 0.85, 0.25, 1)' : 'none',
            }}
          >
            {/* Outer ring */}
            <circle
              cx={wheelSize/2}
              cy={wheelSize/2}
              r={wheelSize/2 - 5}
              fill="none"
              stroke={COLORS.primary}
              strokeWidth="3"
            />

            {/* Segments */}
            {participants.length > 0 ? participants.map((p, i) => (
              <g key={p.identity}>
                <path
                  d={getSegmentPath(i, participants.length)}
                  fill={colors[i % colors.length]}
                  stroke={COLORS.surface}
                  strokeWidth="2"
                />
                {/* Text label */}
                {(() => {
                  const pos = getTextPosition(i, participants.length);
                  const displayName = p.name.length > 8 ? p.name.slice(0, 7) + '…' : p.name;
                  return (
                    <text
                      x={pos.x}
                      y={pos.y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill={COLORS.text}
                      fontSize={participants.length > 8 ? '10' : '12'}
                      fontWeight="600"
                      transform={`rotate(${pos.rotation}, ${pos.x}, ${pos.y})`}
                      style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}
                    >
                      {displayName}
                    </text>
                  );
                })()}
              </g>
            )) : (
              <circle
                cx={wheelSize/2}
                cy={wheelSize/2}
                r={wheelSize/2 - 15}
                fill={COLORS.surfaceHigh}
              />
            )}

            {/* Center circle */}
            <circle
              cx={wheelSize/2}
              cy={wheelSize/2}
              r={centerSize/2}
              fill={COLORS.surface}
              stroke={COLORS.primary}
              strokeWidth="2"
            />
            <circle
              cx={wheelSize/2}
              cy={wheelSize/2}
              r={8}
              fill={COLORS.primary}
            />
          </svg>

        </div>

        {/* Result display */}
        {result && !isSpinning && (
          <div style={{
            background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDim} 100%)`,
            borderRadius: '10px',
            padding: '12px 20px',
            marginBottom: '12px',
          }}>
            <div style={{ fontSize: '0.7rem', color: 'rgba(0,0,0,0.5)', marginBottom: '4px', fontWeight: 500 }}>
              Được chọn
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 600, color: COLORS.bg }}>
              {result}
            </div>
          </div>
        )}

        {/* Spin button */}
        {isHost && (
          <button
            onClick={onPick}
            disabled={isSpinning || participants.length === 0}
            style={{
              width: '100%',
              background: isSpinning
                ? COLORS.border
                : `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDim} 100%)`,
              border: 'none',
              borderRadius: '10px',
              padding: '12px',
              color: isSpinning ? COLORS.textMuted : COLORS.bg,
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: isSpinning || participants.length === 0 ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {isSpinning ? 'Đang quay...' : 'Quay ngẫu nhiên'}
          </button>
        )}

        {/* Participant count */}
        <div style={{
          fontSize: '0.75rem',
          color: COLORS.textDim,
          marginTop: '8px',
        }}>
          {participants.length} học sinh
        </div>
      </div>
    </DraggableModal>
  );
}

// ===== NOTE NOTIFICATION =====
export function NoteNotification({ content, onClose }: { content: string; onClose: () => void }) {
  return (
    <div style={{
      position: 'fixed',
      bottom: '100px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 200,
      background: COLORS.surface,
      borderRadius: '12px',
      padding: '1rem 1.5rem',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      border: `1px solid ${COLORS.success}4D`,
      maxWidth: '400px',
      animation: 'slideUp 0.3s ease-out',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: '8px',
          background: `${COLORS.success}26`, display: 'flex',
          alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          fontSize: '1rem',
        }}>
          📝
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.65rem', color: COLORS.success, fontWeight: 600, marginBottom: '0.25rem' }}>
            Ghi chú từ giáo viên
          </div>
          <div style={{ fontSize: '0.85rem', color: COLORS.text, lineHeight: 1.5 }}>{content}</div>
        </div>
        <button onClick={onClose} style={{
          background: 'transparent', border: 'none', color: COLORS.textDim,
          cursor: 'pointer', padding: '0.2rem',
        }}>
          ✕
        </button>
      </div>
    </div>
  );
}

// ===== HAND RAISED NOTIFICATION =====
export function HandRaisedNotification({ name, onClose }: { name: string; onClose: () => void }) {
  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 200,
      background: `linear-gradient(135deg, ${COLORS.warning} 0%, #e6a01c 100%)`,
      borderRadius: '12px',
      padding: '12px 20px',
      boxShadow: `0 8px 24px ${COLORS.warning}66`,
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      animation: 'slideDown 0.3s ease-out',
    }}>
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes handWave {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(20deg); }
          75% { transform: rotate(-20deg); }
        }
      `}</style>
      <span style={{ fontSize: '1.5rem', animation: 'handWave 0.5s ease-in-out infinite' }}>✋</span>
      <span style={{ fontSize: '14px', fontWeight: 600, color: COLORS.bg }}>{name} giơ tay</span>
      <button
        onClick={onClose}
        style={{
          background: 'rgba(0,0,0,0.1)',
          border: 'none',
          borderRadius: '6px',
          padding: '4px 8px',
          cursor: 'pointer',
          color: COLORS.bg,
          fontSize: '12px',
          marginLeft: '8px',
        }}
      >
        OK
      </button>
    </div>
  );
}

// ===== LEAVE REQUEST NOTIFICATION =====
export function LeaveRequestNotification({ name, onClose, onApprove, onReject }: {
  name: string;
  onClose: () => void;
  onApprove?: () => void;
  onReject?: () => void;
}) {
  // Play notification sound on mount
  useEffect(() => {
    playNotificationSound();
  }, []);

  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      zIndex: 300,
      background: '#1a1a1a',
      borderRadius: '16px',
      padding: '1.5rem',
      boxShadow: '0 16px 64px rgba(0,0,0,0.6)',
      border: '1px solid rgba(239,68,68,0.3)',
      minWidth: '320px',
      animation: 'slideDown 0.3s ease-out',
    }}>
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
          to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '10px',
            background: 'rgba(239,68,68,0.15)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: '1.3rem' }}>🚪</span>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: '2px' }}>Yêu cầu rời phòng</div>
            <div style={{ fontSize: '1rem', fontWeight: 600, color: '#fff' }}>{name}</div>
          </div>
        </div>
        <button onClick={onClose} style={{
          background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)',
          cursor: 'pointer', padding: '0.25rem',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      {/* Message */}
      <p style={{
        fontSize: '0.85rem',
        color: 'rgba(255,255,255,0.7)',
        marginBottom: '1.25rem',
        lineHeight: 1.5,
      }}>
        Học sinh <strong style={{ color: '#fff' }}>{name}</strong> xin phép rời khỏi phòng học.
      </p>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={() => { onReject?.(); onClose(); }}
          style={{
            flex: 1,
            background: 'rgba(239,68,68,0.15)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '8px',
            padding: '0.6rem',
            color: '#ef4444',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.25)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; }}
        >
          Từ chối
        </button>
        <button
          onClick={() => { onApprove?.(); onClose(); }}
          style={{
            flex: 1,
            background: '#10b981',
            border: 'none',
            borderRadius: '8px',
            padding: '0.6rem',
            color: '#fff',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#059669'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#10b981'; }}
        >
          Cho phép
        </button>
      </div>
    </div>
  );
}

// ===== SHARE REQUEST NOTIFICATION =====
export function ShareRequestNotification({ name, onClose, onApprove, onReject }: {
  name: string;
  onClose: () => void;
  onApprove?: () => void;
  onReject?: () => void;
}) {
  // Play notification sound on mount
  useEffect(() => {
    playNotificationSound();
  }, []);

  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      zIndex: 300,
      background: '#1a1a1a',
      borderRadius: '16px',
      padding: '1.5rem',
      boxShadow: '0 16px 64px rgba(0,0,0,0.6)',
      border: '1px solid rgba(59,130,246,0.3)',
      minWidth: '320px',
      animation: 'slideDown 0.3s ease-out',
    }}>
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
          to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '10px',
            background: 'rgba(59,130,246,0.15)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: '1.3rem' }}>🖥️</span>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: '2px' }}>Yêu cầu chia sẻ màn hình</div>
            <div style={{ fontSize: '1rem', fontWeight: 600, color: '#fff' }}>{name}</div>
          </div>
        </div>
        <button onClick={onClose} style={{
          background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)',
          cursor: 'pointer', padding: '0.25rem',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      {/* Message */}
      <p style={{
        fontSize: '0.85rem',
        color: 'rgba(255,255,255,0.7)',
        marginBottom: '1.25rem',
        lineHeight: 1.5,
      }}>
        Học sinh <strong style={{ color: '#fff' }}>{name}</strong> xin phép chia sẻ màn hình.
      </p>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={() => { onReject?.(); onClose(); }}
          style={{
            flex: 1,
            background: 'rgba(239,68,68,0.15)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '8px',
            padding: '0.6rem',
            color: '#ef4444',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.25)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; }}
        >
          Từ chối
        </button>
        <button
          onClick={() => { onApprove?.(); onClose(); }}
          style={{
            flex: 1,
            background: '#3b82f6',
            border: 'none',
            borderRadius: '8px',
            padding: '0.6rem',
            color: '#fff',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#2563eb'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#3b82f6'; }}
        >
          Cho phép
        </button>
      </div>
    </div>
  );
}

// ===== RESPONSE NOTIFICATION (for students) =====
export function ResponseNotification({ type, approved, onClose }: {
  type: 'leave' | 'share';
  approved: boolean;
  onClose: () => void;
}) {
  const isLeave = type === 'leave';
  const title = isLeave
    ? (approved ? 'Được phép rời phòng' : 'Yêu cầu bị từ chối')
    : (approved ? 'Được phép chia sẻ màn hình' : 'Yêu cầu bị từ chối');
  const message = isLeave
    ? (approved ? 'Giáo viên đã cho phép bạn rời phòng.' : 'Giáo viên chưa cho phép bạn rời phòng.')
    : (approved ? 'Giáo viên đã cho phép bạn chia sẻ màn hình.' : 'Giáo viên chưa cho phép bạn chia sẻ màn hình.');
  const bgColor = approved ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)';
  const borderColor = approved ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)';
  const iconColor = approved ? '#10b981' : '#ef4444';

  // Auto-close after 4 seconds
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div style={{
      position: 'fixed',
      bottom: '100px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 200,
      background: '#1a1a1a',
      borderRadius: '12px',
      padding: '1rem 1.5rem',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      border: `1px solid ${borderColor}`,
      maxWidth: '360px',
      animation: 'slideUp 0.3s ease-out',
    }}>
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(20px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: '8px',
          background: bgColor, display: 'flex',
          alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          {approved ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          )}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.75rem', color: iconColor, fontWeight: 600, marginBottom: '0.25rem' }}>
            {title}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)', lineHeight: 1.4 }}>{message}</div>
        </div>
        <button onClick={onClose} style={{
          background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)',
          cursor: 'pointer', padding: '0.2rem',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

// ===== SEND NOTE PANEL (for host) =====
export function SendNotePanel({ onSend, onClose }: { onSend: (content: string) => void; onClose: () => void }) {
  const [note, setNote] = useState('');

  const handleSend = () => {
    if (!note.trim()) return;
    onSend(note);
    setNote('');
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      zIndex: 300,
      background: '#1a1a1a',
      borderRadius: '16px',
      padding: '1.25rem',
      boxShadow: '0 16px 64px rgba(0,0,0,0.6)',
      border: '1px solid rgba(255,255,255,0.1)',
      width: '360px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff' }}>Gửi ghi chú</span>
        <button onClick={onClose} style={{
          background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)',
          cursor: 'pointer', padding: '0.2rem',
        }}>
          ✕
        </button>
      </div>
      <textarea
        value={note}
        onChange={e => setNote(e.target.value)}
        placeholder="Nhập ghi chú gửi cho học sinh..."
        autoFocus
        style={{
          width: '100%',
          background: '#0a0a0a',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: '8px',
          padding: '0.75rem',
          color: '#fff',
          fontSize: '0.85rem',
          resize: 'vertical',
          minHeight: '100px',
          fontFamily: 'inherit',
        }}
      />
      <button
        onClick={handleSend}
        disabled={!note.trim()}
        style={{
          width: '100%',
          marginTop: '0.75rem',
          background: note.trim() ? '#10b981' : '#4b5563',
          border: 'none',
          borderRadius: '8px',
          padding: '0.6rem',
          color: '#fff',
          fontSize: '0.85rem',
          fontWeight: 600,
          cursor: note.trim() ? 'pointer' : 'not-allowed',
        }}
      >
        Gửi ghi chú
      </button>
    </div>
  );
}
