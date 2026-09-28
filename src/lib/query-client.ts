/**
 * React Query client configuration
 */

import { QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError, AuthError, isAccountLockedError, NetworkError, ValidationError } from "./errors";
import { getErrorMessage } from "./error-messages";

/**
 * Lỗi 4xx là kết quả xác định của chính request (sai slug, thiếu quyền, dữ liệu sai): gửi lại
 * vẫn ra đúng lỗi đó. Retry chỉ làm người dùng nhìn skeleton lâu hơn (N13: slug sai quay 5 giây,
 * 7 request) và tốn quota rate-limit. Chỉ retry lỗi mạng / 5xx / 408 (timeout).
 */
export function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (error instanceof AuthError) return false;
  if (error instanceof ApiError && error.status >= 400 && error.status < 500 && error.status !== 408) {
    return false;
  }
  return failureCount < 2;
}

/**
 * Toast mặc định cho mutation không tự bắt lỗi (N9, P-N1, N-13). Trước đây tiêu đề là
 * "Error"/"Connection lost" và mô tả in thẳng message tiếng Anh của backend
 * ("incorrect current password"). Giờ mọi chữ hiển thị đi qua getErrorMessage (lib/error-messages).
 */
export function handleMutationError(error: unknown): void {
  // Validation errors handled by form
  if (error instanceof ValidationError) return;
  // Bị khoá giữa phiên: interceptor phát `fortex:auth-session-expired` -> bootstrap hiện
  // toast tiếng Việt riêng và đưa về /login. Không hiện thêm toast thứ hai.
  if (isAccountLockedError(error)) return;

  if (error instanceof NetworkError) {
    toast.error("Mất kết nối", { description: getErrorMessage(error) });
    return;
  }

  toast.error("Không thể thực hiện thao tác", { description: getErrorMessage(error) });
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: shouldRetryQuery,
      staleTime: 30_000, // 30 seconds
      refetchOnWindowFocus: false,
    },
    mutations: {
      onError: handleMutationError,
    },
  },
});
