/**
 * Mock cho `@/lib/api-client` dùng trong test service layer.
 *
 * Cách dùng trong test file — factory async + dynamic import để tránh
 * vấn đề hoisting của `vi.mock` (vi.mock bị đẩy lên trên mọi import):
 *
 *   vi.mock("@/lib/api-client", async () => {
 *     const { mockApi } = await import("@/test/mock-api");
 *     return { api: mockApi };
 *   });
 *   import { mockApi, envelope } from "@/test/mock-api";
 */

import { vi } from "vitest";

export const mockApi = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
};

/**
 * Bọc payload theo envelope backend: mọi handler Fiber trả `{message, data}`,
 * và axios lại bọc thêm một lớp `.data`. Nên service đọc `r.data.data`.
 */
export function envelope<T>(data: T) {
  return { data: { message: "ok", data } };
}

export function resetMockApi() {
  Object.values(mockApi).forEach((fn) => fn.mockReset());
}
