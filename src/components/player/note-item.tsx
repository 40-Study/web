"use client";

/**
 * Một dòng ghi chú trong panel (contract §3).
 *
 * Bấm vào mốc thời gian để seek video tới đúng giây đó. Sửa/xoá đều phải xác
 * nhận: ghi chú là công sức người học tự bỏ ra, xoá nhầm là mất thật.
 */

import { useEffect, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCueTime } from "@/lib/vtt-parser";
import { MAX_NOTE_CONTENT_LENGTH, type Note } from "@/services/notes.service";

interface NoteItemProps {
  note: Note;
  /** Bấm mốc thời gian → seek tới giây này. */
  onSeek: (timestampSeconds: number) => void;
  onSave: (content: string) => void;
  onDelete: () => void;
  isSaving?: boolean;
  /** Hiện tên chương/bài khi xem ở chế độ "Tất cả". */
  showLesson?: boolean;
}

export function NoteItem({
  note,
  onSeek,
  onSave,
  onDelete,
  isSaving,
  showLesson,
}: NoteItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(note.content);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  // Note đổi từ bên ngoài (refetch) thì bỏ bản nháp đang sửa dở.
  useEffect(() => {
    setDraft(note.content);
  }, [note.content]);

  const isDraftTooLong = draft.length > MAX_NOTE_CONTENT_LENGTH;

  const handleSave = () => {
    const content = draft.trim();
    if (!content || content === note.content || content.length > MAX_NOTE_CONTENT_LENGTH) {
      setIsEditing(false);
      return;
    }
    onSave(content);
    setIsEditing(false);
  };

  return (
    <li className="rounded-xl border border-gray-100 bg-white px-3 py-2.5">
      <div className="flex items-start justify-between gap-2">
        <button
          type="button"
          onClick={() => onSeek(note.timestamp_seconds)}
          className="rounded-md bg-primary-50 px-2 py-0.5 font-mono text-xs font-medium text-primary-600 hover:bg-primary-100"
          title="Tới đoạn này trong video"
        >
          {formatCueTime(note.timestamp_seconds)}
        </button>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsEditing((v) => !v)}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Sửa ghi chú"
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setIsConfirmingDelete(true)}
            className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
            aria-label="Xoá ghi chú"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {showLesson && (
        <p className="mt-1.5 text-[11px] text-gray-400">
          {note.section_title} • {note.lesson_title}
        </p>
      )}

      {isEditing ? (
        <div className="mt-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            maxLength={MAX_NOTE_CONTENT_LENGTH + 200}
            className={cn(
              "w-full rounded-lg border px-2.5 py-2 text-sm text-gray-700 focus:outline-none",
              isDraftTooLong ? "border-red-300 focus:border-red-400" : "border-gray-200 focus:border-primary-400"
            )}
            placeholder="Nội dung ghi chú"
          />
          <p className={cn("mt-1 text-xs", isDraftTooLong ? "text-red-600" : "text-gray-400")}>
            {draft.length}/{MAX_NOTE_CONTENT_LENGTH}
            {isDraftTooLong && " — vượt quá giới hạn, hãy rút gọn lại"}
          </p>
          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setDraft(note.content);
                setIsEditing(false);
              }}
              className="rounded-lg px-2.5 py-1 text-xs text-gray-500 hover:bg-gray-100"
            >
              Huỷ
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || isDraftTooLong}
              className={cn(
                "rounded-lg bg-primary-600 px-3 py-1 text-xs font-medium text-white hover:bg-primary-700",
                (isSaving || isDraftTooLong) && "opacity-60"
              )}
            >
              Lưu
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-1.5 whitespace-pre-wrap text-sm text-gray-700">{note.content}</p>
      )}

      {isConfirmingDelete && (
        <div className="mt-2 flex items-center justify-between gap-2 rounded-lg bg-red-50 px-2.5 py-1.5">
          <span className="text-xs text-red-700">Xoá ghi chú này?</span>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setIsConfirmingDelete(false)}
              className="rounded px-2 py-0.5 text-xs text-gray-600 hover:bg-white"
            >
              Giữ lại
            </button>
            <button
              type="button"
              onClick={() => {
                setIsConfirmingDelete(false);
                onDelete();
              }}
              className="rounded bg-red-600 px-2 py-0.5 text-xs font-medium text-white hover:bg-red-700"
            >
              Xoá
            </button>
          </div>
        </div>
      )}
    </li>
  );
}
