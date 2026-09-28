/**
 * Logic thuần của form cuộc thi (không React): validate + chuyển đổi form ↔ request.
 *
 * Validate phía web trùng luật backend (`contest_validation.go`) để người dùng thấy lỗi ngay trên
 * ô nhập thay vì một 400 chung; backend vẫn là nơi quyết định cuối cùng.
 */

import type { ContestManage, ContestPrizeInput, ContestUpsertRequest } from "@/types/contest";

export const CONTEST_MAX_PRIZES = 10;
export const CONTEST_MAX_PRIZE_RANK = 100;
export const CONTEST_MAX_DURATION_MINUTES = 600;
export const CONTEST_MAX_PARTICIPANTS = 100000;
/** Backend cho chốt khi `now >= end_time + 60s` (ContestFinalizeDelaySeconds). */
export const CONTEST_FINALIZE_DELAY_MS = 60_000;

/** Một dòng giải trong form — số để dạng chuỗi vì gắn với <input>. */
export interface PrizeDraft {
  rank_from: string;
  rank_to: string;
  grant_certificate: boolean;
  voucher_id: string | null;
}

export interface ContestFormValues {
  title: string;
  description: string;
  banner_url: string;
  quiz_id: string;
  /** Form không có ô chọn khoá học; giữ nguyên giá trị cũ khi sửa để không xoá điều kiện khoá học. */
  course_id: string | null;
  /** Giá trị <input type="datetime-local"> (giờ địa phương của trình duyệt), "" = chưa nhập. */
  start_time: string;
  end_time: string;
  duration_minutes: string;
  max_participants: string;
  is_public: boolean;
  certificate_min_percentage: string;
  prizes: PrizeDraft[];
}

export type ContestFormErrors = Partial<Record<keyof ContestFormValues, string>>;

export function emptyContestForm(): ContestFormValues {
  return {
    title: "",
    description: "",
    banner_url: "",
    quiz_id: "",
    course_id: null,
    start_time: "",
    end_time: "",
    duration_minutes: "30",
    max_participants: "0",
    is_public: true,
    certificate_min_percentage: "",
    prizes: [],
  };
}

function toInt(raw: string): number | null {
  const trimmed = raw.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  return Number(trimmed);
}

/**
 * Kiểm cơ cấu giải; trả câu lỗi đầu tiên hoặc null.
 * `allowVoucher=false` (form giảng viên): dòng có voucher bị từ chối — giảng viên không được gắn
 * voucher (backend 403 CONTEST_VOUCHER_ADMIN_ONLY).
 */
export function validatePrizes(prizes: PrizeDraft[], allowVoucher: boolean): string | null {
  if (prizes.length > CONTEST_MAX_PRIZES) return `Tối đa ${CONTEST_MAX_PRIZES} giải.`;
  const ranges: Array<[number, number]> = [];
  for (let i = 0; i < prizes.length; i += 1) {
    const p = prizes[i];
    const label = `Giải ${i + 1}`;
    const from = toInt(p.rank_from);
    const to = toInt(p.rank_to);
    if (from === null || to === null) return `${label}: hạng phải là số nguyên.`;
    if (from < 1) return `${label}: hạng bắt đầu từ 1.`;
    if (to < from) return `${label}: "đến hạng" phải lớn hơn hoặc bằng "từ hạng".`;
    if (to > CONTEST_MAX_PRIZE_RANK) return `${label}: hạng tối đa là ${CONTEST_MAX_PRIZE_RANK}.`;
    if (!allowVoucher && p.voucher_id) return "Chỉ quản trị viên được gắn giải voucher.";
    if (!p.grant_certificate && !p.voucher_id) {
      return `${label}: cần trao chứng nhận hoặc voucher.`;
    }
    ranges.push([from, to]);
  }
  // Hai khoảng [a1,b1], [a2,b2] đã sắp theo a: chồng nhau khi a2 <= b1 (giống backend).
  const sorted = [...ranges].sort((a, b) => a[0] - b[0]);
  for (let i = 1; i < sorted.length; i += 1) {
    if (sorted[i][0] <= sorted[i - 1][1]) return "Các khoảng hạng của giải không được chồng nhau.";
  }
  return null;
}

/**
 * Validate toàn form. `now` truyền vào để test tất định.
 * Luật lịch (contract §2.1): start_time > now và end_time > start_time + duration_minutes.
 */
