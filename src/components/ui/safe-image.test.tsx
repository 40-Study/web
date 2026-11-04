/**
 * QA3 Q3-01: thumbnail ở host chưa cấu hình cho next/image (vd. MinIO nội bộ http://172.18.0.4:9000) làm cả
 * /teacher/courses và trang khoá sập ("hostname ... is not configured"). SafeImage phải vẽ được, không ném lỗi.
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SafeImage } from "./safe-image";

describe("SafeImage", () => {
  it("host chưa cấu hình: vẽ <img> thường, KHÔNG ném lỗi", () => {
    render(
      <div className="relative">
        <SafeImage src="http://172.18.0.4:9000/bucket/cover.png" alt="Bìa" fill className="object-cover" />
      </div>
    );
    const img = screen.getByAltText("Bìa") as HTMLImageElement;
    expect(img.getAttribute("src")).toBe("http://172.18.0.4:9000/bucket/cover.png");
  });

  it("onError: đổi sang khung thay thế", () => {
    render(<SafeImage src="http://172.18.0.4:9000/bucket/cover.png" alt="Bìa" width={80} height={48} />);
    fireEvent.error(screen.getByAltText("Bìa"));
    expect(screen.queryByAltText("Bìa")).toBeNull();
    expect(screen.getByTestId("safe-image-placeholder")).toBeTruthy();
  });

  it("host https: dùng next/image (có sizes/srcset đã tối ưu) và onError cũng về khung thay thế", () => {
    render(<SafeImage src="https://cdn.example.com/cover.png" alt="Bìa" width={80} height={48} />);
    const img = screen.getByAltText("Bìa");
    expect(img.getAttribute("src")).toContain("/_next/image");
    fireEvent.error(img);
    expect(screen.getByTestId("safe-image-placeholder")).toBeTruthy();
  });

  it("src rỗng: khung thay thế ngay", () => {
    render(<SafeImage src="" alt="Bìa" />);
    expect(screen.getByTestId("safe-image-placeholder")).toBeTruthy();
  });

  it("đổi src sau khi lỗi: thử lại ảnh mới", () => {
    const { rerender } = render(<SafeImage src="http://172.18.0.4:9000/a.png" alt="Bìa" width={80} height={48} />);
    fireEvent.error(screen.getByAltText("Bìa"));
    expect(screen.getByTestId("safe-image-placeholder")).toBeTruthy();
    rerender(<SafeImage src="http://172.18.0.4:9000/b.png" alt="Bìa" width={80} height={48} />);
    expect(screen.getByAltText("Bìa").getAttribute("src")).toBe("http://172.18.0.4:9000/b.png");
  });
});
