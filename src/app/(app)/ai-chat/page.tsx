"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send,
  Paperclip,
  Mic,
  MicOff,
  Square,
  Sparkles,
  Bot,
  Loader2,
  Plus,
  MessageSquare,
  Trash2,
  FileText,
  XCircle,
  ArrowLeft,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/* ═══════════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════════ */

interface ChatAttachment {
  id: string;
  file: File;
  preview?: string;
  type: "image" | "document";
}

interface ChatMessage {
  id: string;
  role: "user" | "ai";
  content: string;
  timestamp: Date;
  attachments?: ChatAttachment[];
}

interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
}

/* ═══════════════════════════════════════════════════════════════
   Constants
   ═══════════════════════════════════════════════════════════════ */

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "ai",
  content:
    "Xin chào! Mình là trợ lý AI của **40Study**. Mình có thể giúp bạn:\n\n• **Giải thích khái niệm** — bất kỳ chủ đề kỹ thuật nào\n• **Hướng dẫn bài tập** — phân tích đề, gợi ý lời giải\n• **Gợi ý lộ trình học** — phù hợp với mục tiêu của bạn\n• **Review code** — tìm lỗi, tối ưu hóa\n\nBạn muốn bắt đầu với gì?",
  timestamp: new Date(),
};

const SUGGESTIONS = [
  { text: "Giải thích khái niệm OOP trong Java", icon: "💡" },
  { text: "Gợi ý lộ trình học fullstack 6 tháng", icon: "🗺️" },
  { text: "Hướng dẫn giải bài tập cấu trúc dữ liệu", icon: "📝" },
  { text: "So sánh React vs Vue vs Angular", icon: "⚡" },
];

/* ═══════════════════════════════════════════════════════════════
   Sub-components
   ═══════════════════════════════════════════════════════════════ */

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-1 py-1">
      <div className="w-2 h-2 rounded-full bg-primary-400 animate-bounce [animation-delay:0ms]" />
      <div className="w-2 h-2 rounded-full bg-primary-400 animate-bounce [animation-delay:150ms]" />
      <div className="w-2 h-2 rounded-full bg-primary-400 animate-bounce [animation-delay:300ms]" />
    </div>
  );
}

