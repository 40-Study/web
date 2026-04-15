"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  MessageCircle,
  Send,
  X,
  Paperclip,
  Mic,
  MicOff,
  Square,
  Maximize2,
  Sparkles,
  Bot,
  Loader2,
  FileText,
  ImageIcon,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/* ───────────────────────────── Types ──────────────────────────── */

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

/* ───────────────────────── Initial State ─────────────────────── */

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "ai",
  content:
    "Xin chào! Mình là trợ lý AI của 40Study. Bạn có thể hỏi mình bất kỳ điều gì về lộ trình học, kiến thức kỹ thuật, hoặc bài tập nhé!",
  timestamp: new Date(),
};

const SUGGESTIONS = [
  "Giải thích khái niệm OOP",
  "Gợi ý lộ trình học React",
  "Hướng dẫn giải bài tập",
];

/* ─────────────────────── Typing Indicator ────────────────────── */

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-3 py-2">
      <div className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-bounce [animation-delay:0ms]" />
      <div className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-bounce [animation-delay:150ms]" />
      <div className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-bounce [animation-delay:300ms]" />
    </div>
  );
}

/* ─────────────────── Attachment Preview Chip ─────────────────── */

function AttachmentChip({
  attachment,
  onRemove,
}: {
  attachment: ChatAttachment;
  onRemove?: () => void;
}) {
  return (
    <div className="relative group flex items-center gap-1.5 bg-primary-50 border border-primary-100 rounded-lg px-2 py-1.5 text-xs text-gray-600">
      {attachment.type === "image" && attachment.preview ? (
        <img
          src={attachment.preview}
          alt=""
          className="w-8 h-8 rounded object-cover"
        />
      ) : (
        <FileText className="w-4 h-4 text-primary-400 shrink-0" />
      )}
      <span className="truncate max-w-[100px]">{attachment.file.name}</span>
      {onRemove && (
        <button
          onClick={onRemove}
          className="ml-0.5 text-gray-400 hover:text-red-500 transition-colors"
        >
          <XCircle className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

/* ──────────────────────── Message Bubble ─────────────────────── */

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";
  return (
    <div className={cn("flex gap-2.5", isUser ? "justify-end" : "justify-start")}>
      {/* AI avatar */}
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shrink-0 mt-0.5">
          <Sparkles className="w-3.5 h-3.5 text-white" />
        </div>
      )}

      <div className={cn("max-w-[80%] space-y-1.5")}>
        {/* Attachments */}
        {msg.attachments && msg.attachments.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {msg.attachments.map((att) => (
              <AttachmentChip key={att.id} attachment={att} />
            ))}
          </div>
        )}

        {/* Text */}
        {msg.content && (
          <div
            className={cn(
              "px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed whitespace-pre-wrap",
              isUser
                ? "bg-primary-600 text-white rounded-br-md"
                : "bg-gray-100 text-gray-800 rounded-bl-md"
            )}
          >
            {msg.content}
          </div>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════════════════════════ */

export function MentorChatWidget() {
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }, [input]);

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
          {
            id: `voice-${Date.now()}`,
            file: audioFile,
            type: "document",
          },
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
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setAttachments([]);
    setIsTyping(true);

    if (textareaRef.current) textareaRef.current.style.height = "auto";

    // TODO: Replace with real AI API call
    setTimeout(() => {
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: "ai",
        content:
          "Cảm ơn bạn đã gửi câu hỏi! Đây là phiên bản demo — khi tích hợp AI, mình sẽ trả lời chi tiết hơn nhé.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1200);
  }, [input, attachments]);

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

  return (
    <>
      {/* ─── Sidebar Card ─── */}
      <div className="bg-gradient-to-br from-primary-50 to-white rounded-2xl p-5 shadow-sm relative overflow-hidden border border-primary-100">
        {/* Decorative */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-100/60 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
        <div className="absolute bottom-0 left-0 w-20 h-20 bg-primary-200/40 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary-500">
              AI Assistant
            </span>
          </div>

          <p className="text-sm font-semibold text-gray-900 mb-1">Trợ lý AI thông minh</p>
          <p className="text-xs text-gray-500 mb-4">
            Hỏi đáp, giải bài tập, gợi ý lộ trình học
          </p>

          <button
            onClick={() => setChatOpen(true)}
            className="block w-full py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 transition-colors text-center shadow-sm"
          >
            Bắt đầu chat
          </button>
        </div>
      </div>

      {/* ─── Hidden file input ─── */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.pdf,.doc,.docx,.txt,.csv,.xlsx"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* ─── Chat Popup ─── */}
      {chatOpen && (
        <div
          className="fixed bottom-4 right-4 z-50 w-[420px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-in fade-in-0 slide-in-from-bottom-4 duration-200"
          style={{ height: "min(640px, 85vh)" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary-600 to-primary-500 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="text-sm font-semibold text-white">40Study AI</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-300" />
                  <span className="text-[10px] text-white/70">Online</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Link
                href="/ai-chat"
                className="p-1.5 rounded-lg hover:bg-white/15 transition-colors text-white/70 hover:text-white"
                title="Mở rộng"
              >
                <Maximize2 className="w-4 h-4" />
              </Link>
              <button
                onClick={() => setChatOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/15 transition-colors text-white/70 hover:text-white"
                aria-label="Đóng chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} msg={msg} />
            ))}
            {isTyping && (
              <div className="flex gap-2.5">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="bg-gray-100 rounded-2xl rounded-bl-md">
                  <TypingIndicator />
                </div>
              </div>
            )}

            {/* Suggestion chips */}
            {messages.length === 1 && !isTyping && (
              <div className="flex flex-wrap gap-2 pt-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSuggestionClick(s)}
                    className="px-3 py-1.5 text-xs text-primary-600 bg-primary-50 border border-primary-100 rounded-full hover:bg-primary-100 hover:text-primary-700 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Attachment previews */}
          {attachments.length > 0 && (
            <div className="px-3 pt-2 pb-1 border-t border-gray-100 bg-white flex flex-wrap gap-1.5">
              {attachments.map((att) => (
                <AttachmentChip
                  key={att.id}
                  attachment={att}
                  onRemove={() => removeAttachment(att.id)}
                />
              ))}
            </div>
          )}

          {/* Input area */}
          <div className="border-t border-gray-100 px-3 py-2.5 bg-white shrink-0">
            {/* Recording indicator */}
            {isRecording && (
              <div className="flex items-center gap-2 mb-2 px-1">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs text-red-500 font-medium">
                  Đang ghi âm {formatTime(recordingTime)}
                </span>
                <button
                  onClick={stopRecording}
                  className="ml-auto p-1 rounded bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                >
                  <Square className="w-3 h-3" />
                </button>
              </div>
            )}

            <div className="flex items-end gap-2">
              {/* Attachment button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors shrink-0"
                title="Đính kèm file"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              {/* Voice button */}
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={cn(
                  "p-2 rounded-lg transition-colors shrink-0",
                  isRecording
                    ? "text-red-500 bg-red-50 hover:bg-red-100"
                    : "text-gray-400 hover:text-primary-600 hover:bg-primary-50"
                )}
                title={isRecording ? "Dừng ghi âm" : "Ghi âm giọng nói"}
              >
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
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
                placeholder="Hỏi AI bất cứ điều gì..."
                rows={1}
                className="flex-1 text-sm px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 resize-none max-h-[120px]"
              />

              {/* Send button */}
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
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>

            <p className="text-[10px] text-gray-400 text-center mt-2">
              AI có thể mắc sai sót. Hãy kiểm tra lại thông tin quan trọng.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
