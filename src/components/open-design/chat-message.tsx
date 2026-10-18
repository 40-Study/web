"use client";
import { useState } from "react";
import {
  Check,
  Copy,
  FileText,
  ListChecks,
  Presentation,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import type { DesignProject, TeachingArtifact } from "@/lib/open-design/project";

export function StudioChatMessage({
  message,
  artifact,
  onOpen,
}: {
  message: DesignProject["messages"][number];
  artifact?: TeachingArtifact | null;
  onOpen: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  return (
    <article className={`od-message od-message--${message.role}`}>
      <div className="od-message-label">
        {message.role === "assistant" ? (
          <>
            <span className="od-assistant-avatar">
              <Sparkles className="h-3 w-3" />
            </span>
            ForteX AI
          </>
        ) : (
          "Bạn"
        )}
      </div>
      {(message.files.length > 0 || message.skills.length > 0) && (
        <div className="od-message-attachments">
          {message.files.map((file) => (
            <span key={file}>
              <FileText className="h-3 w-3" />
              {file}
            </span>
          ))}
          {message.skills.map((skill) => (
            <span key={skill}>
              <Sparkles className="h-3 w-3" />
              {skill}
            </span>
          ))}
        </div>
      )}
      <p className="od-message-text">{message.text}</p>
      {message.role === "assistant" && artifact && (
        <button className="od-chat-artifact" onClick={onOpen}>
          <span className="od-chat-artifact-icon">
            {artifact.kind === "slides" ? (
              <Presentation className="h-5 w-5" />
            ) : (
              <ListChecks className="h-5 w-5" />
            )}
          </span>
          <span>
            <strong>{artifact.title}</strong>
            <small>
              {artifact.kind === "slides"
                ? `${artifact.slides.length} slide · Bản trình bày`
                : `${artifact.questions.length} câu hỏi · Có đáp án và chấm thử`}
            </small>
          </span>
          <ArrowUpRight className="h-4 w-4" />
        </button>
      )}
      {message.role === "assistant" && (
        <div className="od-message-actions">
          <button
            aria-label="Sao chép câu trả lời"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(message.text);
                setCopied(true);
                setCopyError(false);
              } catch {
                setCopyError(true);
              }
            }}
          >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copied ? "Đã sao chép" : "Sao chép"}
          </button>
          {copyError && (
            <span role="status">Chưa sao chép được. Bạn có thể chọn văn bản để sao chép.</span>
          )}
        </div>
      )}
    </article>
  );
}
