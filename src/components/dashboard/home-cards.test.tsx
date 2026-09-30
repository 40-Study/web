import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import { ContinueLearningCard } from "./continue-learning-card";
import { XPProgressCard } from "./xp-progress-card";

const baseCourse = {
  slug: "toan-9",
  title: "Toán 9",
  completedLessons: 4,
  totalLessons: 24,
  progress: 42,
};

describe("ContinueLearningCard thumbnail", () => {
  it("renders the BookOpen fallback in the same box when there is no thumbnail", () => {
    const html = renderToStaticMarkup(<ContinueLearningCard course={baseCourse} />);
    expect(html).toContain("aspect-video");
    expect(html).toContain("bg-slate-100");
    expect(html).toContain("dark:bg-slate-800");
    expect(html).toContain("lucide-book-open");
    expect(html).not.toContain("<img");
  });

  it("renders an object-cover image when a thumbnail exists", () => {
    const html = renderToStaticMarkup(
      <ContinueLearningCard course={{ ...baseCourse, thumbnail: "/t.png" }} />
    );
    expect(html).toContain("<img");
    expect(html).toContain("object-cover");
    expect(html).not.toContain("lucide-book-open");
  });
});

describe("XPProgressCard level consistency", () => {
  it("derives current and next level from the same level prop", () => {
    const html = renderToStaticMarkup(<XPProgressCard totalXP={1240} level={3} progress={42} />);
    expect(html).toContain("Cấp 3");
    expect(html).toContain("lên cấp 4");
    expect(html).not.toContain("cấp 6");
  });

  it("clamps progress to 0-100", () => {
    expect(renderToStaticMarkup(<XPProgressCard totalXP={0} level={1} progress={250} />)).toContain("100%");
    expect(renderToStaticMarkup(<XPProgressCard totalXP={0} level={1} progress={-5} />)).toContain("0%");
  });
});
