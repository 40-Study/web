/**
 * Chốt contract certificate.service vs backend DTO.
 *
 * Bối cảnh: service này từng được viết theo contract ĐOÁN — `pdf_url`,
 * `course.title` lồng, `holder_name`, `certificates[]`. TypeScript vẫn pass vì
 * service tự nhất quán nội bộ, nên bug chỉ lộ ở runtime dưới dạng `undefined`.
 * Test này giữ shape khớp với:
 *   internal/dto/certificateDTO.go (backend @ 6ca6179)
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-client", async () => {
  const { mockApi } = await import("@/test/mock-api");
  return { api: mockApi };
});

import { certificateService } from "@/services/certificate.service";
import { envelope, mockApi, resetMockApi } from "@/test/mock-api";

const CERT = {
  id: "c1",
  user_id: "u1",
  user_name: "Nguyễn Văn A",
  course_id: "co1",
  course_name: "Lập trình Go",
  enrollment_id: "e1",
  certificate_number: "CERT-2026-0001",
  certificate_url: undefined,
  issued_at: "2026-07-30T00:00:00Z",
  created_at: "2026-07-30T00:00:00Z",
};

beforeEach(() => {
  resetMockApi();
});

describe("certificateService.list", () => {
  it("gọi GET /certificates và truyền params phân trang", async () => {
    mockApi.get.mockResolvedValue(
      envelope({ data: [CERT], total: 1, page: 1, page_size: 20 })
    );

    await certificateService.list({ page: 1, page_size: 20 });

    expect(mockApi.get).toHaveBeenCalledWith("/certificates", {
      params: { page: 1, page_size: 20 },
    });
  });

  it("trả mảng ở field `data`, KHÔNG phải `certificates`", async () => {
    mockApi.get.mockResolvedValue(
      envelope({ data: [CERT], total: 1, page: 1, page_size: 20 })
    );

    const res = await certificateService.list();

    // Guard chính: backend CertificateListDTO dùng `data`
    expect(res.data).toHaveLength(1);
    expect(res).not.toHaveProperty("certificates");
    expect(res.total).toBe(1);
  });
});

describe("certificateService.verify", () => {
  it("gọi đúng endpoint public kèm số chứng chỉ", async () => {
    mockApi.get.mockResolvedValue(
      envelope({ valid: true, certificate_number: "CERT-2026-0001" })
    );

    await certificateService.verify("CERT-2026-0001");

    expect(mockApi.get).toHaveBeenCalledWith(
      "/certificates/verify/CERT-2026-0001"
    );
  });

  it("trả field PHẲNG user_name/course_name, không phải holder_name/course_title", async () => {
    mockApi.get.mockResolvedValue(
      envelope({
        valid: true,
        certificate_number: "CERT-2026-0001",
        user_name: "Nguyễn Văn A",
        course_name: "Lập trình Go",
        issued_at: "2026-07-30T00:00:00Z",
      })
    );

    const res = await certificateService.verify("CERT-2026-0001");

    // Guard chính: VerifyCertificateResponseDTO là phẳng
    expect(res.user_name).toBe("Nguyễn Văn A");
    expect(res.course_name).toBe("Lập trình Go");
    expect(res).not.toHaveProperty("holder_name");
    expect(res).not.toHaveProperty("course_title");
    expect(res).not.toHaveProperty("certificate");
  });

  it("số không hợp lệ -> valid false, không có thông tin người học", async () => {
    mockApi.get.mockResolvedValue(
      envelope({ valid: false, certificate_number: "SAI" })
    );

    const res = await certificateService.verify("SAI");

    expect(res.valid).toBe(false);
    expect(res.user_name).toBeUndefined();
  });
});

describe("certificateService.issue", () => {
  it("POST /certificates với course_id + enrollment_id", async () => {
    mockApi.post.mockResolvedValue(envelope(CERT));

    const res = await certificateService.issue({
      course_id: "co1",
      enrollment_id: "e1",
    });

    expect(mockApi.post).toHaveBeenCalledWith("/certificates", {
      course_id: "co1",
      enrollment_id: "e1",
    });
    expect(res.certificate_number).toBe("CERT-2026-0001");
  });
});

describe("certificateService.getById", () => {
  it("GET /certificates/:id và trả field phẳng", async () => {
    mockApi.get.mockResolvedValue(envelope(CERT));

    const res = await certificateService.getById("c1");

    expect(mockApi.get).toHaveBeenCalledWith("/certificates/c1");
    expect(res.course_name).toBe("Lập trình Go");
    expect(res).not.toHaveProperty("pdf_url");
  });
});
