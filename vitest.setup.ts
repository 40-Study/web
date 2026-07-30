/**
 * Vitest setup — chạy trước mọi test file.
 *
 * KHÔNG bật `globals: true` trong vitest.config.ts, nên mọi API phải import
 * tường minh (describe/it/expect trong test file, afterEach ở đây).
 * Đổi lại không phải thêm "vitest/globals" vào tsconfig.json `types`.
 */

import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// Không bật globals -> auto-cleanup của testing-library không tự đăng ký
afterEach(() => {
  cleanup();
});

// Hầu hết component dùng next/navigation; jsdom không có router -> mock sẵn
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
  redirect: vi.fn(),
  notFound: vi.fn(),
}));

// jsdom thiếu matchMedia — nhiều component responsive gọi tới
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }),
});