export function validateContestForm(
  values: ContestFormValues,
  now: Date,
  options: { allowVoucher: boolean }
): ContestFormErrors {
  const errors: ContestFormErrors = {};
  const title = values.title.trim();
  if (title.length < 2 || title.length > 255) errors.title = "Tên cuộc thi từ 2 đến 255 ký tự.";

  if (!values.quiz_id) errors.quiz_id = "Chọn bài trắc nghiệm cho cuộc thi.";

  const banner = values.banner_url.trim();
  if (banner && (!/^https?:\/\/\S+$/i.test(banner) || banner.length > 500)) {
    errors.banner_url = "Ảnh bìa phải là đường dẫn http(s) hợp lệ, tối đa 500 ký tự.";
  }

  const duration = toInt(values.duration_minutes);
  if (duration === null || duration < 1 || duration > CONTEST_MAX_DURATION_MINUTES) {
    errors.duration_minutes = `Thời lượng làm bài từ 1 đến ${CONTEST_MAX_DURATION_MINUTES} phút.`;
  }

  const maxParticipants = toInt(values.max_participants);
  if (maxParticipants === null || maxParticipants > CONTEST_MAX_PARTICIPANTS) {
    errors.max_participants = "Số người tối đa từ 0 (không giới hạn) đến 100000.";
  }

  const start = values.start_time ? new Date(values.start_time) : null;
  const end = values.end_time ? new Date(values.end_time) : null;
  if (!start || Number.isNaN(start.getTime())) {
    errors.start_time = "Chọn giờ bắt đầu.";
  } else if (start.getTime() <= now.getTime()) {
    errors.start_time = "Giờ bắt đầu phải ở tương lai.";
  }
  if (!end || Number.isNaN(end.getTime())) {
    errors.end_time = "Chọn giờ kết thúc.";
  } else if (start && !Number.isNaN(start.getTime())) {
    const minEnd = start.getTime() + (duration ?? 0) * 60_000;
    if (end.getTime() <= minEnd) {
      errors.end_time = "Giờ kết thúc phải sau giờ bắt đầu cộng thời lượng làm bài.";
    }
  }

  const pctRaw = values.certificate_min_percentage.trim();
  if (pctRaw) {
    const pct = Number(pctRaw);
    if (!Number.isFinite(pct) || pct < 0 || pct > 100) {
      errors.certificate_min_percentage = "Ngưỡng chứng nhận từ 0 đến 100 (%).";
    }
  }

  const prizeError = validatePrizes(values.prizes, options.allowVoucher);
  if (prizeError) errors.prizes = prizeError;

  return errors;
}

export function prizeDraftsToInput(prizes: PrizeDraft[]): ContestPrizeInput[] {
  return prizes.map((p) => ({
    rank_from: Number(p.rank_from),
    rank_to: Number(p.rank_to),
    grant_certificate: p.grant_certificate,
    voucher_id: p.voucher_id || null,
  }));
}

/** Chỉ gọi sau khi `validateContestForm` không còn lỗi. */
export function toUpsertRequest(values: ContestFormValues): ContestUpsertRequest {
  const pct = values.certificate_min_percentage.trim();
  return {
    title: values.title.trim(),
    description: values.description.trim() || null,
    banner_url: values.banner_url.trim() || null,
    quiz_id: values.quiz_id,
    course_id: values.course_id,
    start_time: new Date(values.start_time).toISOString(),
    end_time: new Date(values.end_time).toISOString(),
    duration_minutes: Number(values.duration_minutes),
    max_participants: Number(values.max_participants),
    is_public: values.is_public,
    certificate_min_percentage: pct ? Number(pct) : null,
    prizes: prizeDraftsToInput(values.prizes),
  };
}

/** ISO → giá trị cho <input type="datetime-local"> theo giờ địa phương ("YYYY-MM-DDTHH:mm"). */
export function toDateTimeLocal(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function prizesToDrafts(contest: Pick<ContestManage, "prizes">): PrizeDraft[] {
  return contest.prizes.map((p) => ({
    rank_from: String(p.rank_from),
    rank_to: String(p.rank_to),
    grant_certificate: p.grant_certificate,
    voucher_id: p.voucher?.id ?? null,
  }));
}

export function contestToForm(contest: ContestManage): ContestFormValues {
  return {
    title: contest.title,
    description: contest.description ?? "",
    banner_url: contest.banner_url ?? "",
    quiz_id: contest.quiz?.id ?? "",
    course_id: contest.course_id,
    start_time: toDateTimeLocal(contest.start_time),
    end_time: toDateTimeLocal(contest.end_time),
    duration_minutes: String(contest.duration_minutes),
    max_participants: String(contest.max_participants),
    is_public: contest.is_public,
    certificate_min_percentage:
      contest.certificate_min_percentage === null ? "" : String(contest.certificate_min_percentage),
    prizes: prizesToDrafts(contest),
  };
}
