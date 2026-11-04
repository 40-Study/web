/**
 * Gom mọi trang của một API phân trang `{ items, total }` thành một mảng.
 *
 * Danh sách khoá học lọc/sắp xếp phía client nên cần ĐỦ dữ liệu; backend mặc định chỉ trả 20 dòng
 * (clamp `page_size` về 100), nên trước đây /courses chỉ thấy 20/52 khoá (QA3 Q2).
 * Dừng khi gom đủ `total`, khi một trang rỗng, hoặc chạm `MAX_PAGES` (chặn vòng lặp vô hạn nếu
 * backend trả `total` sai) — chạm trần thì ném lỗi, không âm thầm cắt cụt.
 */
export const MAX_PAGE_SIZE = 100;
const MAX_PAGES = 50;

export interface PageResult<T> {
  items: T[];
  total: number;
}

export async function fetchAllPages<T>(
  fetchPage: (page: number, pageSize: number) => Promise<PageResult<T>>,
  pageSize: number = MAX_PAGE_SIZE
): Promise<PageResult<T>> {
  const items: T[] = [];
  let total = 0;
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const result = await fetchPage(page, pageSize);
    total = result.total;
    items.push(...result.items);
    if (result.items.length === 0 || items.length >= total) {
      return { items, total };
    }
  }
  throw new Error(`fetchAllPages: vượt ${MAX_PAGES} trang, dừng để tránh vòng lặp vô hạn`);
}
