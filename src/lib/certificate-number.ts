/**
 * Mã chứng chỉ lấy từ URL `/certificates/verify/<mã>` (Q9-PG-09). Mã dán vào thường kèm khoảng trắng đầu/cuối, và
 * Next truyền `params` còn dạng percent-encoded ("CERT-1%20"), nên nếu đem thẳng đi `encodeURIComponent` thì thành
 * "%2520" (mã mã hoá hai lần) và backend không tìm thấy. Giải mã một lần rồi cắt khoảng trắng; mã không giải mã được
 * (có "%" lẻ) giữ nguyên chuỗi gốc đã cắt khoảng trắng.
 */
export function normalizeCertificateNumber(raw: string): string {
  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    // "%" lẻ không phải percent-encoding hợp lệ: coi như ký tự thường, không lỗi trang.
  }
  return decoded.trim();
}
