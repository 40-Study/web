"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { X, Send, Sparkles, Loader2, User, Paperclip, Mic } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
  timestamp: Date;
}

interface AIAssistantPanelProps {
  isOpen: boolean;
  onClose: () => void;
  lessonContext?: {
    title: string;
    courseTitle: string;
    type: "video" | "quiz" | "exercise";
  };
}

const QUICK_PROMPTS = [
  "Giải thích bài học này ngắn gọn",
  "Cho mình 3 bước để làm bài tập",
  "Giải thích code trong bài này",
  "Tóm tắt những điểm quan trọng",
];

export function AIAssistantPanel({ isOpen, onClose, lessonContext }: AIAssistantPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Generate initial greeting based on lesson context
  useEffect(() => {
    if (isOpen && messages.length === 0 && lessonContext) {
      const greeting: Message = {
        id: "greeting",
        role: "ai",
        content: `Chào bạn! Mình thấy bạn đang học về **${lessonContext.title}**. Bạn có thắc mắc gì về bài học này không?`,
        timestamp: new Date(),
      };
      setMessages([greeting]);
    }
  }, [isOpen, lessonContext, messages.length]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Simulate AI response (replace with actual API call)
    setTimeout(() => {
      const aiResponse: Message = {
        id: `ai-${Date.now()}`,
        role: "ai",
        content: generateMockResponse(userMessage.content, lessonContext),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1000 + Math.random() * 1000);
  }, [input, isLoading, lessonContext]);

  const handleQuickPrompt = (prompt: string) => {
    setInput(prompt);
    setTimeout(() => handleSend(), 100);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/20 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Slide Panel */}
      <div
        className={cn(
          "fixed top-0 right-0 z-50 h-full w-full sm:w-[400px] bg-white shadow-2xl transition-transform duration-300 ease-out flex flex-col",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">AI Assistant</h2>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs text-gray-500">San sang ho tro</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Dong"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex gap-2.5",
                msg.role === "user" ? "flex-row-reverse" : "flex-row"
              )}
            >
              {/* Avatar */}
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                  msg.role === "user"
                    ? "bg-gray-100"
                    : "bg-gradient-to-br from-blue-500 to-blue-600"
                )}
              >
                {msg.role === "user" ? (
                  <User className="w-4 h-4 text-gray-600" />
                ) : (
                  <Sparkles className="w-4 h-4 text-white" />
                )}
              </div>

              {/* Message Bubble */}
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm",
                  msg.role === "user"
                    ? "bg-blue-600 text-white rounded-br-md"
                    : "bg-gray-100 text-gray-800 rounded-bl-md"
                )}
              >
                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}

          {/* Quick prompts - show when no messages or few messages */}
          {messages.length <= 1 && !isLoading && (
            <div className="space-y-2 pt-2">
              <p className="text-xs text-gray-400 font-medium">Goi y nhanh:</p>
              <div className="flex flex-wrap gap-2">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleQuickPrompt(prompt)}
                    className="px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-full hover:border-blue-300 hover:bg-blue-50 transition-colors text-gray-600 hover:text-blue-600"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2 bg-white rounded-xl border border-gray-200 px-3 py-2 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
            <button className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
              <Paperclip className="w-4 h-4" />
            </button>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Dat cau hoi cho AI..."
              className="flex-1 text-sm bg-transparent outline-none placeholder:text-gray-400"
              disabled={isLoading}
            />
            <button className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
              <Mic className="w-4 h-4" />
            </button>
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className={cn(
                "p-2 rounded-lg transition-all",
                input.trim() && !isLoading
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-gray-100 text-gray-400"
              )}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
          <p className="text-[10px] text-gray-400 text-center mt-2">
            AI co the dua ra cau tra loi khong chinh xac. Hay kiem tra lai thong tin quan trong.
          </p>
        </div>
      </div>
    </>
  );
}

// Mock response generator (replace with actual AI API)
function generateMockResponse(question: string, context?: { title: string; courseTitle: string }) {
  const responses: Record<string, string> = {
    "Giải thích bài học này ngắn gọn": `Bai hoc "${context?.title || "hien tai"}" tap trung vao viec giup ban hieu cac khai niem co ban va cach ap dung chung trong thuc te. Day la mot phan quan trong trong khoa hoc ${context?.courseTitle || ""}.`,
    "Cho mình 3 bước để làm bài tập": "Day la 3 buoc de hoan thanh bai tap:\n\n1. **Doc ky de bai** - Hieu ro yeu cau va rang buoc\n2. **Phan tich va len ke hoach** - Xac dinh cau truc du lieu va thuat toan can dung\n3. **Viet code va kiem tra** - Implement tung phan va test voi cac test case",
    "Giải thích code trong bài này": "Code trong bai hoc nay su dung cac ky thuat:\n\n- **Import packages**: Import cac thu vien can thiet\n- **Dinh nghia ham main()**: Diem bat dau cua chuong trinh\n- **Xu ly logic**: Cac buoc xu ly chinh cua bai toan",
    "Tóm tắt những điểm quan trọng": "Nhung diem quan trong can nho:\n\n1. Cach khai bao va su dung bien\n2. Cau truc dieu khien (if/else, loop)\n3. Cach xu ly loi va exception\n4. Best practices khi viet code",
  };

  // Check for exact matches first
  for (const [key, response] of Object.entries(responses)) {
    if (question.includes(key) || key.includes(question)) {
      return response;
    }
  }

  // Default response
  return `Cam on ban da hoi! Day la cau tra loi cho cau hoi: "${question}"\n\nMình se giup ban hieu ro hon ve van de nay trong ngut canh cua bai hoc ${context?.title || "hien tai"}.`;
}
