"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TiptapEditor } from "@/components/editor";
import { cn } from "@/lib/utils";

export interface Note {
  id: string;
  content: string;
  timestamp?: number; // video timestamp in seconds
  createdAt: string;
}

interface LessonNotesProps {
  lessonId: string;
  notes: Note[];
  currentVideoTime?: number;
  onAddNote: (note: Omit<Note, "id" | "createdAt">) => void;
  onDeleteNote: (noteId: string) => void;
  onSeekToTimestamp?: (timestamp: number) => void;
  className?: string;
}

function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function LessonNotes({
  notes,
  currentVideoTime = 0,
  onAddNote,
  onDeleteNote,
  onSeekToTimestamp,
  className,
}: LessonNotesProps) {
  const [newNote, setNewNote] = useState("");
  const [includeTimestamp, setIncludeTimestamp] = useState(true);

  const handleAddNote = () => {
    if (!newNote.trim()) return;

    onAddNote({
      content: newNote.trim(),
      timestamp: includeTimestamp ? currentVideoTime : undefined,
    });
    setNewNote("");
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Add note input */}
      <div className="space-y-2">
        <TiptapEditor
          value={newNote}
          onChange={setNewNote}
          placeholder="Thêm ghi chú..."
          minHeight={100}
        />
        <div className="flex items-center justify-between">
          {/* Timestamp toggle */}
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={includeTimestamp}
              onChange={(e) => setIncludeTimestamp(e.target.checked)}
              className="rounded border-muted-foreground"
            />
            <span className="text-muted-foreground">
              Gắn thời gian video ({formatTimestamp(currentVideoTime)})
            </span>
          </label>
          <Button size="sm" onClick={handleAddNote} disabled={!newNote.trim()}>
            Lưu
          </Button>
        </div>
      </div>

      {/* Notes list */}
      <div className="space-y-3">
        {notes.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-8">
            Chua co ghi chu nao. Bat dau ghi chu ngay!
          </p>
        ) : (
          notes.map((note) => (
            <Card key={note.id} className="p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  {note.timestamp !== undefined && (
                    <button
                      onClick={() => onSeekToTimestamp?.(note.timestamp!)}
                      className="text-xs text-primary-600 hover:underline mb-1 inline-block"
                    >
                      {formatTimestamp(note.timestamp)}
                    </button>
                  )}
                  <div
                    className="text-sm prose prose-sm max-w-none break-words"
                    dangerouslySetInnerHTML={{ __html: note.content }}
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(note.createdAt).toLocaleDateString("vi-VN", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 flex-shrink-0"
                  onClick={() => onDeleteNote(note.id)}
                  aria-label="Xoa ghi chu"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
