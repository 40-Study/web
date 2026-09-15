"use client";

/**
 * Upload phụ đề `.vtt` cho bài học (contract §4).
 *
 * Phụ đề là file NHỎ, khác hẳn video: không cần chunked upload. Ở đây dùng lại
 * luồng presigned có sẵn nhưng chỉ một chunk duy nhất — `init → presigned-urls([1])
 * → PUT lên presigned → chunk-complete → complete` — để phụ đề nằm cùng bucket
 * `study-media` với video, không mở thêm đường upload thứ hai.
 *
 * Nhãn nút nói rõ đang chờ GÌ, vì backend hiện chưa trả URL cuối sau `complete`
 * (`data = null`): khi đó nút chuyển sang trạng thái "chờ backend trả URL" thay vì
 * báo thành công rồi lưu một URL rỗng.
 */

import { useRef, useState } from "react";
import { Loader2, Subtitles, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { videoUploadService } from "@/services/video-upload.service";

/** Phụ đề là file text; 5MB là trần rộng rãi cho một bài giảng dài. */
const MAX_VTT_BYTES = 5 * 1024 * 1024;

type SubtitleState =
  | { kind: "idle" }
  | { kind: "uploading" }
  | { kind: "awaiting-url" }
  | { kind: "saved"; url: string }
  | { kind: "error"; message: string };

interface SubtitleUploadFieldProps {
  courseId: string;
  lessonId: string;
  /** `subtitle_url` hiện tại của bài — `null`/rỗng là chưa có phụ đề. */
  currentUrl?: string | null;
  /** Nhận URL phụ đề để trang gọi `PUT /lessons/:id`. */
  onUploaded: (subtitleUrl: string) => void;
  /** Gỡ phụ đề khỏi bài. */
  onCleared?: () => void;
}

export function SubtitleUploadField({
  courseId,
  lessonId,
  currentUrl,
  onUploaded,
  onCleared,
}: SubtitleUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<SubtitleState>(
    currentUrl ? { kind: "saved", url: currentUrl } : { kind: "idle" }
  );

  const handleFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".vtt")) {
      setState({ kind: "error", message: "Chỉ nhận file .vtt (WebVTT)." });
      return;
    }
    if (file.size > MAX_VTT_BYTES) {
      setState({ kind: "error", message: "File phụ đề vượt quá 5MB." });
      return;
    }

    setState({ kind: "uploading" });
    try {
      const init = await videoUploadService.initUpload({
        resource_id: lessonId,
        resource_type: "lesson_subtitle",
        original_file_name: file.name,
        content_type: "text/vtt",
        file_size: file.size,
        chunk_size: file.size,
      });

      const [presigned] = await videoUploadService.getPresignedUrls({
        upload_id: init.upload_id,
        chunk_numbers: [1],
      });
      if (!presigned) throw new Error("Không lấy được URL upload.");

      const put = await fetch(presigned.url, { method: "PUT", body: file });
      if (!put.ok) throw new Error(`Upload thất bại (${put.status}).`);

      await videoUploadService.chunkComplete({
        upload_id: init.upload_id,
        chunk_number: 1,
        etag: put.headers.get("ETag") ?? "",
        size: file.size,
      });
      await videoUploadService.completeUpload(init.upload_id);

      // Backend chưa trả URL cuối ⇒ không bịa URL từ tên file (sai bucket/prefix
      // là hỏng âm thầm). Giữ trạng thái chờ để giáo viên dán URL nếu cần.
      setState({ kind: "awaiting-url" });
    } catch (error) {
      setState({
        kind: "error",
        message: error instanceof Error ? error.message : "Upload phụ đề thất bại.",
      });
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Subtitles className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <span className="text-sm font-medium">Phụ đề (.vtt)</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept=".vtt,text/vtt"
          className="hidden"
          data-lesson-id={lessonId}
          data-course-id={courseId}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
            e.target.value = "";
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={state.kind === "uploading"}
          onClick={() => inputRef.current?.click()}
        >
          {state.kind === "uploading" ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Upload className="mr-2 h-4 w-4" />
          )}
          {state.kind === "uploading" ? "Đang tải lên..." : "Tải phụ đề lên"}
        </Button>

        {state.kind === "saved" && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setState({ kind: "idle" });
              onCleared?.();
            }}
          >
            <X className="mr-2 h-4 w-4" />
            Gỡ phụ đề
          </Button>
        )}
      </div>

      {state.kind === "saved" && (
        <p className="text-xs text-muted-foreground">Đang dùng: {state.url}</p>
      )}
      {state.kind === "awaiting-url" && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            File đã tải lên. Dán URL phụ đề do backend trả về để lưu vào bài học.
          </p>
          <SubtitleUrlInput onSubmit={(url) => setState({ kind: "saved", url })} />
        </div>
      )}
      {state.kind === "error" && <p className="text-xs text-destructive">{state.message}</p>}
    </div>
  );
}

/** Ô dán URL phụ đề — chỉ hiện khi backend chưa trả URL tự động. */
function SubtitleUrlInput({ onSubmit }: { onSubmit: (url: string) => void }) {
  const [value, setValue] = useState("");
  return (
    <div className="flex gap-2">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="https://.../bai-1.vtt"
        className="flex-1 rounded-md border border-input px-3 py-1.5 text-sm"
      />
      <Button
        type="button"
        size="sm"
        disabled={!value.trim()}
        onClick={() => onSubmit(value.trim())}
      >
        Lưu
      </Button>
    </div>
  );
}
