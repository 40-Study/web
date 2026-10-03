import { describe, expect, it } from "vitest";
import { buildCsv } from "./csv-export";

describe("buildCsv", () => {
  it("bọc mọi ô trong nháy kép, nhân đôi nháy kép bên trong, có BOM", () => {
    const csv = buildCsv([["Tên", "Ghi chú"], ['Lê "Văn" C', "a,b"]]);
    expect(csv.startsWith("﻿")).toBe(true);
    expect(csv).toBe('﻿"Tên","Ghi chú"\r\n"Lê ""Văn"" C","a,b"');
  });

  it("vô hiệu hoá ô chuỗi bắt đầu bằng ký tự công thức (CSV injection)", () => {
    const csv = buildCsv([["=HYPERLINK(\"http://x\")", "+1", "-1", "@SUM(A1)", "bình thường"]]);
    expect(csv).toBe('﻿"\'=HYPERLINK(""http://x"")","\'+1","\'-1","\'@SUM(A1)","bình thường"');
  });

  it("giữ nguyên số (kể cả số âm) và ô rỗng", () => {
    expect(buildCsv([[-150000, 0, null, undefined]])).toBe('﻿"-150000","0","",""');
  });
});
