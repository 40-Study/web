import { toast } from "sonner";
import { describe, expect, it, vi } from "vitest";
import { ApiError, AuthError, NetworkError, NotFoundError } from "./errors";
import { queryClient, shouldRetryQuery } from "./query-client";

function runDefaultMutationOnError(error: unknown) {
  const onError = queryClient.getDefaultOptions().mutations?.onError as (err: unknown) => void;
  onError(error);
}

// N9 / P-N1 (QA học viên + phụ huynh 260928): toast mặc định hiện "Error" + "incorrect current
// password". Khoá lại: tiêu đề và mô tả đều tiếng Việt, không lọt chuỗi backend tiếng Anh.
describe("query-client — toast lỗi mutation mặc định", () => {
  it("lỗi 400 tiếng Anh -> tiêu đề + mô tả tiếng Việt", () => {
    const toastError = vi.spyOn(toast, "error").mockImplementation(() => "" as never);

    runDefaultMutationOnError(new ApiError(400, "UNKNOWN", "incorrect current password"));

    expect(toastError).toHaveBeenCalledWith("Không thể thực hiện thao tác", {
      description: "Mật khẩu hiện tại không đúng",
    });
    const shown = JSON.stringify(toastError.mock.calls);
    expect(shown).not.toContain("incorrect current password");
    expect(shown).not.toMatch(/"Error"|Something went wrong/);
  });

  it("mất mạng -> 'Mất kết nối', không phải 'Connection lost'", () => {
    const toastError = vi.spyOn(toast, "error").mockImplementation(() => "" as never);

    runDefaultMutationOnError(new NetworkError());

    expect(toastError.mock.calls[0][0]).toBe("Mất kết nối");
    expect(JSON.stringify(toastError.mock.calls)).not.toContain("Connection lost");
  });

  it("lỗi không phải ApiError (message tiếng Anh) -> câu chung tiếng Việt", () => {
    const toastError = vi.spyOn(toast, "error").mockImplementation(() => "" as never);

    runDefaultMutationOnError(new Error("Request failed with status code 418"));

    expect(toastError).toHaveBeenCalledWith("Không thể thực hiện thao tác", {
      description: "Có lỗi xảy ra, vui lòng thử lại",
    });
  });
});

describe("query-client — không retry lỗi 4xx (N13: slug sai quay 5 giây, 7 request)", () => {
  it("404/400/401 không retry; 5xx và mất mạng vẫn retry tối đa 2 lần", () => {
    expect(shouldRetryQuery(0, new NotFoundError())).toBe(false);
    expect(shouldRetryQuery(0, new ApiError(400, "UNKNOWN", "bad"))).toBe(false);
    expect(shouldRetryQuery(0, new AuthError())).toBe(false);
    expect(shouldRetryQuery(0, new ApiError(503, "UNKNOWN", "x"))).toBe(true);
    expect(shouldRetryQuery(1, new NetworkError())).toBe(true);
    expect(shouldRetryQuery(2, new NetworkError())).toBe(false);
  });
});
