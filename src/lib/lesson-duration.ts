/**
 * Thời lượng video bài giảng — nhập ở UI theo `phút:giây`, gửi backend bằng **GIÂY**.
 *
 * Bối cảnh (C-6): backend coi `lesson_contents.duration` là mẫu số duy nhất để tính
 * `watched_pct`, và chỉ tin `watched_pct` khi CHÍNH SERVER biết thời lượng (C-2). Video
 * nằm ngoài hệ thống upload (YouTube / Vimeo / mp4) không có nguồn nào để server tự đọc,
 * nên bài đó không bao giờ đạt `completed` — kèm `course.sequential = true` là cả khoá
 * kẹt vĩnh viễn tại bài đó.
 *
 * Vì thế `0` và "không gửi khoá" là HAI chuyện khác nhau và không được lẫn:
 * - không gửi khoá → backend giữ nguyên giá trị cũ / coi như chưa biết
 * - gửi `0`        → backend cũng coi là "chưa biết" (đúng C-2) → vẫn kẹt y nguyên
 * Nên hàm ở đây tách hẳn `empty` khỏi `invalid`, và người gọi PHẢI bỏ khoá khi `empty`.
 *
 * Tách khỏi component để unit-test được các giá trị biên mà không phải render modal.
 */

/** Kết quả đọc ô nhập thời lượng. */
export type LessonDurationParse =
  /** Ô trống — KHÔNG phải giá trị 0. Người gọi phải bỏ hẳn khoá `duration`. */
  | { kind: "empty" }
  | { kind: "valid"; seconds: number }
  /** Gõ vào nhưng không đọc được (hoặc ra 0/âm) — phải chặn gửi, không được im lặng bỏ qua. */
  | { kind: "invalid" };

/**
 * Trần thời lượng: 24 giờ.
 *
 * Một lỗi gõ ở đây không báo lỗi ở đâu cả — nó chỉ âm thầm làm mẫu số sai, và bài học
 * hoặc không bao giờ hoàn thành được (quá dài) hoặc hoàn thành sai (quá ngắn). Chặn ở
 * mức "không thể là video bài giảng" là lớp phòng thủ rẻ tiền cho đúng loại lỗi đó.
 */
const MAX_SECONDS = 24 * 60 * 60;

/**
 * Đọc ô nhập thời lượng của giáo viên.
 *
 * Chấp nhận:
 * - `mm:ss` (vd `12:30` = 12 phút 30 giây) — dạng khuyến nghị, hiện trong placeholder
 * - `hh:mm:ss` (vd `1:05:00`)
 * - số trần, hiểu là **PHÚT** (vd `12` = 12 phút) — vì đó là đơn vị giáo viên nghĩ tới
 *   khi nói "video dài 12". Phút ở dạng này KHÔNG giới hạn 59 (vd `90:00` = 90 phút).
 *
 * Giây và phút (khi có từ 2 phần trở lên) phải nằm trong 0..59; mọi ký tự không phải
 * chữ số đều bị từ chối (không nhận dấu thập phân). Tổng phải > 0 và ≤ 24 giờ.
 *
 * @param input Chuỗi thô trong ô nhập.
 */
export function parseLessonDuration(input: string): LessonDurationParse {
  const raw = input.trim();
  if (!raw) return { kind: "empty" };

  const parts = raw.split(":").map((p) => p.trim());
  // 3 phần trở lên là lỗi gõ (vd "1:2:3:4") — không đoán ý.
  if (parts.length > 3) return { kind: "invalid" };
  // Số trần không có dấu hai chấm; "1:2" có 2 phần nên vẫn bị coi là mm:ss.
  if (!parts.every((p) => /^\d+$/.test(p))) return { kind: "invalid" };

  const nums = parts.map((p) => Number(p));

  // Dạng "mm:ss" / "hh:mm:ss": phần CUỐI là giây và phải < 60; phần giữa (chỉ có ở
  // dạng 3 phần) là phút và cũng phải < 60. Riêng phần đầu được tự do — "90:00" là
  // 90 phút, giáo viên nói vậy là bình thường.
  if (nums.length >= 2 && nums[nums.length - 1] > 59) return { kind: "invalid" };
  if (nums.length === 3 && nums[1] > 59) return { kind: "invalid" };

  let total: number;
  if (nums.length === 1) {
    total = nums[0] * 60; // số trần = phút
  } else if (nums.length === 2) {
    total = nums[0] * 60 + nums[1];
  } else {
    total = nums[0] * 3600 + nums[1] * 60 + nums[2];
  }

  // 0 (hoặc âm, dù không tới được) bị coi là KHÔNG HỢP LỆ chứ không phải `empty`:
  // backend đọc `0` y hệt "chưa biết", nên gửi nó đi là tái mở đúng khoảng trống C-2.
  if (total <= 0 || total > MAX_SECONDS) return { kind: "invalid" };

  return { kind: "valid", seconds: total };
}

/**
 * Dựng lại chuỗi để nạp vào ô nhập khi mở form sửa.
 *
 * Không đọc được / ≤ 0 → chuỗi rỗng, và chuỗi rỗng khi gửi lại đi qua `parseLessonDuration`
 * ra `empty` → bỏ khoá → backend giữ nguyên. Nghĩa là **xoá ô không xoá được thời lượng
 * đã lưu**; đó là giới hạn đã biết, xem ghi chú ở `VideoDurationField`.
 */
export function formatLessonDuration(seconds: number | null | undefined): string {
  if (typeof seconds !== "number" || !Number.isFinite(seconds) || seconds <= 0) return "";

  const total = Math.floor(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");

  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(secs)}` : `${minutes}:${pad(secs)}`;
}

/**
 * URL này có phải video do hệ thống upload lên không (`/api/hls/{uploadId}/...`).
 *
 * Chỉ dùng để chọn CÂU GỢI Ý trong UI — server mới là bên quyết định thời lượng, và với
 * video upload thì server tự đọc được (`video_uploads.duration`). Đây không phải hàng rào
 * bảo mật nên cố tình dễ dãi: chỉ cần thấy tiền tố `/api/hls/<id>`.
 */
export function isUploadedVideoUrl(url?: string | null): boolean {
  return typeof url === "string" && /\/api\/hls\/[^/?#]+/.test(url);
}
