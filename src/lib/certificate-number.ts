/**
 * Mã chứng chỉ lấy từ URL `/certificates/verify/<mã>` (Q9-PG-09). Mã dán vào thường kèm khoảng trắng đầu/cuối, và
 * Next truyền `params` còn dạng percent-encoded ("CERT-1%20"), nên nếu đem thẳng đi `encodeURIComponent` thì thành
 * "%2520" (mã mã hoá hai lần) và backend không tìm thấy. Giải mã một lần rồi cắt khoảng trắng; mã không giải mã được
 * (có "%" lẻ) giữ nguyên chuỗi gốc đã cắt khoảng trắng.
 */
/**
 * Q10-PG-05: ký tự vô hình hay đi kèm khi sao chép mã từ app chat — zero-width (U+200B..U+200D), word joiner (U+2060),
 * BOM (U+FEFF) và NBSP (U+00A0). `String.prototype.trim` chỉ cắt BOM/NBSP, không cắt U+200B..U+200D / U+2060.
 */
const INVISIBLE_CERTIFICATE_CHARS = /[\u200B-\u200D\u2060\uFEFF\u00A0]/g;

/** Bỏ ký tự vô hình rồi cắt khoảng trắng đầu/cuối (không giải mã percent). Dùng cho ô nhập tay. */
export function cleanCertificateNumber(raw: string): string {
  return raw.replace(INVISIBLE_CERTIFICATE_CHARS, "").trim();
}

export function normalizeCertificateNumber(raw: string): string {
  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    // "%" lẻ không phải percent-encoding hợp lệ: coi như ký tự thường, không lỗi trang.
  }
  return cleanCertificateNumber(decoded);
}
