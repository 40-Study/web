import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { categoryService } from "@/services/category.service";
import { useCategories } from "./use-courses";

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

// A-01 (QA hồi quy 03/10): chip "Lập trình Web" lọc ra 0 khoá vì slug chip tự sinh từ tên
// ("lập-trình-web", còn dấu) trong khi khoá mang category.slug của backend ("lap-trinh-web").
describe("useCategories — slug lấy từ API, không tự sinh từ tên", () => {
  it("dùng slug backend trả về để khớp với category.slug của khoá học", async () => {
    vi.spyOn(categoryService, "getAll").mockResolvedValue([
      { id: "c1", name: "Lập trình Web", slug: "lap-trinh-web" },
    ] as never);

    const { result } = renderHook(() => useCategories(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.[0].slug).toBe("lap-trinh-web");
  });
});
