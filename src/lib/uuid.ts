const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Có đúng dạng UUID chuẩn 8-4-4-4-12 (không phân biệt hoa/thường) không. Backend `uuid.Parse` trả 400 cho mọi dạng khác. */
export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}
