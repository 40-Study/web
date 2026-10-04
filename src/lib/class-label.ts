/**
 * "Lớp <tên>" mà không lặp chữ "Lớp" khi tên lớp đã tự mở đầu bằng "Lớp" (dữ liệu thật có lớp tên
 * "Lớp Flutter Mobile K5" nên ghép cứng ra "Lớp Lớp Flutter..." — QA B-17).
 */
export function withClassPrefix(className: string): string {
  const name = className.trim();
  return /^lớp\b/i.test(name) ? name : `Lớp ${name}`;
}