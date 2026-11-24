/**
 * Dòng phụ dưới tên gói xu (QA5 S20). Gói không có xu tặng từng ghi "Gói xu tiêu chuẩn", đọc như tên một gói
 * khác khi đứng cạnh gói tên "Gói Tiêu chuẩn" (tên gói do admin đặt, không đoán được). Nói đúng điều khác biệt
 * duy nhất của gói: có hay không xu tặng thêm.
 */
export function coinBonusLabel(bonusAmount: number, format: (n: number) => string): string {
  return bonusAmount > 0 ? `Tặng thêm ${format(bonusAmount)} xu` : "Không kèm xu tặng";
}
