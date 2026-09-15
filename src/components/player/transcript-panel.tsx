"use client";

/**
 * Panel phụ đề / transcript (contract §4).
 *
 * Nguồn là chính file `.vtt` của bài (`lesson.subtitle_url`) — parser tự viết ở
 * `lib/vtt-parser` nên không kéo thêm thư viện nào vào bundle.
 *
 * Hai hành vi chính:
 *  - Tự cuộn tới cue đang phát theo `currentTime` (chỉ cuộn trong khung panel,
 *    không cuộn trang).
 *  - Bôi đen một đoạn thoại rồi "Thêm vào ghi chú" — nối nội dung chọn sẵn vào
 *    ô ghi chú kèm mốc thời gian của cue.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, MessageSquarePlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { findActiveCue, formatCueTime, hasSubtitleSource, parseVtt } from "@/lib/vtt-parser";

interface TranscriptPanelProps {
  /** `lesson.subtitle_url` — `null`/rỗng thì panel không render gì (contract §4). */
  subtitleUrl: string | null | undefined;
  currentTime: number;
  /** Bấm vào một cue để seek video tới đó. */
  onSeek?: (timestampSeconds: number) => void;
  /** Nhận nội dung đã chọn + mốc giây của cue để ghép vào ghi chú. */
  onAddToNote?: (text: string, timestampSeconds: number) => void;
}

export function TranscriptPanel({
  subtitleUrl,
  currentTime,
  onSeek,
  onAddToNote,
}: TranscriptPanelProps) {
  const [cues, setCues] = useState<ReturnType<typeof parseVtt>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasSubtitleSource(subtitleUrl)) {
      setCues([]);
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    fetch(subtitleUrl!, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Không tải được phụ đề");
        return response.text();
      })
      .then((text) => setCues(parseVtt(text)))
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        // Phụ đề hỏng KHÔNG được làm hỏng bài học — chỉ panel này im lặng báo.
        setError("Không tải được phụ đề của bài này.");
        setCues([]);
      })
      .finally(() => setIsLoading(false));

    return () => controller.abort();
  }, [subtitleUrl]);

  const activeIndex = useMemo(() => {
    const active = findActiveCue(cues, currentTime);
    return active ? cues.indexOf(active) : -1;
  }, [cues, currentTime]);

  // Tự cuộn tới cue đang phát, nhưng chỉ cuộn trong khung panel.
  useEffect(() => {
    if (activeIndex < 0) return;
    const node = containerRef.current?.querySelector<HTMLElement>(
      `[data-cue-index="${activeIndex}"]`
    );
    node?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [activeIndex]);

  if (!hasSubtitleSource(subtitleUrl)) return null;

  const handleAddSelection = () => {
    const selection = window.getSelection?.()?.toString().trim();
    if (!selection || !onAddToNote) return;
    const cue = activeIndex >= 0 ? cues[activeIndex] : undefined;
    onAddToNote(selection, cue?.start ?? currentTime);
    window.getSelection?.()?.removeAllRanges();
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-gray-100 px-4 py-3">
        <h3 className="text-sm font-semibold text-gray-900">Phụ đề</h3>
        <button
          type="button"
          onClick={handleAddSelection}
          disabled={!onAddToNote}
          className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 disabled:opacity-40"
          title="Bôi đen một đoạn rồi bấm để lưu vào ghi chú"
        >
          <MessageSquarePlus className="h-3.5 w-3.5" aria-hidden="true" />
          Thêm vào ghi chú
        </button>
      </div>

      <div ref={containerRef} className="flex-1 overflow-y-auto px-4 py-3">
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-gray-300" />
          </div>
        ) : error ? (
          <p className="py-6 text-center text-sm text-gray-500">{error}</p>
        ) : cues.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-500">Bài học này chưa có phụ đề.</p>
        ) : (
          <ul className="space-y-1">
            {cues.map((cue, index) => (
              <li key={cue.id} data-cue-index={index}>
                <button
                  type="button"
                  onClick={() => onSeek?.(cue.start)}
                  className={cn(
                    "flex w-full gap-3 rounded-lg px-2 py-1.5 text-left transition-colors",
                    index === activeIndex ? "bg-primary-50" : "hover:bg-gray-50"
                  )}
                >
                  <span
                    className={cn(
                      "shrink-0 pt-0.5 font-mono text-[11px]",
                      index === activeIndex ? "text-primary-600" : "text-gray-400"
                    )}
                  >
                    {formatCueTime(cue.start)}
                  </span>
                  <span
                    className={cn(
                      "text-sm leading-relaxed",
                      index === activeIndex ? "text-primary-900" : "text-gray-600"
                    )}
                  >
                    {cue.text}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
