/** Q8-PG-02 (contract C19): 409 ERR_USERNAME_EXISTS luôn ra câu tiếng Việt, kể cả khi message backend là tiếng Anh. */
import { describe, expect, it } from "vitest";
import { getErrorMessage } from "./error-messages";
import { ApiError } from "./errors";
import { USERNAME_TAKEN_MESSAGE } from "./user-name";

describe("getErrorMessage — ERR_USERNAME_EXISTS", () => {
  it("dịch theo mã, không in câu tiếng Anh", () => {
    const message = getErrorMessage(new ApiError(409, "ERR_USERNAME_EXISTS", "username already exists"));
    expect(message).toBe(USERNAME_TAKEN_MESSAGE);
    expect(message).toMatch(/Tên đăng nhập/);
  });
});
