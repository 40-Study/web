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

/**
 * Node >= 24 expose sẵn global `localStorage` / `sessionStorage` (Web Storage API).
 * Khi chạy không kèm `--localstorage-file` hợp lệ, Node trả về một object rỗng
 * KHÔNG có getItem/setItem/clear, và object đó che mất Storage thật của jsdom
 * -> test đụng storage ném "window.localStorage.clear is not a function".
 *
 * Cài đè một Storage in-memory hợp chuẩn. Chỉ can thiệp khi phát hiện stub hỏng,
 * nên trên Node cũ (jsdom Storage còn nguyên) setup này là no-op.
 */
function createMemoryStorage(): Storage {
  const entries = new Map<string, string>();
  return {
    get length() {
      return entries.size;
    },
    key: (index: number) => Array.from(entries.keys())[index] ?? null,
    getItem: (key: string) => entries.get(String(key)) ?? null,
    setItem: (key: string, value: string) => {
      entries.set(String(key), String(value));
    },
    removeItem: (key: string) => {
      entries.delete(String(key));
    },
    clear: () => {
      entries.clear();
    },
  } satisfies Storage;
}

for (const name of ["localStorage", "sessionStorage"] as const) {
  const current = (globalThis as Record<string, unknown>)[name] as Partial<Storage> | undefined;
  const isUsable = typeof current?.clear === "function" && typeof current?.getItem === "function";
  if (isUsable) continue;

  const storage = createMemoryStorage();
  Object.defineProperty(globalThis, name, { configurable: true, writable: true, value: storage });
  if (typeof window !== "undefined") {
    Object.defineProperty(window, name, { configurable: true, writable: true, value: storage });
  }
}
