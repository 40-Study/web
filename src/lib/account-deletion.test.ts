import { describe, expect, it } from "vitest";
import { deleteAccountErrorMessage, hasTeacherRole, isDeleteAccountPasswordError } from "./account-deletion";
import { ApiError, NetworkError } from "./errors";
import { getErrorMessage } from "./error-messages";

describe("deleteAccountErrorMessage (Q8-T10, C22)", () => {
  it("409 ERR_ACCOUNT_HAS_BALANCE với message tiếng Anh: câu tiếng Việt nói về số dư/yêu cầu rút, không lộ tiếng Anh", () => {
    const msg = deleteAccountErrorMessage(new ApiError(409, "ERR_ACCOUNT_HAS_BALANCE", "wallet has balance"));
    expect(msg).toMatch(/số dư trong ví hoặc yêu cầu rút tiền/);
    expect(msg).not.toMatch(/wallet has balance/);
  });

  it("message tiếng Việt của backend (nói rõ do số dư hay do yêu cầu rút) được ưu tiên", () => {
    const backend = "Ví còn số dư 438.200đ. Hãy rút hết trước khi xoá tài khoản.";
    expect(getErrorMessage(new ApiError(409, "ERR_ACCOUNT_HAS_BALANCE", backend))).toBe(backend);
  });

  it("lỗi khác (sai mật khẩu 401/400): giữ câu 'kiểm tra lại mật khẩu'", () => {
    expect(deleteAccountErrorMessage(new ApiError(400, "ERR_VALIDATION", "invalid password"))).toMatch(/kiểm tra lại mật khẩu/);
    expect(deleteAccountErrorMessage(new Error("x"))).toMatch(/kiểm tra lại mật khẩu/);
  });
});

describe("deleteAccountErrorMessage, lỗi không phải do mật khẩu (Q8 review L4)", () => {
  it("5xx và mất mạng không đổ lỗi cho mật khẩu", () => {
    expect(deleteAccountErrorMessage(new ApiError(500, "INTERNAL", "boom"))).not.toMatch(/mật khẩu/);
    expect(deleteAccountErrorMessage(new NetworkError())).not.toMatch(/mật khẩu/);
  });
});

describe("hasTeacherRole", () => {
  it("TEACHER và ORG_TEACHER là giảng viên; học viên/phụ huynh/chủ tổ chức thì không", () => {
    expect(hasTeacherRole([{ role_name: "STUDENT" }, { role_name: "TEACHER" }])).toBe(true);
    expect(hasTeacherRole([{ role_name: "ORG_TEACHER" }])).toBe(true);
    expect(hasTeacherRole([{ role_name: "STUDENT" }, { role_name: "PARENT" }, { role_name: "ORG_OWNER" }])).toBe(false);
  });
});

describe("isDeleteAccountPasswordError (Q9-PG-05, review #142 M1)", () => {
  it("ERR_INVALID_PASSWORD là sai mật khẩu (gắn vào ô nhập)", () => {
    expect(isDeleteAccountPasswordError(new ApiError(400, "ERR_INVALID_PASSWORD", "invalid password"))).toBe(true);
  });

  it("backend cũ: 400 không mã kèm message 'invalid password' cũng là sai mật khẩu", () => {
    expect(isDeleteAccountPasswordError(new ApiError(400, "ERR_VALIDATION", "invalid password"))).toBe(true);
  });

  it("400 khác (lỗi DB, không tìm thấy user), 401, 403: KHÔNG phải sai mật khẩu, vẫn toast", () => {
    expect(isDeleteAccountPasswordError(new ApiError(400, "ERR_VALIDATION", "failed to deactivate account: db down"))).toBe(false);
    expect(isDeleteAccountPasswordError(new ApiError(400, "ERR_VALIDATION", "failed to find user"))).toBe(false);
    expect(isDeleteAccountPasswordError(new ApiError(401, "ACCOUNT_LOCKED", "locked"))).toBe(false);
    expect(isDeleteAccountPasswordError(new ApiError(401, "ERR_UNAUTHORIZED", "invalid password"))).toBe(false);
    expect(isDeleteAccountPasswordError(new ApiError(403, "ERR_FORBIDDEN", "invalid password"))).toBe(false);
  });

  it("số dư (409), 5xx, mất mạng và lỗi lạ không phải sai mật khẩu (vẫn do toast báo)", () => {
    expect(isDeleteAccountPasswordError(new ApiError(409, "ERR_ACCOUNT_HAS_BALANCE", "x"))).toBe(false);
    expect(isDeleteAccountPasswordError(new ApiError(400, "ERR_ACCOUNT_HAS_BALANCE", "x"))).toBe(false);
    expect(isDeleteAccountPasswordError(new ApiError(500, "ERR_INTERNAL", "x"))).toBe(false);
    expect(isDeleteAccountPasswordError(new NetworkError())).toBe(false);
    expect(isDeleteAccountPasswordError(new Error("x"))).toBe(false);
  });
});
