/**
 * PG-M1 (QA2 261013): og:title là "ForteX — Learn Leap Lead" ở MỌI trang vì trang con chỉ đặt `title`, không
 * đặt `openGraph`/`alternates` -> xem trước khi chia sẻ link giống hệt nhau toàn site và thiếu canonical.
 * Test này đi qua `metadata` thật của từng layout/trang công khai.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { metadata as rootMetadata } from "../layout";
import { metadata as catalogMetadata } from "../(main)/courses/layout";
import { metadata as discussionsMetadata } from "../(main)/discussions/layout";
import { metadata as helpMetadata } from "../(main)/help/layout";
import { metadata as verifyMetadata } from "../(main)/certificates/verify/layout";
import { metadata as termsMetadata } from "../(main)/terms/page";
import { metadata as privacyMetadata } from "../(main)/privacy/page";

// Root layout gọi next/font/google lúc import — chỉ chạy được trong build Next, nên giả lập ở đây.
vi.mock("next/font/google", () => ({
  Inter: () => ({ variable: "font-inter" }),
  Plus_Jakarta_Sans: () => ({ variable: "font-heading" }),
}));
vi.mock("@/lib/server-fetchers/discussion", () => ({ getDiscussionBySlugServer: vi.fn() }));
import { getDiscussionBySlugServer } from "@/lib/server-fetchers/discussion";
import { generateMetadata as discussionDetailMetadata } from "../(main)/discussions/[slug]/layout";

const OG_SITE_DEFAULT_TITLE = "ForteX — Learn Leap Lead";

const publicPages = [
  ["/courses", catalogMetadata],
  ["/discussions", discussionsMetadata],
  ["/help", helpMetadata],
  ["/certificates/verify", verifyMetadata],
  ["/terms", termsMetadata],
  ["/privacy", privacyMetadata],
] as const;

describe.each(publicPages)("trang công khai %s", (path, metadata) => {
  it("có og:title/og:description riêng (không phải mặc định toàn site)", () => {
    const og = metadata.openGraph as { title?: string; description?: string; url?: string } | undefined;
    expect(og?.title).toBeTruthy();
    expect(og?.title).not.toBe(OG_SITE_DEFAULT_TITLE);
    expect(og?.title).toBe(metadata.title);
    expect(og?.description).toBe(metadata.description);
    expect(og?.url).toMatch(new RegExp(`${path}$`));
  });

  it("có canonical đúng path", () => {
    expect(metadata.alternates?.canonical).toBe(path);
  });
});

describe("root layout", () => {
  it("canonical tương đối './' để trang không tự khai báo (landing, thảo luận chi tiết, trang giảng viên) có canonical tự tham chiếu", () => {
    expect(rootMetadata.alternates?.canonical).toBe("./");
  });
});

describe("/discussions/[slug] generateMetadata", () => {
  beforeEach(() => vi.mocked(getDiscussionBySlugServer).mockReset());

  it("og:title = tiêu đề bài, mô tả = trích đoạn nội dung thuần chữ, canonical theo slug", async () => {
    vi.mocked(getDiscussionBySlugServer).mockResolvedValue({
      title: "Tìm bạn làm đồ án",
      content: "<p>Nhóm mình cần <b>frontend</b> Next.js</p>",
    });
    const meta = await discussionDetailMetadata({ params: { slug: "tim-ban" } });
    expect(meta.title).toBe("Tìm bạn làm đồ án");
    expect((meta.openGraph as { title?: string }).title).toBe("Tìm bạn làm đồ án");
    expect(meta.description).toBe("Nhóm mình cần frontend Next.js");
    expect(meta.alternates?.canonical).toBe("/discussions/tim-ban");
  });

  it("không lấy được bài (404/backend chết): metadata chung của mục, không ném lỗi", async () => {
    vi.mocked(getDiscussionBySlugServer).mockResolvedValue(null);
    const meta = await discussionDetailMetadata({ params: { slug: "khong-co" } });
    expect(meta.title).toBe("Thảo luận");
    expect(meta.alternates?.canonical).toBe("/discussions/khong-co");
  });
});
