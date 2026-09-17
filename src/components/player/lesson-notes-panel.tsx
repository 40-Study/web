"use client";

/**
 * Panel ghi chú theo mốc thời gian (contract §3).
 *
 * Ba việc panel này làm:
 *  - "Thêm ghi chú tại mm:ss" — lấy giây hiện tại của video làm mốc, không bắt
 *    người học tự gõ số.
 *  - Lọc "Trong chương hiện tại" / "Tất cả" — hai nguồn API khác nhau theo contract.
 *  - Sắp xếp theo mốc thời gian hoặc theo lúc tạo.
 *
 * Khi backend chưa có endpoint (`/courses/:id/notes` chưa triển khai), danh sách
 * rỗng và panel hiện empty state — không có lỗi đỏ.
 */

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Loader2, StickyNote } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCueTime } from "@/lib/vtt-parser";
import { NoteItem } from "./note-item";
import {
  useCourseNotes,
  useCreateNote,
  useDeleteNote,
  useLessonNotes,
  useUpdateNote,
} from "@/hooks/queries/use-notes";
import { MAX_NOTE_CONTENT_LENGTH, type NoteSort } from "@/services/notes.service";

/** Câu empty state theo yêu cầu — không đổi thành câu khác. */
export const NOTES_EMPTY_MESSAGE = "Hãy ghi chép để nhớ những gì bạn đã học!";

type NoteScope = "section" | "all";

interface LessonNotesPanelProps {
  lessonId: string;
  courseId: string;
  /** Chương của bài đang học — dùng cho bộ lọc "Trong chương hiện tại". */
  sectionId?: string;
  /** Giây hiện tại của video, đọc từ player. */
  currentTime: number;
  onSeek: (timestampSeconds: number) => void;
  /**
   * Tăng lên 1 mỗi lần người học bấm `B` (contract §7). Panel không tự nghe phím
   * vì phím tắt thuộc về trang — ở đây chỉ phản ứng khi được yêu cầu mở ô soạn.
   */
  composeToken?: number;
  /** Nội dung ghép sẵn từ transcript ("Thêm vào ghi chú", contract §4). */
  prefill?: { text: string; timestampSeconds: number } | null;
}

