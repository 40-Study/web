import Link from "next/link";
import { ArrowRight, Bot, Route, Smartphone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const HIGHLIGHTS = [
  { icon: Bot, label: "Trợ giảng AI 24/7" },
  { icon: Route, label: "Lộ trình cá nhân hóa" },
  { icon: Smartphone, label: "Học trên web và di động" },
];

const AVATARS = [
  { initials: "LA", tone: "bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-200" },
  { initials: "MH", tone: "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-100" },
  { initials: "TK", tone: "bg-primary-600 text-white dark:bg-primary-400 dark:text-slate-950" },
];

/** Hero: không dùng ScrollReveal (above-the-fold phải paint ngay). */
export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      {/* Ánh sáng radial mờ duy nhất — không particle, không shape trôi. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(60%_70%_at_50%_0%,hsl(var(--primary)/0.08),transparent)]"
      />
      <div className="relative mx-auto flex max-w-7xl flex-col items-center px-4 py-16 text-center sm:px-6 md:py-20 lg:px-8 lg:py-32">
        <Badge
          size="lg"
          variant="default"
          className="mb-6 border border-primary-100 text-sm dark:border-primary-900"
        >
          Nền tảng học tập thích ứng
        </Badge>

        <h1 className="text-display max-w-4xl text-balance text-slate-900 dark:text-slate-50">
          Khai phóng tiềm năng{" "}
          <span className="whitespace-nowrap text-primary-600 dark:text-primary-400">
            công nghệ của bạn
          </span>
        </h1>

        <p className="text-body-lg mt-6 max-w-2xl text-slate-600 dark:text-slate-300">
          Hệ thống giáo dục cá nhân hóa với trợ lý ảo AI, giúp bạn làm chủ lập trình và thiết
          kế thông qua các dự án thực tế.
        </p>

        {/* CTA hero là pill (quyết định của người dùng); các nút khác giữ 10px. */}
        <div className="mt-10 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:gap-4">
          <Link
            href="/courses"
            className={cn(
              buttonVariants({ size: "lg" }),
              "min-h-11 gap-2 rounded-pill"
            )}
          >
            Khám phá khóa học
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <Link
            href="#tinh-nang"
            className={cn(
              buttonVariants({ size: "lg", variant: "outline" }),
              "min-h-11 rounded-pill"
            )}
          >
            Xem tính năng
          </Link>
        </div>

        <div className="mt-8 flex items-center gap-3">
          <div className="flex -space-x-2" aria-hidden>
            {AVATARS.map(({ initials, tone }) => (
              <span
                key={initials}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-xs font-semibold dark:border-slate-950",
                  tone
                )}
              >
                {initials}
              </span>
            ))}
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Được 10.000+ học viên tin dùng
          </p>
        </div>

        <ul className="mt-6 flex flex-col items-center gap-x-8 gap-y-3 text-sm font-medium text-slate-600 dark:text-slate-300 sm:flex-row">
          {HIGHLIGHTS.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-primary-600 dark:text-primary-400" aria-hidden />
              {label}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
