/**
 * Gom nhiều query của một trang thành MỘT trạng thái "dữ liệu cũ" (Q10 #148 M3): một `StaleDataNotice` cho cả trang
 * thay vì mỗi widget một thanh cam + một live region khi backend sập.
 *
 * "Cũ" = query lỗi MÀ còn dữ liệu cache (`data !== undefined`; danh sách rỗng đã cache vẫn là dữ liệu hợp lệ). Query lỗi
 * mà chưa có dữ liệu không thuộc đây: widget của nó tự hiện hộp lỗi đầy đủ.
 */
export interface StaleCheckableQuery {
  isError: boolean;
  data: unknown;
  refetch: () => Promise<unknown>;
}

/** Có dữ liệu cache hay chưa (`data !== undefined`). Một danh sách rỗng đã cache là CÓ dữ liệu. */
export function hasCachedData(data: unknown): boolean {
  return data !== undefined;
}

export function staleQueries(queries: readonly StaleCheckableQuery[]): { isStale: boolean; retry: () => Promise<unknown> } {
  const stale = queries.filter((query) => query.isError && hasCachedData(query.data));
  return {
    isStale: stale.length > 0,
    // Chỉ làm mới đúng các query đang lỗi, trả Promise để nút "Thử lại" hiện trạng thái bận.
    retry: () => Promise.all(stale.map((query) => query.refetch())),
  };
}