export function LessonNotesPanel({
  lessonId,
  courseId,
  sectionId,
  currentTime,
  onSeek,
  composeToken = 0,
  prefill,
}: LessonNotesPanelProps) {
  const [scope, setScope] = useState<NoteScope>("section");
  const [sort, setSort] = useState<NoteSort>("newest");
  const [isAdding, setIsAdding] = useState(false);
  const [draft, setDraft] = useState("");
  /** Mốc giây gắn với nội dung đang soạn — đổi khi ghép từ transcript. */
  const [draftTimestamp, setDraftTimestamp] = useState<number | null>(null);
  const draftRef = useRef<HTMLTextAreaElement>(null);

  // Phím `B`: mở ô soạn và đưa con trỏ vào luôn, người học không phải bấm thêm.
  useEffect(() => {
    if (composeToken <= 0) return;
    setIsAdding(true);
    setDraftTimestamp(null);
    draftRef.current?.focus();
  }, [composeToken]);

  useEffect(() => {
    if (!prefill) return;
    setDraft(prefill.text);
    setDraftTimestamp(prefill.timestampSeconds);
    setIsAdding(true);
  }, [prefill]);

  // BLOCKER review vòng 1 (#6): bộ lọc bị đảo — "Tất cả" từng gọi
  // `useLessonNotes(lessonId)`, chỉ trả ghi chú của MỘT bài, còn
  // `GET /courses/:id/notes` không `section_id` (đúng nghĩa "Tất cả các
  // chương" theo §3) không bao giờ được gọi. Đúng phải là: cả hai chế độ lọc
  // ("Trong chương hiện tại" / "Tất cả") đều dùng CÙNG MỘT endpoint
  // `GET /courses/:id/notes`, khác nhau ở có/không `section_id`.
  // `useLessonNotes` chỉ còn là phương án dự phòng khi thiếu `courseId`.
  const courseQuery = useCourseNotes(courseId || undefined, {
    sectionId: scope === "section" ? sectionId : undefined,
    sort,
  });
  const lessonQuery = useLessonNotes(courseId ? undefined : lessonId);

  const notes = courseId ? courseQuery.data : lessonQuery.data;
  const isLoading = courseId ? courseQuery.isLoading : lessonQuery.isLoading;

  const createNote = useCreateNote(lessonId);
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();

  const sortedNotes = useMemo(() => {
    const list = [...(notes ?? [])];
    if (sort === "newest") {
      return list.sort((a, b) => b.created_at.localeCompare(a.created_at));
    }
    return list.sort((a, b) => a.created_at.localeCompare(b.created_at));
  }, [notes, sort]);

  const isDraftTooLong = draft.length > MAX_NOTE_CONTENT_LENGTH;

  const handleCreate = () => {
    const content = draft.trim();
    if (!content || content.length > MAX_NOTE_CONTENT_LENGTH) return;
    createNote.mutate(
      {
        // Mốc của ghi chú ghép từ transcript ưu tiên hơn giây đang phát — ghi chú
        // phải trỏ về câu nói, không phải về chỗ video tình cờ đang đứng.
        timestamp_seconds: Math.floor(draftTimestamp ?? currentTime),
        content,
      },
      {
        onSuccess: () => {
          setDraft("");
          setDraftTimestamp(null);
          setIsAdding(false);
        },
      }
    );
  };

  const openComposer = () => {
    setDraftTimestamp(null);
    setIsAdding((v) => !v);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-gray-100 p-4">
        <button
          type="button"
          onClick={openComposer}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-3 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          <StickyNote className="h-4 w-4" aria-hidden="true" />
          Thêm ghi chú tại {formatCueTime(draftTimestamp ?? currentTime)}
        </button>

        {isAdding && (
          <div className="mt-3">
            <textarea
              ref={draftRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={3}
              autoFocus
              placeholder="Bạn vừa học được điều gì?"
              // `maxLength` chỉ chặn gõ thêm bằng phím — vẫn kiểm tra `isDraftTooLong`
              // riêng vì dán (paste) một đoạn dài bỏ qua `maxLength` của DOM.
              maxLength={MAX_NOTE_CONTENT_LENGTH + 200}
              className={cn(
                "w-full rounded-lg border px-2.5 py-2 text-sm text-gray-700 focus:outline-none",
                isDraftTooLong
                  ? "border-red-300 focus:border-red-400"
                  : "border-gray-200 focus:border-primary-400"
              )}
            />
            <div className="mt-1 flex items-center justify-between">
              <p className={cn("text-xs", isDraftTooLong ? "text-red-600" : "text-gray-400")}>
                {draft.length}/{MAX_NOTE_CONTENT_LENGTH}
                {isDraftTooLong && " — vượt quá giới hạn, hãy rút gọn lại"}
              </p>
            </div>
            <div className="mt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setDraft("");
                  setDraftTimestamp(null);
                  setIsAdding(false);
                }}
                className="rounded-lg px-2.5 py-1.5 text-xs text-gray-500 hover:bg-gray-100"
              >
                Huỷ
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={createNote.isPending || !draft.trim() || isDraftTooLong}
                className="rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700 disabled:opacity-50"
              >
                {createNote.isPending ? "Đang lưu..." : "Lưu ghi chú"}
              </button>
            </div>
          </div>
        )}

        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="flex rounded-lg bg-gray-100 p-0.5">
            <ScopeButton active={scope === "section"} onClick={() => setScope("section")}>
              Trong chương hiện tại
            </ScopeButton>
            <ScopeButton active={scope === "all"} onClick={() => setScope("all")}>
              Tất cả
            </ScopeButton>
          </div>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as NoteSort)}
            className="rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-600 focus:outline-none"
            aria-label="Sắp xếp ghi chú"
          >
            <option value="newest">Mới nhất</option>
            <option value="oldest">Cũ nhất</option>
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-gray-300" />
          </div>
        ) : sortedNotes.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <StickyNote className="h-8 w-8 text-gray-200" aria-hidden="true" />
            <p className="text-sm text-gray-500">{NOTES_EMPTY_MESSAGE}</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {sortedNotes.map((note) => (
              <NoteItem
                key={note.id}
                note={note}
                showLesson={scope === "all"}
                onSeek={onSeek}
                // Review vòng 1 (#26 nhỏ): `updateNote` dùng chung một mutation
                // cho mọi ghi chú — so `variables?.noteId` để chỉ nút Lưu của
                // ĐÚNG ghi chú đang sửa bị mờ, không phải tất cả.
                isSaving={updateNote.isPending && updateNote.variables?.noteId === note.id}
                onSave={(content) => updateNote.mutate({ noteId: note.id, data: { content } })}
                onDelete={() => deleteNote.mutate(note.id)}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function ScopeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
        active ? "bg-white text-primary-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
      )}
    >
      {children}
    </button>
  );
}
