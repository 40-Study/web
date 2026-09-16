"use client";

/**
 * Ô nhập thời lượng video — dùng chung cho form tạo (AddContentModal) và form sửa
 * (EditContentModal). Tách ra vì hai chỗ phải hành xử y hệt nhau: cùng đơn vị nhập,
 * cùng luật "ô trống thì bỏ hẳn khoá", cùng câu gợi ý theo nguồn video.
 *
 * Bối cảnh C-6: video ngoài hệ thống upload (YouTube/Vimeo/mp4) không có thời lượng
 * nào server tự đọc được, nên bài học đó không bao giờ đạt `completed`. Ô này là chỗ
 * duy nhất để giáo viên bù vào. Với video đã upload thì server tự đọc
 * (`video_uploads.duration`) nên ô này chỉ còn là tuỳ chọn — câu gợi ý nói rõ khác biệt.
 */

import { Input } from "@/components/ui/input";
import { isUploadedVideoUrl, parseLessonDuration } from "@/lib/lesson-duration";

/** Câu gợi ý khi video đến từ upload — server tự đọc được, giáo viên không phải nhập. */
const HINT_UPLOAD = "Video upload — hệ thống tự đọc được thời lượng, có thể để trống.";

/**
 * Câu gợi ý khi video nằm ngoài hệ thống.
 *
 * Nói thẳng HẬU QUẢ chứ không chỉ nói định dạng: giáo viên không có cách nào tự đoán
 * ra rằng bỏ trống ô này làm học viên không bao giờ hoàn thành được bài — và với
 * `course.sequential = true` thì cả khoá kẹt luôn tại đó (C-6).
 */
const HINT_EXTERNAL =
  "Video ngoài hệ thống (YouTube, Vimeo, mp4): hệ thống không tự đọc được thời lượng. Bỏ trống thì học viên không bao giờ hoàn thành được bài này, và cả khoá có thể kẹt tại đây. Nhập phút:giây (vd 12:30), hoặc gõ số trần nếu là phút (12 = 12 phút).";

/** Thời lượng đã lưu không xoá được bằng cách để trống ô — nói trước để khỏi tưởng nhầm. */
const HINT_EDIT_KEEP = "Để trống = giữ nguyên thời lượng đã lưu.";

const INVALID_MESSAGE =
  "Thời lượng không hợp lệ. Nhập dạng phút:giây (vd 12:30), hoặc xoá trắng ô này.";

export interface VideoDurationFieldProps {
  value: string;
  onChange: (value: string) => void;
  /** URL video hiện tại (`uploadedVideoUrl || videoUrl`) — quyết định câu gợi ý. */
  videoUrl?: string | null;
  /** Hiện thêm câu "để trống = giữ nguyên" (chỉ đúng ở form sửa). */
  isEditing?: boolean;
}

export function VideoDurationField({
  value,
  onChange,
  videoUrl,
  isEditing = false,
}: VideoDurationFieldProps) {
  const fromUpload = isUploadedVideoUrl(videoUrl);
  const parse = parseLessonDuration(value);
  const invalid = parse.kind === "invalid";

  return (
    <div>
      <Input
        label="Thời lượng video"
        placeholder="VD: 12:30"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        error={invalid ? INVALID_MESSAGE : undefined}
      />

      {/*
        Ô trống KHÔNG phải lỗi — nó là "chưa biết", và người gọi phải bỏ hẳn khoá
        `duration` khỏi payload. Chỉ khi gõ vào mà không đọc được mới là lỗi.
      */}
      {!invalid && (
        <p
          className={
            fromUpload
              ? "mt-1 text-xs text-muted-foreground"
              : "mt-1 text-xs text-amber-700"
          }
        >
          {fromUpload ? HINT_UPLOAD : HINT_EXTERNAL}
          {isEditing ? ` ${HINT_EDIT_KEEP}` : ""}
        </p>
      )}
    </div>
  );
}

export default VideoDurationField;