function AttachmentChip({
  attachment,
  onRemove,
}: {
  attachment: ChatAttachment;
  onRemove?: () => void;
}) {
  return (
    <div className="relative group flex items-center gap-2 bg-primary-50 border border-primary-100 rounded-xl px-3 py-2 text-xs text-gray-600">
      {attachment.type === "image" && attachment.preview ? (
        <img src={attachment.preview} alt="" className="w-10 h-10 rounded-lg object-cover" />
      ) : (
        <FileText className="w-5 h-5 text-primary-400 shrink-0" />
      )}
      <span className="truncate max-w-[140px]">{attachment.file.name}</span>
      {onRemove && (
        <button
          onClick={onRemove}
          className="ml-1 text-gray-400 hover:text-red-500 transition-colors"
        >
          <XCircle className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

/** Render markdown-like bold text */
function RichText({ content }: { content: string }) {
  const parts = content.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={i} className="font-semibold text-gray-900">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";

  return (
    <div className={cn("flex gap-3 max-w-3xl mx-auto w-full", isUser && "flex-row-reverse")}>
      {/* Avatar */}
      <div
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1",
          isUser
            ? "bg-primary-600"
            : "bg-gradient-to-br from-primary-400 to-primary-600"
        )}
      >
        {isUser ? (
          <span className="text-white text-xs font-bold">U</span>
        ) : (
          <Sparkles className="w-4 h-4 text-white" />
        )}
      </div>

      <div className="flex-1 min-w-0 space-y-2">
        {/* Name */}
        <span className={cn("text-xs font-medium", isUser ? "text-primary-600" : "text-primary-500")}>
          {isUser ? "Bạn" : "40Study AI"}
        </span>

        {/* Attachments */}
        {msg.attachments && msg.attachments.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {msg.attachments.map((att) => (
              <AttachmentChip key={att.id} attachment={att} />
            ))}
          </div>
        )}

        {/* Content */}
        {msg.content && (
          <div
            className={cn(
              "text-[14px] leading-relaxed whitespace-pre-wrap",
              isUser ? "text-gray-800" : "text-gray-600"
            )}
          >
            <RichText content={msg.content} />
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Main Page Component
   ═══════════════════════════════════════════════════════════════ */

export default function AIChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: "default",
      title: "Cuộc trò chuyện mới",
      messages: [WELCOME_MESSAGE],
      createdAt: new Date(),
    },
  ]);
  const [activeConvId, setActiveConvId] = useState("default");
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [suggestionsShown, setSuggestionsShown] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const activeConv = conversations.find((c) => c.id === activeConvId)!;
  const messages = activeConv.messages;

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  }, [input]);

  /* ─── Conversation management ─── */
  const createNewConversation = useCallback(() => {
    const newConv: Conversation = {
      id: `conv-${Date.now()}`,
      title: "Cuộc trò chuyện mới",
      messages: [WELCOME_MESSAGE],
      createdAt: new Date(),
    };
    setConversations((prev) => [newConv, ...prev]);
    setActiveConvId(newConv.id);
    setInput("");
    setAttachments([]);
  }, []);

  const deleteConversation = useCallback(
    (id: string) => {
      setConversations((prev) => {
        const filtered = prev.filter((c) => c.id !== id);
        if (filtered.length === 0) {
          const fresh: Conversation = {
            id: `conv-${Date.now()}`,
            title: "Cuộc trò chuyện mới",
            messages: [WELCOME_MESSAGE],
            createdAt: new Date(),
          };
          setActiveConvId(fresh.id);
          return [fresh];
        }
        if (activeConvId === id) {
          setActiveConvId(filtered[0].id);
        }
        return filtered;
      });
    },
    [activeConvId]
  );

  /* ─── File Upload ─── */
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newAttachments: ChatAttachment[] = files.map((file) => {
      const isImage = file.type.startsWith("image/");
      const att: ChatAttachment = {
        id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        file,
        type: isImage ? "image" : "document",
      };
      if (isImage) {
        const reader = new FileReader();
        reader.onload = () => {
          setAttachments((prev) =>
            prev.map((a) => (a.id === att.id ? { ...a, preview: reader.result as string } : a))
          );
        };
        reader.readAsDataURL(file);
      }
      return att;
    });
    setAttachments((prev) => [...prev, ...newAttachments]);
    e.target.value = "";
  }, []);

  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  }, []);

  /* ─── Voice Recording ─── */
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const audioFile = new File([audioBlob], `voice-${Date.now()}.webm`, {
          type: "audio/webm",
        });
        setAttachments((prev) => [
          ...prev,
          { id: `voice-${Date.now()}`, file: audioFile, type: "document" },
        ]);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((t) => t + 1);
      }, 1000);
    } catch {
      // Mic permission denied
    }
  }, []);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  }, []);

  /* ─── Send Message ─── */
  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text && attachments.length === 0) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date(),
      attachments: attachments.length > 0 ? [...attachments] : undefined,
    };

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== activeConvId) return c;
        const updated = { ...c, messages: [...c.messages, userMsg] };
        if (c.title === "Cuộc trò chuyện mới" && text) {
          updated.title = text.length > 40 ? text.slice(0, 40) + "..." : text;
        }
        return updated;
      })
    );
    setInput("");
    setAttachments([]);
    setIsTyping(true);
    setSuggestionsShown(true);
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    // TODO: Replace with real AI API call
    setTimeout(() => {
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: "ai",
        content:
          "Cảm ơn bạn đã gửi câu hỏi! Đây là phiên bản demo — khi tích hợp AI service qua gRPC, mình sẽ trả lời chi tiết và chính xác hơn nhé.",
        timestamp: new Date(),
      };
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConvId ? { ...c, messages: [...c.messages, aiMsg] } : c
        )
      );
      setIsTyping(false);
    }, 1500);
  }, [input, attachments, activeConvId]);

  const handleSuggestionClick = useCallback((text: string) => {
    setInput(text);
    textareaRef.current?.focus();
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const hasContent = input.trim().length > 0 || attachments.length > 0;
  const showSuggestions = !suggestionsShown && messages.length <= 1;

  return (
    <div className="fixed inset-0 top-16 lg:left-20 left-0 flex bg-white z-30 overflow-hidden">
      {/* ─── Sidebar ─── */}
      <div
        className={cn(
          "bg-gray-50 border-r border-gray-200 flex flex-col shrink-0 transition-all duration-300",
          sidebarOpen ? "w-64" : "w-0 overflow-hidden"
        )}
      >
        {/* Sidebar header */}
        <div className="p-3 border-b border-gray-200">
          <button
            onClick={createNewConversation}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white border border-gray-200 text-sm text-gray-700 hover:bg-primary-50 hover:border-primary-200 hover:text-primary-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Cuộc trò chuyện mới</span>
          </button>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className={cn(
                "group flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-colors",
                conv.id === activeConvId
                  ? "bg-primary-50 text-primary-700 border border-primary-100"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              )}
              onClick={() => setActiveConvId(conv.id)}
            >
              <MessageSquare className="w-4 h-4 shrink-0" />
              <span className="text-sm truncate flex-1">{conv.title}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteConversation(conv.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-200 transition-all text-gray-400 hover:text-red-500"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Sidebar footer */}
        <div className="p-3 border-t border-gray-200">
          <Link
            href="/home"
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-500 hover:text-primary-600 hover:bg-primary-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Về trang chủ</span>
          </Link>
        </div>
      </div>

      {/* ─── Main Chat Area ─── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white shrink-0">
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
          >
            {sidebarOpen ? (
              <PanelLeftClose className="w-5 h-5" />
            ) : (
              <PanelLeft className="w-5 h-5" />
            )}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-900">40Study AI</span>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-[10px] text-gray-400">Online</span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto bg-gray-50/30">
          <div className="py-6 px-4 space-y-6">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} msg={msg} />
            ))}

            {isTyping && (
              <div className="flex gap-3 max-w-3xl mx-auto w-full">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-2">
                  <TypingIndicator />
                </div>
              </div>
            )}

            {/* Suggestions — only on first load, disappears forever after first send */}
            {showSuggestions && !isTyping && (
              <div className="max-w-3xl mx-auto w-full pt-4">
                <div className="grid grid-cols-2 gap-3">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s.text}
                      onClick={() => handleSuggestionClick(s.text)}
                      className="flex items-start gap-3 px-4 py-3.5 text-left text-sm text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-primary-50 hover:border-primary-200 hover:text-primary-700 transition-all shadow-sm"
                    >
                      <span className="text-lg">{s.icon}</span>
                      <span className="leading-snug">{s.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* ─── Input Area ─── */}
        <div className="shrink-0 border-t border-gray-100 bg-white px-4 pb-4 pt-3">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx,.txt,.csv,.xlsx"
            className="hidden"
            onChange={handleFileSelect}
          />

          {/* Attachment previews */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3 max-w-3xl mx-auto">
              {attachments.map((att) => (
                <AttachmentChip
                  key={att.id}
                  attachment={att}
                  onRemove={() => removeAttachment(att.id)}
                />
              ))}
            </div>
          )}

          {/* Recording indicator */}
          {isRecording && (
            <div className="flex items-center gap-2 mb-3 max-w-3xl mx-auto">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-sm text-red-500 font-medium">
                Đang ghi âm {formatTime(recordingTime)}
              </span>
              <button
                onClick={stopRecording}
                className="ml-2 px-2 py-1 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors text-xs"
              >
                <Square className="w-3 h-3 inline mr-1" />
                Dừng
              </button>
            </div>
          )}

          {/* Input box */}
          <div className="max-w-3xl mx-auto">
            <div className="flex items-end gap-2 bg-white border border-gray-200 rounded-2xl px-3 py-2 focus-within:border-primary-400 focus-within:ring-2 focus-within:ring-primary-500/20 transition-all shadow-sm">
              {/* Attachment */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-xl text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors shrink-0"
                title="Đính kèm file"
              >
                <Paperclip className="w-5 h-5" />
              </button>

              {/* Textarea */}
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Nhắn tin cho 40Study AI..."
                rows={1}
                className="flex-1 text-sm py-2 bg-transparent text-gray-900 placeholder:text-gray-400 focus:outline-none resize-none max-h-[200px]"
              />

              {/* Voice */}
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={cn(
                  "p-2 rounded-xl transition-colors shrink-0",
                  isRecording
                    ? "text-red-500 bg-red-50 hover:bg-red-100"
                    : "text-gray-400 hover:text-primary-600 hover:bg-primary-50"
                )}
                title={isRecording ? "Dừng ghi âm" : "Ghi âm giọng nói"}
              >
                {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              {/* Send */}
              <button
                onClick={handleSend}
                disabled={!hasContent || isTyping}
                className={cn(
                  "p-2 rounded-xl transition-all shrink-0",
                  hasContent && !isTyping
                    ? "bg-primary-600 text-white hover:bg-primary-700 shadow-sm"
                    : "bg-gray-100 text-gray-300 cursor-not-allowed"
                )}
                aria-label="Gửi tin nhắn"
              >
                {isTyping ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>

            <p className="text-[11px] text-gray-400 text-center mt-2.5">
              AI có thể mắc sai sót. Hãy kiểm tra lại thông tin quan trọng.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
