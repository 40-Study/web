import { describe, expect, it } from "vitest";
import { attendanceSessionLabel } from "./attendance-session-label";

describe("attendanceSessionLabel (S5-14)", () => {
  it("lớp và buổi nối bằng ' · '", () => {
    expect(attendanceSessionLabel({ class_name: "Python K12", session_title: "Buổi 3" })).toBe("Python K12 · Buổi 3");
  });
  it("chỉ có một trong hai", () => {
    expect(attendanceSessionLabel({ class_name: "Python K12" })).toBe("Python K12");
    expect(attendanceSessionLabel({ session_title: "Buổi 3" })).toBe("Buổi 3");
  });
  it("thiếu hoặc rỗng -> null", () => {
    expect(attendanceSessionLabel({})).toBeNull();
    expect(attendanceSessionLabel({ class_name: "  ", session_title: "" })).toBeNull();
  });
});
