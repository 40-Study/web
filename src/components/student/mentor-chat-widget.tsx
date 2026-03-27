"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  role: "user" | "mentor";
  content: string;
  timestamp: Date;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "welcome",
    role: "mentor",
    content: "Xin chào! Mình là mentor hỗ trợ kỹ thuật. Bạn cần giúp gì về lộ trình học hoặc vấn đề kỹ thuật?",
    timestamp: new Date(),
  },
];

/** Sidebar widget with inline chat popup for mentor Q&A */
export function MentorChatWidget() {
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    // Simulated mentor auto-reply
    setTimeout(() => {
      const mentorMsg: ChatMessage = {
        id: `mentor-${Date.now()}`,
        role: "mentor",
        content: "Cảm ơn bạn đã gửi câu hỏi! Mentor sẽ phản hồi sớm nhất có thể.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, mentorMsg]);
    }, 800);
  };

  return (
    <>
      {/* Card widget */}
      <div className="bg-black rounded-2xl p-5 text-white shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <MessageCircle className="w-4 h-4 text-white/80" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/80">
              Cần hỗ trợ?
            </span>
          </div>

          <p className="text-sm font-semibold mb-1">Hỏi đáp trực tiếp với mentor</p>
          <p className="text-xs text-white/70 mb-4">
            về lộ trình học và các vấn đề kỹ thuật
          </p>

          <button
            onClick={() => setChatOpen(true)}
            className="block w-full py-2.5 bg-white text-black text-sm font-semibold rounded-xl hover:bg-white/90 transition-colors text-center"
          >
            Bắt đầu chat
          </button>
        </div>
      </div>

      {/* Chat popup */}
      {chatOpen && (
        <div className="fixed bottom-4 right-4 z-50 w-[420px] bg-white rounded-2xl shadow-2xl border flex flex-col overflow-hidden animate-in fade-in-0 slide-in-from-bottom-4 duration-200"
          style={{ height: "min(600px, 80vh)" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-black text-white shrink-0">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              <span className="text-sm font-semibold">Hỗ trợ kỹ thuật</span>
            </div>
            <button
              onClick={() => setChatOpen(false)}
              className="p-1 rounded-full hover:bg-white/20 transition-colors"
              aria-label="Đóng chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex",
                  msg.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[80%] px-3 py-2 rounded-xl text-sm",
                    msg.role === "user"
                      ? "bg-primary-600 text-white rounded-br-sm"
                      : "bg-gray-100 text-gray-800 rounded-bl-sm"
                  )}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t px-3 py-2 flex items-center gap-2 shrink-0">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder="Nhập câu hỏi..."
              className="flex-1 text-sm px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="p-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Gửi tin nhắn"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
