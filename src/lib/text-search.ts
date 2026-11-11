/**
 * Chuẩn hoá chuỗi để tìm không dấu, không phân biệt hoa thường: "Rút tiền" và "rut TIEN" cùng thành "rut tien".
 * "đ" không tách được bằng NFD nên phải thay riêng, và thay SAU khi lowercase để bắt cả "Đ".
 */
export function foldSearchText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/đ/g, "d")
    .replace(/\s+/g, " ")
    .trim();
}

export interface SearchableItem {
  label: string;
  description?: string;
  /** Từ khoá phụ không hiện ra UI (vd. "hoan tien" cho mục Đơn hàng). */
  keywords?: readonly string[];
}

/**
 * Lọc mục theo truy vấn: mọi từ trong truy vấn phải xuất hiện trong label, description hoặc keywords.
 * Mục khớp ngay trong label xếp trước, còn lại giữ đúng thứ tự menu. Truy vấn rỗng trả cả danh sách.
 */
export function filterByQuery<T extends SearchableItem>(items: readonly T[], query: string): T[] {
  const tokens = foldSearchText(query).split(" ").filter(Boolean);
  if (tokens.length === 0) return [...items];

  const containsAll = (text: string) => {
    const folded = foldSearchText(text);
    return tokens.every((token) => folded.includes(token));
  };
  const matches = items.filter((item) =>
    containsAll([item.label, item.description ?? "", ...(item.keywords ?? [])].join(" "))
  );
  const inLabel = matches.filter((item) => containsAll(item.label));
  return [...inLabel, ...matches.filter((item) => !inLabel.includes(item))];
}
