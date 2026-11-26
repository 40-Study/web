/** QA8 C23 (A04): 400 ERR_ROLE_NOT_ASSIGNABLE hiện câu tiếng Việt, không lộ message tiếng Anh của backend. */
import { describe, expect, it } from "vitest";
import { ApiError } from "./errors";
import { getErrorMessage } from "./error-messages";

describe("getErrorMessage — QA8 admin", () => {
  it("400 ERR_ROLE_NOT_ASSIGNABLE", () => {
    const message = getErrorMessage(new ApiError(400, "ERR_ROLE_NOT_ASSIGNABLE", "role is org scoped"));
    expect(message).toContain("gán theo từng tổ chức");
    expect(message).not.toContain("org scoped");
  });
});
