"use client";
import { useRef, useState } from "react";
import {
  ArrowUp,
  ChevronDown,
  FileText,
  Loader2,
  Paperclip,
  Plus,
  Sparkles,
  Square,
  X,
} from "lucide-react";
import type { SourceDocument } from "@/lib/open-design/project";
import type { TeachingSkill } from "@/lib/open-design/skills";
export function StudioComposer({
  prompt,
  onPrompt,
  documents,
  onRemove,
  onUpload,
  skill,
  onSkills,
  count,
  onCount,
  busy,
  uploading,
  configured,
  onSend,
  onCancel,
  error,
  compact = false,
}: {
  prompt: string;
  onPrompt: (s: string) => void;
  documents: SourceDocument[];
  onRemove: (id: string) => void;
  onUpload: (files: File[]) => void;
  skill: TeachingSkill;
  onSkills: () => void;
  count: number;
  onCount: (n: number) => void;
  busy: boolean;
  uploading: boolean;
  configured: boolean;
  onSend: () => void;
  onCancel: () => void;
  error: string;
  compact?: boolean;
}) {
  const file = useRef<HTMLInputElement>(null);
  const [menu, setMenu] = useState(false);
  const locked = busy || uploading;
  return (
    <form
      className={`od-composer ${compact ? "od-composer--compact" : ""}`}
      onSubmit={(e) => {
        e.preventDefault();
        onSend();
      }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        if (!locked) onUpload(Array.from(e.dataTransfer.files));
      }}
    >
      {documents.length > 0 && (
        <div className="od-composer-files">
          {documents.map((doc) => (
            <span key={doc.id} className="od-file-chip">
              <FileText className="h-4 w-4 shrink-0" />
              <span className="max-w-[140px] truncate" title={doc.name}>
                {doc.name}
              </span>
              <button
                type="button"
                aria-label={`Gỡ ${doc.name}`}
                disabled={locked}
                onClick={() => onRemove(doc.id)}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <label className="sr-only" htmlFor={compact ? "studio-chat-prompt" : "studio-home-prompt"}>
        Nhắn cho AI
      </label>
      <textarea
        id={compact ? "studio-chat-prompt" : "studio-home-prompt"}
        placeholder={
          compact
            ? "Bạn muốn chỉnh sửa gì tiếp?"
            : "Mô tả ý tưởng của bạn hoặc thả tài liệu vào đây…"
        }
        value={prompt}
        maxLength={6000}
        disabled={locked}
        onChange={(e) => onPrompt(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            if (!locked && configured && prompt.trim()) onSend();
          }
        }}
      />
      {uploading && (
        <p
          role="status"
          className="flex items-center gap-2 px-5 pb-3 text-xs text-muted-foreground"
        >
          <Loader2 className="h-3 w-3 animate-spin" />
          Đang đọc tài liệu…
        </p>
      )}
      <div className="od-composer-footer">
        <div className="relative">
          <button
            type="button"
            aria-label="Đính kèm và skills"
            aria-expanded={menu}
            className="od-icon-button"
            disabled={locked}
            onClick={() => setMenu(!menu)}
          >
            <Plus className="h-5 w-5" />
          </button>
          {menu && (
            <>
              <button
                type="button"
                aria-label="Đóng menu đính kèm"
                className="fixed inset-0 z-20 cursor-default"
                onClick={() => setMenu(false)}
              />
              <div className="od-plus-menu">
                <button
                  type="button"
                  disabled={documents.length >= 3}
                  onClick={() => {
                    file.current?.click();
                    setMenu(false);
                  }}
                >
                  <Paperclip className="h-4 w-4" />
                  Đính kèm tài liệu
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSkills();
                    setMenu(false);
                  }}
                >
                  <Sparkles className="h-4 w-4" />
                  Gắn skill
                </button>
              </div>
            </>
          )}
        </div>
        <input
          ref={file}
          type="file"
          multiple
          accept=".pdf,.docx,.pptx,.txt,.md"
          aria-label="Đính kèm tài liệu"
          className="sr-only"
          disabled={locked || documents.length >= 3}
          onChange={(e) => {
            onUpload(Array.from(e.target.files ?? []));
            e.target.value = "";
          }}
        />
        <button type="button" disabled={locked} className="od-skill-chip" onClick={onSkills}>
          <Sparkles className="h-3.5 w-3.5" />
          <span className="max-w-[130px] truncate">{skill.name}</span>
          <ChevronDown className="h-3 w-3" />
        </button>
        <label className="od-count">
          <span className="sr-only">{skill.output === "slides" ? "Số slide" : "Số câu hỏi"}</span>
          <input
            aria-label={skill.output === "slides" ? "Số slide" : "Số câu hỏi"}
            type="number"
            min={1}
            max={skill.output === "slides" ? 20 : 30}
            value={count}
            disabled={locked}
            onChange={(e) => onCount(Number(e.target.value))}
          />
          <span>{skill.output === "slides" ? "slide" : "câu"}</span>
        </label>
        <span className="od-model">
          <span className={configured ? "bg-green-500" : "bg-amber-500"} />
          Viettel AI
        </span>
        {busy ? (
          <button
            className="od-send"
            type="button"
            aria-label="Dừng tạo"
            onClick={(event) => {
              if (event.detail <= 1) onCancel();
            }}
          >
            <Square className="h-4 w-4" />
          </button>
        ) : (
          <button
            className="od-send"
            type="submit"
            aria-label="Gửi tin nhắn"
            onClick={(event) => {
              // Stop can become Send before the second click of a double-click arrives.
              if (event.detail > 1) event.preventDefault();
            }}
            disabled={
              locked ||
              !configured ||
              !prompt.trim() ||
              !Number.isInteger(count) ||
              count < 1 ||
              count > (skill.output === "slides" ? 20 : 30)
            }
          >
            <ArrowUp className="h-5 w-5" />
          </button>
        )}
      </div>
      {!configured && (
        <p role="status" className="border-t px-4 py-2 text-xs text-muted-foreground">
          Chưa kết nối Viettel AI. Cần hoàn tất cấu hình để tạo nội dung.
        </p>
      )}
      {error && (
        <p role="alert" className="border-t px-4 py-3 text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </form>
  );
}
