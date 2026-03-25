'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { api } from '@/lib/meet/api';
import { getMe } from '@/lib/meet/auth';

interface ChatMessage {
  id: string;
  session_id: string;
  user_id: string;
  user_name?: string;
  message: string;
  is_pinned: boolean;
  created_at: string;
}

// Modern color palette
const COLORS = {
  bg: '#0e0e0e',
  surface: '#1a1a1a',
  surfaceHigh: '#262626',
  primary: '#ff8e80',
  primaryDim: '#ff7162',
  text: '#ffffff',
  textMuted: '#adaaaa',
  textDim: '#767575',
  border: '#484847',
  borderDim: 'rgba(72,72,71,0.3)',
};

interface ChatTabProps {
  sessionId: string;
  onClose?: () => void;
  broadcast?: (event: any) => void;
  onChatMessage?: (handler: (msg: ChatMessage) => void) => void;
}

export default function ChatTab({ sessionId, onClose, broadcast, onChatMessage }: ChatTabProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [userId, setUserId] = useState('');
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getMe().then((u) => {
      setUserId(u.id);
      setUserName(u.username || u.email?.split('@')[0] || 'User');
    }).catch(() => {});
  }, []);

  // Fetch initial messages once
  const fetchMessages = useCallback(async () => {
    try {
      const res = await api.get<{ data: ChatMessage[] }>(`/chat/${sessionId}/messages`);
      const sorted = (res.data ?? []).slice().sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      setMessages(sorted);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  // Load initial messages once (no polling)
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Listen for real-time chat messages via LiveKit
  useEffect(() => {
    if (!onChatMessage) return;

    const handleIncomingMessage = (msg: ChatMessage) => {
      setMessages(prev => {
        // Avoid duplicates
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    };

    onChatMessage(handleIncomingMessage);
  }, [onChatMessage]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending || !userId) return;
    setSending(true);

    const messageText = input.trim();
    const tempId = `temp-${Date.now()}`;
    const now = new Date().toISOString();

    // Optimistic update - add message immediately
    const optimisticMsg: ChatMessage = {
      id: tempId,
      session_id: sessionId,
      user_id: userId,
      user_name: userName,
      message: messageText,
      is_pinned: false,
      created_at: now,
    };
    setMessages(prev => [...prev, optimisticMsg]);
    setInput('');

    try {
      // Save to backend
      const res = await api.post<{ data: ChatMessage }>(`/chat/send`, {
        session_id: sessionId,
        user_id: userId,
        message: messageText,
      });

      const savedMsg = res.data || { ...optimisticMsg, id: `saved-${Date.now()}` };

      // Replace optimistic message with saved one
      setMessages(prev => prev.map(m => m.id === tempId ? savedMsg : m));

      // Broadcast via LiveKit for real-time sync
      if (broadcast) {
        broadcast({
          type: 'chat_message',
          message: savedMsg,
        });
      }
    } catch (err: any) {
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== tempId));
      alert(err.message ?? 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  // Generate consistent color from user id
  const getAvatarColor = (id: string) => {
    const colors = ['#ff8e80', '#f7a01e', '#e5a7ff', '#4ecdc4', '#45b7d1', '#96ceb4'];
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: COLORS.bg,
      fontFamily: "var(--font-plus-jakarta), 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: `1px solid ${COLORS.borderDim}`,
        background: `linear-gradient(135deg, ${COLORS.surface} 0%, #1f1f1f 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDim} 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(255,142,128,0.3)',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <div>
            <h3 style={{
              margin: 0,
              fontSize: '15px',
              fontWeight: 700,
              color: COLORS.text,
              letterSpacing: '-0.02em',
            }}>
              Trò chuyện
            </h3>
            <span style={{ fontSize: '11px', color: COLORS.textMuted, fontWeight: 500 }}>
              {messages.length} tin nhắn
            </span>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: 'none',
              color: COLORS.textMuted,
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
              e.currentTarget.style.color = COLORS.text;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
              e.currentTarget.style.color = COLORS.textMuted;
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        )}
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px 20px',
      }}>
        {loading ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            gap: '12px',
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              border: `2px solid ${COLORS.borderDim}`,
              borderTopColor: COLORS.primary,
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }} />
            <span style={{ fontSize: '12px', color: COLORS.textMuted }}>Đang tải...</span>
          </div>
        ) : messages.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            gap: '16px',
          }}>
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '20px',
              background: `linear-gradient(135deg, ${COLORS.surface} 0%, #222 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `1px solid ${COLORS.borderDim}`,
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={COLORS.primary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                <circle cx="9" cy="10" r="1" fill={COLORS.primary}/>
                <circle cx="12" cy="10" r="1" fill={COLORS.primary}/>
                <circle cx="15" cy="10" r="1" fill={COLORS.primary}/>
              </svg>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '15px', fontWeight: 700, color: COLORS.text, marginBottom: '6px', letterSpacing: '-0.02em' }}>
                Bắt đầu trò chuyện
              </div>
              <div style={{ fontSize: '13px', color: COLORS.textMuted, fontWeight: 500 }}>
                Gửi tin nhắn đầu tiên
              </div>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, idx) => {
              const isMe = msg.user_id === userId;
              const showAvatar = !isMe && (idx === 0 || messages[idx - 1].user_id !== msg.user_id);
              const showTime = idx === messages.length - 1 || messages[idx + 1]?.user_id !== msg.user_id;
              const displayName = msg.user_name || msg.user_id.slice(0, 8);

              return (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    flexDirection: isMe ? 'row-reverse' : 'row',
                    alignItems: 'flex-end',
                    gap: '10px',
                    marginBottom: showTime ? '16px' : '4px',
                  }}
                >
                  {/* Avatar */}
                  {!isMe && (
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '10px',
                      background: showAvatar ? `linear-gradient(135deg, ${getAvatarColor(msg.user_id)} 0%, ${getAvatarColor(msg.user_id)}dd 100%)` : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 700,
                      color: showAvatar ? '#fff' : 'transparent',
                      flexShrink: 0,
                      boxShadow: showAvatar ? `0 2px 8px ${getAvatarColor(msg.user_id)}40` : 'none',
                    }}>
                      {showAvatar && getInitials(displayName)}
                    </div>
                  )}

                  {/* Message bubble */}
                  <div style={{ maxWidth: '78%' }}>
                    {showAvatar && (
                      <div style={{
                        fontSize: '11px',
                        color: COLORS.textMuted,
                        marginBottom: '6px',
                        marginLeft: '4px',
                        fontWeight: 600,
                        letterSpacing: '-0.01em',
                      }}>
                        {displayName}
                      </div>
                    )}
                    <div style={{
                      background: isMe
                        ? `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDim} 100%)`
                        : COLORS.surfaceHigh,
                      borderRadius: isMe ? '18px 18px 6px 18px' : '18px 18px 18px 6px',
                      padding: '12px 16px',
                      border: isMe ? 'none' : `1px solid ${COLORS.borderDim}`,
                      boxShadow: isMe ? '0 2px 8px rgba(255,142,128,0.2)' : 'none',
                    }}>
                      <p style={{
                        margin: 0,
                        fontSize: '14px',
                        color: isMe ? '#000' : COLORS.text,
                        lineHeight: 1.5,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        fontWeight: 500,
                      }}>
                        {msg.message}
                      </p>
                    </div>
                    {showTime && (
                      <div style={{
                        fontSize: '10px',
                        color: COLORS.textDim,
                        marginTop: '6px',
                        textAlign: isMe ? 'right' : 'left',
                        marginLeft: isMe ? 0 : '4px',
                        marginRight: isMe ? '4px' : 0,
                        fontWeight: 500,
                      }}>
                        {formatTime(msg.created_at)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={handleSend}
        style={{
          padding: '16px 20px',
          background: `linear-gradient(180deg, ${COLORS.surface} 0%, #1f1f1f 100%)`,
          borderTop: `1px solid ${COLORS.borderDim}`,
        }}
      >
        <div style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-end',
        }}>
          <div style={{
            flex: 1,
            position: 'relative',
          }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Nhập tin nhắn..."
              style={{
                width: '100%',
                background: COLORS.bg,
                border: `2px solid ${COLORS.borderDim}`,
                borderRadius: '14px',
                padding: '14px 18px',
                paddingRight: '48px',
                color: COLORS.text,
                fontSize: '14px',
                fontWeight: 500,
                outline: 'none',
                transition: 'all 0.2s',
                fontFamily: 'inherit',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = COLORS.primary;
                e.currentTarget.style.boxShadow = `0 0 0 3px rgba(255,142,128,0.15)`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = COLORS.borderDim;
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
            {/* Emoji hint */}
            <div style={{
              position: 'absolute',
              right: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: COLORS.textDim,
              fontSize: '18px',
              opacity: input ? 0 : 0.5,
              transition: 'opacity 0.2s',
              pointerEvents: 'none',
            }}>
              💬
            </div>
          </div>
          <button
            type="submit"
            disabled={sending || !input.trim() || !userId}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              border: 'none',
              background: sending || !input.trim() || !userId
                ? COLORS.surfaceHigh
                : `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDim} 100%)`,
              color: sending || !input.trim() || !userId ? COLORS.textDim : '#000',
              cursor: sending || !input.trim() ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'all 0.2s',
              boxShadow: sending || !input.trim() || !userId
                ? 'none'
                : '0 4px 12px rgba(255,142,128,0.3)',
            }}
          >
            {sending ? (
              <div style={{
                width: '18px',
                height: '18px',
                border: '2px solid rgba(0,0,0,0.2)',
                borderTopColor: '#000',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }} />
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            )}
          </button>
        </div>
      </form>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
