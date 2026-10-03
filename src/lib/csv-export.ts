/**
 * Xuất CSV phía trình duyệt, dùng chung cho các nút "Xuất CSV" (danh sách học viên, ví giảng viên).
 * File là CSV thật, nên nhãn nút phải ghi "CSV" chứ không phải "Excel" (B-07, QA hồi quy 03/10).
 */

export type CsvCell = string | number | null | undefined;

/**
 * Ô văn bản bắt đầu bằng = + - @ (hoặc tab/CR) bị Excel/Sheets hiểu là công thức. Tên học viên và
 * tên khoá do người dùng nhập nên có thể bị lợi dụng chèn công thức; thêm dấu nháy đơn phía trước để
 * ô luôn là chữ. Số thật (kiểu number) không đụng tới nên số âm vẫn là số.
 */
function neutralizeFormula(text: string): string {
  return /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
}

function escapeCell(cell: CsvCell): string {
  const text = typeof cell === "number" ? String(cell) : neutralizeFormula(cell ?? "");
  // Nháy kép trong dữ liệu phải nhân đôi, nếu không 1 tên có dấu " làm lệch cả dòng CSV.
  return `"${text.replace(/"/g, '""')}"`;
}

/** Ghép các dòng thành chuỗi CSV (CRLF), có BOM để Excel đọc đúng tiếng Việt. */
export function buildCsv(rows: CsvCell[][]): string {
  return `﻿${rows.map((row) => row.map(escapeCell).join(",")).join("\r\n")}`;
}

/** Tải chuỗi CSV về máy với tên file cho trước. */
export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
