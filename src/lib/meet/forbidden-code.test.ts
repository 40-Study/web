import { describe, expect, it } from "vitest";
import { forbiddenFlagsFromCode } from "./forbidden-code";

/**
 * I4 (review vòng 2 web PR #18): reviewer đã chứng minh bằng mutation — ép
 * `isNotMember = false` ở nhánh phân loại 403 mà 133 test vẫn xanh. Test này
 * phủ đúng 3 cờ suy từ mã 403 uy quyền (issue #58 review vòng 2, §7.4).
 */
describe("forbiddenFlagsFromCode (I4)", () => {
  it("NOT_SESSION_MEMBER => chỉ isNotMember", () => {
    expect(forbiddenFlagsFromCode("NOT_SESSION_MEMBER")).toEqual({
      isNotMember: true,
      isKicked: false,
      isLocked: false,
    });
  });

  it("KICKED => chỉ isKicked", () => {
    expect(forbiddenFlagsFromCode("KICKED")).toEqual({
      isNotMember: false,
      isKicked: true,
      isLocked: false,
    });
  });

  it("WHITEBOARD_LOCKED => chỉ isLocked", () => {
    expect(forbiddenFlagsFromCode("WHITEBOARD_LOCKED")).toEqual({
      isNotMember: false,
      isKicked: false,
      isLocked: true,
    });
  });

  it("mã khác (NOT_SESSION_HOST, CANNOT_KICK_HOST, FORBIDDEN) => cả 3 cờ false", () => {
    for (const code of ["NOT_SESSION_HOST", "CANNOT_KICK_HOST", "FORBIDDEN"]) {
      expect(forbiddenFlagsFromCode(code)).toEqual({
        isNotMember: false,
        isKicked: false,
        isLocked: false,
      });
    }
  });

  it("undefined/null => cả 3 cờ false (lỗi không phải 403 uy quyền)", () => {
    expect(forbiddenFlagsFromCode(undefined)).toEqual({
      isNotMember: false,
      isKicked: false,
      isLocked: false,
    });
    expect(forbiddenFlagsFromCode(null)).toEqual({
      isNotMember: false,
      isKicked: false,
      isLocked: false,
    });
  });
});
