import { describe, expect, it } from "vitest";
import { getInitials } from "./initials";

describe("getInitials (Q8-PG-09)", () => {
  it("lấy chữ đầu của từ đầu và từ cuối", () => {
    expect(getInitials("Hoàng Văn E")).toBe("HE");
    expect(getInitials("Nguyễn Thị Lan")).toBe("NL");
    expect(getInitials("Lê Minh")).toBe("LM");
  });

  it("một từ: hai chữ đầu; chữ cái đơn giữ nguyên (nơi gọi cũ truyền sẵn một chữ)", () => {
    expect(getInitials("admin")).toBe("AD");
    expect(getInitials("L")).toBe("L");
    expect(getInitials("Đạt")).toBe("ĐẠ");
  });

  it("chữ có dấu tổ hợp (NFD) vẫn là một chữ, và viết hoa đúng", () => {
    expect(getInitials("an".normalize("NFD"))).toBe("AN");
    expect(getInitials("ơn".normalize("NFD") + " ân".normalize("NFD"))).toBe("ƠÂ");
  });

  it("khoảng trắng thừa và giá trị rỗng", () => {
    expect(getInitials("  Trần   Bảo  ")).toBe("TB");
    expect(getInitials("")).toBe("?");
    expect(getInitials(undefined)).toBe("?");
    expect(getInitials(null)).toBe("?");
  });
});
