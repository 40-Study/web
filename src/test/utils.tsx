/**
 * Test helpers — render component kèm provider thật.
 *
 * `retry: false` + `gcTime: 0` là bắt buộc: mặc định react-query retry 3 lần
 * với backoff, làm test lỗi bị treo tới khi timeout thay vì fail ngay.
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, type RenderOptions } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });
}

export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper"> & { queryClient?: QueryClient }
) {
  const queryClient = options?.queryClient ?? createTestQueryClient();

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }

  return {
    queryClient,
    ...render(ui, { wrapper: Wrapper, ...options }),
  };
}

export * from "@testing-library/react";
