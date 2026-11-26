/**
 * MỘT cách tính chữ viết tắt tên cho mọi avatar (Q8-PG-09). Trước đây mỗi nơi tự cắt: `slice(0, 2)` của họ tên khiến mọi
 * người họ "Nguyễn" đều là "NG", còn thẻ phụ huynh/con lại chỉ lấy MỘT chữ ("L"), nên cùng một người trông khác nhau theo trang.
 *
 * Quy tắc: từ có chữ đầu tiên + từ cuối ("Hoàng Văn E" -> "HE", "Nguyễn Thị Lan" -> "NL"); một từ duy nhất thì lấy hai chữ
 * đầu ("admin" -> "AD", "L" -> "L") — khớp hành vi cũ của Avatar với tên một từ, nên chữ cái đơn các nơi gọi đã truyền vào vẫn nguyên.
 */
const FALLBACK = "?";

function firstChar(word: string): string {
  return Array.from(word.normalize("NFC"))[0] ?? "";
}

export function getInitials(name: string | null | undefined): string {
  const words = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return FALLBACK;
  if (words.length === 1) return Array.from(words[0].normalize("NFC")).slice(0, 2).join("").toLocaleUpperCase("vi-VN");
  return (firstChar(words[0]) + firstChar(words[words.length - 1])).toLocaleUpperCase("vi-VN");
}
