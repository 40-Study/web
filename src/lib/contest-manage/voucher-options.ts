import { formatVnDateTime } from "@/lib/vn-datetime";

interface VoucherLike {
  id: string;
  name: string;
  code: string;
  end_date?: string | null;
}

export interface ContestVoucherOption {
  id: string;
  label: string;
  disabled?: boolean;
}

/**
 * Lựa chọn voucher cho cơ cấu giải cuộc thi (QA-C-22). Voucher được phát lúc CHỐT kết quả, tức sau khi cuộc thi kết
 * thúc, nên voucher hết hạn trước `contestEndTime` sẽ đến tay người thắng ở dạng không dùng được (vd BACKTOSCHOOL30
 * hết hạn 16/09 nhưng hiện cho cuộc thi 24/11). Những voucher đó vẫn hiện để admin hiểu vì sao không chọn được,
 * nhưng bị khoá kèm lý do. Voucher đang gắn nhưng đã tắt (không có trong danh sách đang bật) vẫn được thêm vào để ô
 * chọn không trống.
 */
export function buildContestVoucherOptions(
  activeVouchers: VoucherLike[],
  contestEndTime: string | null | undefined,
  attached: VoucherLike[]
): ContestVoucherOption[] {
  const end = contestEndTime ? new Date(contestEndTime).getTime() : NaN;
  const expiresBeforeEnd = (v: VoucherLike) => {
    if (!v.end_date || !Number.isFinite(end)) return false;
    const voucherEnd = new Date(v.end_date).getTime();
    return Number.isFinite(voucherEnd) && voucherEnd < end;
  };

  const options: ContestVoucherOption[] = activeVouchers.map((v) =>
    expiresBeforeEnd(v)
      ? { id: v.id, label: `${v.name} (${v.code}) — Hết hạn ${formatVnDateTime(v.end_date)}, trước khi cuộc thi kết thúc`, disabled: true }
      : { id: v.id, label: `${v.name} (${v.code})` }
  );
  for (const v of attached) {
    if (!options.some((o) => o.id === v.id)) {
      options.push({ id: v.id, label: `${v.name} (${v.code}) — không còn hoạt động` });
    }
  }
  return options;
}
