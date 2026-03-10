"use client";

import { use, useState } from "react";
import { useSession, useRoomToken, useMessages, useSendMessage, useAssignments } from "@/hooks/queries/use-livestream";
import { Button } from "@/components/ui/button";

interface Props {
  params: Promise<{ id: string }>;
}

export default function ClassroomPage({ params }: Props) {
  const { id } = use(params);
  const { data: session, isLoading: sessionLoading } = useSession(id);
  const { data: tokenData } = useRoomToken(session?.room_name || "");
  const { data: messagesData } = useMessages(id);
  const { data: assignmentsData } = useAssignments(id);
  const sendMessage = useSendMessage();

  const [message, setMessage] = useState("");
  const [activePanel, setActivePanel] = useState<"chat" | "assignments" | "participants">("chat");

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    sendMessage.mutate({ sessionId: id, content: message });
    setMessage("");
  };

  if (sessionLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-white">Đang tải phiên học...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-white">Không tìm thấy phiên học</div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Main video area */}
      <div className="flex-1 p-4">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-white">{session.title}</h1>
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-sm ${
                session.status === "live"
                  ? "bg-red-500 text-white"
                  : "bg-gray-600 text-gray-300"
              }`}
            >
              {session.status === "live" ? "LIVE" : session.status}
            </span>
          </div>
        </div>

        {/* Video grid placeholder */}
        <div className="flex h-[calc(100%-5rem)] items-center justify-center rounded-xl bg-gray-800">
          <div className="text-center text-gray-400">
            <p className="text-lg">Video Grid</p>
            <p className="mt-2 text-sm">
              {tokenData?.token
                ? "LiveKit token ready"
                : "Waiting for token..."}
            </p>
            <p className="mt-4 text-xs text-gray-500">
              Integration with @livekit/components-react
            </p>
          </div>
        </div>
      </div>

      {/* Side panel */}
      <div className="flex w-80 flex-col border-l border-gray-700 bg-gray-800">
        {/* Panel tabs */}
        <div className="flex border-b border-gray-700">
          {(["chat", "assignments", "participants"] as const).map((panel) => (
            <button
              key={panel}
              onClick={() => setActivePanel(panel)}
              className={`flex-1 py-3 text-sm font-medium ${
                activePanel === panel
                  ? "border-b-2 border-primary-500 text-white"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              {panel === "chat" && "Chat"}
              {panel === "assignments" && "Bài tập"}
              {panel === "participants" && "Thành viên"}
            </button>
          ))}
        </div>

        {/* Panel content */}
        <div className="flex-1 overflow-auto p-4">
          {activePanel === "chat" && (
            <div className="flex h-full flex-col">
              <div className="flex-1 space-y-3 overflow-auto">
                {messagesData?.messages.map((msg) => (
                  <div key={msg.id} className="rounded-lg bg-gray-700 p-3">
                    <div className="text-sm font-medium text-white">
                      {msg.sender_name}
                    </div>
                    <div className="mt-1 text-sm text-gray-300">
                      {msg.content}
                    </div>
                  </div>
                ))}
                {(!messagesData?.messages || messagesData.messages.length === 0) && (
                  <p className="text-center text-sm text-gray-500">
                    Chưa có tin nhắn
                  </p>
                )}
              </div>
              <form onSubmit={handleSendMessage} className="mt-4 flex gap-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Nhập tin nhắn..."
                  className="flex-1 rounded-lg bg-gray-700 px-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <Button type="submit" size="sm" disabled={sendMessage.isPending}>
                  Gửi
                </Button>
              </form>
            </div>
          )}

          {activePanel === "assignments" && (
            <div className="space-y-3">
              {assignmentsData?.assignments.map((assignment) => (
                <div key={assignment.id} className="rounded-lg bg-gray-700 p-4">
                  <h3 className="font-medium text-white">{assignment.title}</h3>
                  <p className="mt-1 text-sm text-gray-400">
                    {assignment.language}
                  </p>
                  {assignment.is_published && (
                    <span className="mt-2 inline-block rounded bg-green-500/20 px-2 py-0.5 text-xs text-green-400">
                      Đã phát
                    </span>
                  )}
                </div>
              ))}
              {(!assignmentsData?.assignments || assignmentsData.assignments.length === 0) && (
                <p className="text-center text-sm text-gray-500">
                  Chưa có bài tập
                </p>
              )}
            </div>
          )}

          {activePanel === "participants" && (
            <div className="text-center text-sm text-gray-500">
              {session.participant_count} thành viên
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
