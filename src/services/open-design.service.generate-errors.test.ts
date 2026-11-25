/** Q6 #130: lỗi 5xx của /open-design/generate hiện cho giảng viên, không được chứa chỉ dẫn vận hành. */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-client", async () => {
  const { mockApi } = await import("@/test/mock-api");
  return { api: mockApi };
});

import { ApiError } from "@/lib/errors";
import { mockApi, resetMockApi } from "@/test/mock-api";
import { openDesignService } from "./open-design.service";

const OPS = /endpoint|model|API key|cấu hình|backend/i;

async function generateFailing(status: number): Promise<string> {
  mockApi.post.mockRejectedValue(new ApiError(status, "ERR_X", "boom"));
  const input = {} as Parameters<typeof openDesignService.generate>[0];
  return openDesignService.generate(input, new AbortController().signal).then(
    () => "",
    (e: Error) => e.message
  );
}

describe("openDesignService.generate: lỗi 5xx", () => {
  beforeEach(() => resetMockApi());

  it.each([502, 503, 504])("%i: câu chữ cho giảng viên, không có chỉ dẫn vận hành", async (status) => {
    const message = await generateFailing(status);
    expect(message).not.toBe("");
    expect(message).not.toMatch(OPS);
  });

  it("503 khuyên thử lại hoặc liên hệ quản trị viên; 504 nói AI phản hồi quá lâu", async () => {
    expect(await generateFailing(503)).toContain("liên hệ quản trị viên");
    expect(await generateFailing(504)).toContain("quá lâu");
  });
});
