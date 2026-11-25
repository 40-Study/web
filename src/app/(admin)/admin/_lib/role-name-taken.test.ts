import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/errors";
import { getErrorMessage } from "@/lib/error-messages";
import { isRoleNameTakenError } from "./role-name-taken";

describe("isRoleNameTakenError (QA7-A02 / C14)", () => {
  it("409 ERR_ROLE_NAME_EXISTS", () => {
    expect(isRoleNameTakenError(new ApiError(409, "ERR_ROLE_NAME_EXISTS", "Tên vai trò đã tồn tại"))).toBe(true);
  });
  it("backend cũ: 400 với message thô 'duplicated key not allowed'", () => {
    expect(isRoleNameTakenError(new ApiError(400, "UNKNOWN", "duplicated key not allowed"))).toBe(true);
  });
  it("lỗi khác không bị nhận nhầm", () => {
    expect(isRoleNameTakenError(new ApiError(400, "ERR_VALIDATION", "Tên quá ngắn"))).toBe(false);
    expect(isRoleNameTakenError(new ApiError(500, "UNKNOWN", "duplicated key not allowed"))).toBe(false);
    expect(isRoleNameTakenError(new Error("duplicated key"))).toBe(false);
    expect(isRoleNameTakenError(undefined)).toBe(false);
  });
});

describe("getErrorMessage — ERR_ROLE_NAME_EXISTS", () => {
  it("message tiếng Việt của backend được ưu tiên; tiếng Anh thì rơi về câu theo mã", () => {
    expect(getErrorMessage(new ApiError(409, "ERR_ROLE_NAME_EXISTS", "Vai trò này đã có, có dấu"))).toBe("Vai trò này đã có, có dấu");
    expect(getErrorMessage(new ApiError(409, "ERR_ROLE_NAME_EXISTS", "role name exists"))).toBe(
      "Tên vai trò đã tồn tại, hãy chọn tên khác."
    );
  });
});
